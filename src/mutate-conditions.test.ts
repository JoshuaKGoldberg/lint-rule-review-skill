import { execFileSync, spawn, spawnSync } from "node:child_process";
import {
	chmodSync,
	existsSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	statSync,
	symlinkSync,
	utimesSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import * as ts from "typescript";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
	addedLines,
	backupPath,
	findMutants,
	parseArgs,
	parseLines,
} from "../skills/lint-rule-review-skill/scripts/mutate-conditions.ts";

const script = path.resolve(
	"skills/lint-rule-review-skill/scripts/mutate-conditions.ts",
);

const importScript = `await import(${JSON.stringify(pathToFileURL(script).href)});`;

function kinds(code: string, lines?: Set<number>) {
	return mutantsOf(code, lines).map((mutant) => `${mutant.kind}: ${mutant.to}`);
}

function mutantsOf(code: string, lines?: Set<number>) {
	return findMutants(ts, "rule.ts", code, lines);
}

function removedGuard(code: string) {
	return mutantsOf(code).find((mutant) => mutant.kind === "if-never");
}

describe(parseArgs, () => {
	it("reads pairs of names and values", () => {
		expect(parseArgs(["--file", "a.ts", "--max=3"])).toEqual({
			file: "a.ts",
			max: "3",
		});
	});

	it("rejects unknown options and stray values", () => {
		expect(() => parseArgs(["--line", "3"])).toThrow("--line");
		expect(() => parseArgs(["--lines", "1,", "2"])).toThrow("2");
	});
});

describe(parseLines, () => {
	it("expands ranges and single lines", () => {
		expect([...parseLines("2-4,9")]).toEqual([2, 3, 4, 9]);
	});

	it.each(["abc", "10-", "40-10", "10..20", "1,x", ""])(
		"rejects %j",
		(value) => {
			expect(() => parseLines(value)).toThrow("Bad line range");
		},
	);
});

describe(addedLines, () => {
	const diff = `diff --git a/src/a.ts b/src/a.ts
--- a/src/a.ts
+++ b/src/a.ts
@@ -1,3 +1,4 @@
 one
-two
+TWO
+three
 four
diff --git a/src/b.ts b/src/b.ts
--- a/src/b.ts
+++ b/src/b.ts
@@ -9,1 +9,1 @@
-x
+y
`;

	it("returns only added lines from the requested file", () => {
		expect([...addedLines(diff, "src/a.ts")]).toEqual([2, 3]);
	});

	it("matches a file path relative to a package folder", () => {
		expect([...addedLines(diff, "packages/x/src/b.ts")]).toEqual([9]);
		expect([...addedLines(diff, "b.ts")]).toEqual([9]);
	});

	it("does not match a file that only shares a name suffix", () => {
		expect([...addedLines(diff, "ab.ts")]).toEqual([]);
	});

	it("prefers an exact path over another package's same path", () => {
		const packages = `--- a/packages/a/src/r.ts
+++ b/packages/a/src/r.ts
@@ -1 +1 @@
-a
+A
--- a/packages/b/src/r.ts
+++ b/packages/b/src/r.ts
@@ -8 +8 @@
-b
+B
`;

		expect([...addedLines(packages, "packages/a/src/r.ts")]).toEqual([1]);
	});

	it("reads headers with tabs and CRLF line endings", () => {
		const header = "--- old.ts\t2026-01-01\n+++ new.ts\t2026-01-02\n";

		expect([...addedLines(`${header}@@ -1 +1 @@\n-a\n+b\n`, "new.ts")]).toEqual(
			[1],
		);
		expect([
			...addedLines("+++ b/a.ts\r\n@@ -1 +1 @@\r\n-a\r\n+b\r\n", "a.ts"),
		]).toEqual([1]);
	});

	it("reads paths git has quoted", () => {
		const quoted = '+++ "b/src/caf\\303\\251.ts"\n@@ -1 +1 @@\n-a\n+b\n';

		expect([...addedLines(quoted, "src/café.ts")]).toEqual([1]);
		expect([
			...addedLines('+++ "b/a\\"b.ts"\n@@ -1 +1 @@\n-a\n+b\n', 'a"b.ts'),
		]).toEqual([1]);
	});

	it("skips the no-newline marker in the middle of a hunk", () => {
		const marker = "+++ b/a.ts\n@@ -1 +1,2 @@\n-a\n\\ No newline\n+b\n+c\n";

		expect([...addedLines(marker, "a.ts")]).toEqual([1, 2]);
	});

	it("does not read an added line as a file header", () => {
		const added = "+++ b/a.ts\n@@ -0,0 +1,2 @@\n+++ x;\n+y;\n";

		expect([...addedLines(added, "a.ts")]).toEqual([1, 2]);
	});
});

describe(findMutants, () => {
	it("mutates if and ternary conditions", () => {
		expect(kinds("if (a) { b; }\nconst c = d ? 1 : 2;")).toEqual([
			"if-always: true",
			"if-never: false",
			"ternary-always: true",
			"ternary-never: false",
		]);
	});

	it("drops each operand of a logical expression", () => {
		expect(kinds("const x = a && b;")).toEqual([
			"drop-right-operand: a",
			"drop-left-operand: b",
		]);
	});

	it("removes negations and swaps some and every", () => {
		expect(kinds("const x = !a;\nconst y = b.some(c);")).toEqual([
			"remove-negation: a",
			"swap-some-every: every",
		]);
	});

	it("deletes call statements and non-empty switch cases", () => {
		expect(kinds("call();\nswitch (a) { case 1: break; case 2: }")).toEqual([
			"delete-call-statement: ;",
			"delete-case: ",
		]);
	});

	it("drops array elements outside of meta", () => {
		expect(
			kinds('const a = [b, c];\nconst r = { meta: { x: ["d", "e"] } };'),
		).toEqual(["drop-array-element: [c]", "drop-array-element: [b]"]);
	});

	it("drops either side of ||, but leaves other operators alone", () => {
		expect(kinds("const x = a || b;")).toEqual([
			"drop-right-operand: a",
			"drop-left-operand: b",
		]);
		expect(kinds("const x = a + b;\nconst y = c ?? d;")).toEqual([]);
	});

	it("only removes negations", () => {
		expect(kinds("const x = -a;")).toEqual([]);
	});

	it("swaps every for some, and leaves other methods alone", () => {
		expect(kinds("const x = a.every(b);\nconst y = c.map(d);")).toEqual([
			"swap-some-every: some",
		]);
	});

	it("leaves a single-element array alone", () => {
		expect(kinds("const x = [a];")).toEqual([]);
	});

	it("drops array elements from properties other than meta", () => {
		expect(kinds("const x = { y: [a, b] };")).toEqual([
			"drop-array-element: [b]",
			"drop-array-element: [a]",
		]);
	});

	it("does not repeat an identical mutant", () => {
		expect(kinds("const x = [a, a];")).toEqual(["drop-array-element: [a]"]);
	});

	it("skips a mutant that wouldn't change anything", () => {
		expect(kinds("if (true) {}")).toEqual(["if-never: false"]);
	});

	it("limits mutants to the given lines", () => {
		expect(kinds("if (a) {}\nif (b) {}", new Set([2]))).toEqual([
			"if-always: true",
			"if-never: false",
		]);
	});

	it("includes a condition when a line inside it is selected", () => {
		expect(kinds("if (\n\ta &&\n\tb &&\n\tc\n) {\n}", new Set([3]))).toEqual([
			"if-always: true",
			"if-never: false",
			"drop-left-operand: c",
			"drop-right-operand: a",
		]);
	});

	it("keeps a mutant when only some of the selected lines overlap it", () => {
		expect(kinds("if (a) {}", new Set([1, 9]))).toEqual([
			"if-always: true",
			"if-never: false",
		]);
	});

	it("only drops selected elements of a multi-line array", () => {
		expect(kinds("const a = [\n\tb,\n\tc,\n];", new Set([3]))).toEqual([
			"drop-array-element: [b]",
		]);
	});

	it("reports the line of the operand it drops", () => {
		const [dropRight] = mutantsOf("const x =\n\ta &&\n\tb;");

		expect(dropRight.line).toBe(3);
	});

	it("parses JSX in tsx and jsx files", () => {
		for (const file of ["rule.tsx", "rule.jsx"]) {
			const mutants = findMutants(ts, file, "const a = <b c={d ? 1 : 2} />;");

			expect(mutants.map((mutant) => mutant.kind)).toEqual([
				"ternary-always",
				"ternary-never",
			]);
		}
	});

	it("marks bare null-check exits as likely type-only", () => {
		expect(removedGuard("if (a == null) { return; }")?.likelyTypeOnly).toBe(
			true,
		);
		expect(removedGuard("if (a == null) { b(); }")?.likelyTypeOnly).toBe(false);
	});

	it.each([
		"if (a == null) return;",
		"if (a == null) return undefined;",
		"for (;;) { if (a == null) continue; }",
		"for (;;) { if (a == null) { continue; } }",
	])("treats %s as a bare exit", (code) => {
		expect(removedGuard(code)?.likelyTypeOnly).toBe(true);
	});

	it.each([
		"if (a == null) return 1;",
		"if (a == null) { b(); return; }",
		"if (a == null) { return 1; }",
		"if (a == null) b();",
		"if (a == null) {}",
	])("does not treat %s as a bare exit", (code) => {
		expect(removedGuard(code)?.likelyTypeOnly).toBe(false);
	});

	it("only marks the mutant that removes the guard", () => {
		const flagged = mutantsOf("if (!a) { return; }").filter(
			(mutant) => mutant.likelyTypeOnly,
		);

		expect(flagged.map((mutant) => mutant.kind)).toEqual(["if-never"]);
	});

	it.each(["a === undefined", "!a", "a.b == null"])(
		"marks %s as likely type-only",
		(condition) => {
			const guard = removedGuard(`if (${condition}) { return; }`);

			expect(guard?.likelyTypeOnly).toBe(true);
		},
	);

	it.each(["a != null", "a !== null", "b || a == null", "b && a === null"])(
		"does not mark %s as likely type-only",
		(condition) => {
			const guard = removedGuard(`if (${condition}) { return; }`);

			expect(guard?.likelyTypeOnly).toBe(false);
		},
	);
});

describe("running the script", { timeout: 30_000 }, () => {
	const rule = `export function check(value) {
	if (value === 1) return "one";
	return value > 2 && value < 9 ? "mid" : "other";
}
`;
	const test = `import assert from "node:assert";
import { check } from "./rule.mjs";
assert.equal(check(1), "one");
assert.equal(check(5), "mid");
assert.equal(check(0), "other");
`;
	let directory: string;

	beforeEach(() => {
		directory = mkdtempSync(path.join(tmpdir(), "mutate-conditions-"));
		writeFileSync(path.join(directory, "rule.mjs"), rule);
		writeFileSync(path.join(directory, "check.mjs"), test);
	});

	afterEach(() => {
		rmSync(directory, { force: true, recursive: true });
	});

	const scriptArguments = (...extra: string[]) => [
		script,
		"--file",
		"rule.mjs",
		"--typescript",
		path.resolve("node_modules/typescript"),
		...extra,
	];

	function git(...args: string[]) {
		execFileSync(
			"git",
			["-c", "user.email=a@b.c", "-c", "user.name=a", ...args],
			{ cwd: directory, stdio: "ignore" },
		);
	}

	function run(...extra: string[]) {
		return spawnSync("node", scriptArguments(...extra), {
			cwd: directory,
			encoding: "utf8",
		});
	}

	function readRule() {
		return readFileSync(path.join(directory, "rule.mjs"), "utf8");
	}

	function reportOf(result: { stdout: string }) {
		return JSON.parse(result.stdout) as {
			skipped: number;
			survivors: { kind: string; line: number; to: string }[];
			tested: number;
			timeouts: number;
		};
	}

	async function waitFor(condition: () => boolean) {
		await expect.poll(condition, { interval: 50, timeout: 10_000 }).toBe(true);
	}

	it("reports only the survivors and restores the rule", () => {
		const result = run("--test", "node check.mjs");

		expect(result.status).toBe(0);
		expect(reportOf(result).timeouts).toBe(0);
		expect(reportOf(result).survivors).toEqual([
			expect.objectContaining({
				kind: "drop-right-operand",
				to: "value > 2",
			}),
		]);
		expect(result.stderr).toMatch(/\[\d+\/\d+\] fail rule\.mjs:2 if-always/);
		expect(result.stderr).toMatch(/SURVIVED rule\.mjs:3 drop-right-operand/);
		expect(result.stderr).toContain("\n  rule.mjs:3 drop-right-operand\n");
		expect(readRule()).toBe(rule);
		expect(existsSync(backupPath(path.join(directory, "rule.mjs")))).toBe(
			false,
		);
	});

	it("adds nothing to the rule's folder during a run", () => {
		const result = run(
			"--test",
			'node rule.mjs && test "$(ls | wc -l)" -eq 2',
			"--max",
			"1",
		);

		expect(result.status).toBe(0);
	});

	it("leaves no lock behind when the rule can't be written", () => {
		const rulePath = path.join(directory, "rule.mjs");

		chmodSync(rulePath, 0o444);

		const result = run("--test", "node rule.mjs");

		expect(result.status).toBe(2);
		expect(result.stderr).toContain("EACCES");
		expect(existsSync(backupPath(rulePath))).toBe(false);
	});

	it.each(["--base", "--diff", "--lines"])(
		"refuses an empty %s instead of mutating the whole file",
		(option) => {
			const result = run("--test", "node rule.mjs", option, "");

			expect(result.status).toBe(2);
			expect(readRule()).toBe(rule);
		},
	);

	it("points out survivors that are likely type-only", () => {
		writeFileSync(
			path.join(directory, "rule.mjs"),
			"export function check(value) {\n\tif (value == null) return;\n}\n",
		);

		const result = run("--test", "node rule.mjs", "--lines", "2");

		expect(result.stderr).toContain("rule.mjs:2 if-never (likely type-only)");
		expect(result.stderr).toContain("rule.mjs:2 if-always\n");
	});

	it("keeps the original in the backup after being killed outright", async () => {
		const rulePath = path.join(directory, "rule.mjs");
		const backup = backupPath(rulePath);
		const child = spawn(
			"node",
			scriptArguments("--test", "node rule.mjs && sleep 0.2"),
			{ cwd: directory, stdio: "ignore" },
		);
		const exited = new Promise((resolve) => {
			child.on("close", resolve);
		});

		await waitFor(() => readRule() !== rule);

		child.kill("SIGKILL");
		await exited;

		const saved = readFileSync(backup, "utf8");

		rmSync(backup);

		expect(saved).toBe(rule);
	});

	it("limits mutants with --max and reports the rest as skipped", () => {
		const report = reportOf(run("--test", "node check.mjs", "--max", "2"));

		expect(report.tested).toBe(2);
		expect(report.skipped).toBeGreaterThan(0);
	});

	it("writes the report to --out", () => {
		const result = run("--test", "node rule.mjs", "--out", "report.json");

		expect(result.stdout).toBe("");
		expect(
			reportOf({
				stdout: readFileSync(path.join(directory, "report.json"), "utf8"),
			}).tested,
		).toBeGreaterThan(0);
	});

	it("fails before testing when --out can't be written", () => {
		const result = run("--test", "node rule.mjs", "--out", "no/such/file");

		expect(result.status).toBe(2);
		expect(result.stderr).toContain("ENOENT");
	});

	it("limits mutants with --diff, using the path from the repo root", () => {
		writeFileSync(
			path.join(directory, "pr.diff"),
			"+++ b/rule.mjs\n@@ -2 +2 @@\n-x\n+y\n",
		);

		const report = reportOf(
			run("--test", "node rule.mjs", "--diff", "pr.diff"),
		);

		expect(report.survivors.map(({ line }) => line)).toEqual([2, 2]);
	});

	it("accepts a --file that starts with ./ for --diff", () => {
		writeFileSync(
			path.join(directory, "pr.diff"),
			"+++ b/rule.mjs\n@@ -2 +2 @@\n-x\n+y\n",
		);

		const result = spawnSync(
			"node",
			[
				...scriptArguments("--test", "node rule.mjs", "--diff", "pr.diff"),
				"--file",
				"./rule.mjs",
			],
			{ cwd: directory, encoding: "utf8" },
		);

		expect(reportOf(result).tested).toBe(2);
	});

	it("refuses a selection that matches nothing", () => {
		writeFileSync(path.join(directory, "pr.diff"), "");

		const result = run("--test", "node rule.mjs", "--diff", "pr.diff");

		expect(result.status).toBe(2);
		expect(result.stderr).toContain("selected nothing");
	});

	it("counts mutants that time out without calling them survivors", () => {
		const report = reportOf(
			run(
				"--test",
				"test -f ready && sleep 5; touch ready",
				"--max",
				"1",
				"--timeout",
				"0.5",
			),
		);

		expect(report.timeouts).toBe(1);
		expect(report.survivors).toEqual([]);
	});

	it("finishes the run when the reader of its output goes away", () => {
		const command = scriptArguments(
			"--test",
			"node rule.mjs",
			"--out",
			"report.json",
		)
			.map((arg) => JSON.stringify(arg))
			.join(" ");
		const result = spawnSync(
			"sh",
			["-c", `node ${command} 2>&1 | head -c 1 >/dev/null`],
			{ cwd: directory, encoding: "utf8" },
		);

		expect(result.status).toBe(0);
		expect(readRule()).toBe(rule);
		expect(
			reportOf({
				stdout: readFileSync(path.join(directory, "report.json"), "utf8"),
			}).tested,
		).toBeGreaterThan(0);
	});

	it("restores bytes that aren't valid UTF-8", () => {
		const bytes = Buffer.concat([Buffer.from(rule), Buffer.from([0xe9, 0x0a])]);

		writeFileSync(path.join(directory, "rule.mjs"), bytes);

		run("--test", "true");

		expect(readFileSync(path.join(directory, "rule.mjs"))).toEqual(bytes);
	});

	it("keeps the backup inside .git when there is one", () => {
		git("init");

		expect(backupPath(path.join(directory, "rule.mjs"))).toContain(
			`${path.sep}.git${path.sep}`,
		);
	});

	it("uses one backup for every name of a file", () => {
		const alias = path.join(directory, "alias.mjs");

		symlinkSync("rule.mjs", alias);

		expect(backupPath(alias)).toBe(
			backupPath(path.join(directory, "rule.mjs")),
		);
	});

	it("does not touch the rule when there's nothing to mutate", () => {
		const rulePath = path.join(directory, "rule.mjs");

		utimesSync(rulePath, 1000, 1000);

		const result = run("--test", "node rule.mjs", "--lines", "99");

		expect(result.status).toBe(0);
		expect(statSync(rulePath).mtimeMs).toBe(1_000_000);
		expect(existsSync(backupPath(rulePath))).toBe(false);
	});

	it("keeps an existing --out file when a run fails early", () => {
		const out = path.join(directory, "report.json");

		writeFileSync(out, "previous");
		run("--test", "node missing.mjs", "--out", "report.json");

		expect(readFileSync(out, "utf8")).toBe("previous");
	});

	it("leaves a run in progress alone", async () => {
		const child = spawn(
			"node",
			scriptArguments("--test", "node rule.mjs && sleep 0.3"),
			{ cwd: directory, stdio: "ignore" },
		);
		const exited = new Promise((resolve) => {
			child.on("close", resolve);
		});

		await waitFor(() => readRule() !== rule);

		const mutated = readRule();
		const second = run("--test", "node rule.mjs", "--lines", "2");
		const during = readRule();

		await exited;

		expect(second.status).toBe(1);
		expect(during).not.toBe(rule);
		expect(mutated).not.toBe(rule);
		expect(readRule()).toBe(rule);
	});

	it("refuses to run while a backup exists, whatever the selection", () => {
		const backup = backupPath(path.join(directory, "rule.mjs"));

		mkdirSync(path.dirname(backup), { recursive: true });
		writeFileSync(backup, "original");

		const result = run("--test", "node rule.mjs", "--lines", "99");

		rmSync(backup);

		expect(result.status).toBe(1);
		expect(result.stderr).toContain(`diff "${backup}" "rule.mjs"`);
		expect(result.stderr).not.toContain("cp ");
	});

	it("refuses to run while a backup exists, and leaves it alone", () => {
		const backup = backupPath(path.join(directory, "rule.mjs"));

		mkdirSync(path.dirname(backup), { recursive: true });
		writeFileSync(backup, "original");

		const result = run("--test", "node rule.mjs");
		const kept = readFileSync(backup, "utf8");

		rmSync(backup);

		expect(result.status).toBe(1);
		expect(result.stderr).toContain("already exists");
		expect(kept).toBe("original");
		expect(readRule()).toBe(rule);
	});

	it("kills anything a test run leaves in the background", () => {
		// The baseline run leaves a process behind, and the mutant's run passes only if it's gone.
		const result = run(
			"--test",
			'node rule.mjs && if test -f pid; then ! kill -0 "$(cat pid)" 2>/dev/null; else sleep 20 & echo $! > pid; fi',
			"--max",
			"1",
		);

		expect(reportOf(result).survivors).toHaveLength(1);
	});

	it("refuses to start when the tests already fail", () => {
		const result = run("--test", "node missing.mjs");

		expect(result.status).toBe(1);
		expect(result.stderr).toContain("Tests fail before any mutation");
	});

	it.each([
		["a file", ["importer.mjs"]],
		["--eval", ["--input-type=module", "--eval", importScript]],
	])("does nothing when imported from %s", (_, args) => {
		writeFileSync(path.join(directory, "importer.mjs"), importScript);

		const result = spawnSync("node", args, {
			cwd: directory,
			encoding: "utf8",
		});

		expect(result.status).toBe(0);
		expect(result.stderr).toBe("");
	});

	it("explains a timeout before any mutation", () => {
		const result = run("--test", "sleep 5", "--timeout", "0.1");

		expect(result.status).toBe(1);
		expect(result.stderr).toContain("Raise --timeout");
	});

	it("refuses a test command that never loads the rule", () => {
		const result = run("--test", "node --version");

		expect(result.status).toBe(1);
		expect(result.stderr).toContain("doesn't exercise it");
		expect(readRule()).toBe(rule);
	});

	it("says when there's nothing to mutate", () => {
		const result = run("--test", "node rule.mjs", "--lines", "99");

		expect(result.status).toBe(0);
		expect(result.stderr).toContain("No mutants found");
		expect(reportOf(result).tested).toBe(0);
	});

	it("rejects options it doesn't know", () => {
		const result = run("--test", "node rule.mjs", "--line", "3");

		expect(result.status).toBe(2);
		expect(result.stderr).toContain("Usage:");
	});

	it("rejects bad line ranges", () => {
		const result = run("--test", "node rule.mjs", "--lines", "10..20");

		expect(result.status).toBe(2);
		expect(result.stderr).toContain("Bad line range");
	});

	it.each([
		["--max", "soon"],
		["--timeout", "soon"],
		["--timeout", "0"],
		["--timeout", "3000000"],
	])("rejects %s %s", (option, value) => {
		const result = run("--test", "node rule.mjs", option, value);

		expect(result.status).toBe(2);
		expect(result.stderr).toContain("Usage:");
	});

	it.each([
		["--file", ["--test", "true"]],
		["--test", ["--file", "rule.mjs"]],
	])("requires %s", (_, args) => {
		const result = spawnSync("node", [script, ...args], {
			cwd: directory,
			encoding: "utf8",
		});

		expect(result.status).toBe(2);
		expect(result.stderr).toContain("Usage:");
	});

	it("finds typescript from the working folder by default", () => {
		const result = spawnSync(
			"node",
			[
				script,
				"--file",
				path.join(directory, "rule.mjs"),
				"--test",
				"true",
				"--lines",
				"99",
			],
			{ encoding: "utf8" },
		);

		expect(result.status).toBe(0);
		expect(result.stderr).toContain("No mutants found");
	});

	it("explains a --typescript path that can't be loaded", () => {
		const result = spawnSync(
			"node",
			[
				script,
				"--file",
				"rule.mjs",
				"--test",
				"true",
				"--typescript",
				"missing",
			],
			{ cwd: directory, encoding: "utf8" },
		);

		expect(result.status).toBe(2);
		expect(result.stderr).toContain("Could not resolve `typescript`");
	});

	it("explains a typescript with no parsing API", () => {
		writeFileSync(
			path.join(directory, "typescript.cjs"),
			'module.exports = { version: "7.0.0" };',
		);

		const result = spawnSync(
			"node",
			[
				script,
				"--file",
				"rule.mjs",
				"--test",
				"true",
				"--typescript",
				"typescript.cjs",
			],
			{ cwd: directory, encoding: "utf8" },
		);

		expect(result.status).toBe(2);
		expect(result.stderr).toContain("typescript 7.0.0 has no createSourceFile");
	});

	it("runs through a symlink to the script", () => {
		const link = path.join(directory, "link.ts");

		symlinkSync(script, link);

		const [, ...args] = scriptArguments("--test", "node rule.mjs");
		const result = spawnSync("node", [link, ...args], {
			cwd: directory,
			encoding: "utf8",
		});

		expect(result.stderr).toContain("mutants survived");
	});

	it("limits --base to lines changed since the fork point", () => {
		const original =
			"export const a = (x) => (x ? 1 : 2);\nexport const b = 1;\n";
		const write = (text: string) => {
			writeFileSync(path.join(directory, "rule.mjs"), text);
		};

		git("init", "--initial-branch=base");
		write(original);
		git("add", "rule.mjs");
		git("commit", "--message=first");
		git("checkout", "-b", "pr");
		write(original.replace("b = 1", "b = (x) => (x ? 3 : 4)"));
		git("commit", "--all", "--message=pr");
		git("checkout", "base");
		write(original.replace("1 : 2", "5 : 6"));
		git("commit", "--all", "--message=moved-on");
		git("checkout", "pr");

		const report = reportOf(run("--test", "node rule.mjs", "--base", "base"));

		expect(report.survivors.map(({ line }) => line)).toEqual([2, 2]);
	});

	it("does not take --base lines from another file with the same ending", () => {
		const nested = path.join(directory, "packages", "x");

		mkdirSync(nested, { recursive: true });
		writeFileSync(path.join(nested, "rule.mjs"), rule);
		git("init", "--initial-branch=base");
		git("add", ".");
		git("commit", "--message=first");
		git("config", "diff.mnemonicPrefix", "true");
		writeFileSync(path.join(nested, "rule.mjs"), `${rule}// changed\n`);

		const result = run("--test", "node rule.mjs", "--base", "base");

		expect(result.status).toBe(2);
		expect(result.stderr).toContain("selected nothing");
	});

	it("finds a --base file above the folder it's run from", () => {
		const nested = path.join(directory, "packages", "x");

		mkdirSync(nested, { recursive: true });
		git("init", "--initial-branch=base");
		git("add", ".");
		git("commit", "--message=first");
		git("config", "diff.relative", "true");
		writeFileSync(
			path.join(directory, "rule.mjs"),
			`${rule}export const b = (x) => (x ? 3 : 4);\n`,
		);

		const [, , , ...rest] = scriptArguments(
			"--test",
			"node ../../rule.mjs",
			"--base",
			"base",
		);
		const result = spawnSync(
			"node",
			[script, "--file", "../../rule.mjs", ...rest],
			{ cwd: nested, encoding: "utf8" },
		);

		expect(reportOf(result).tested).toBe(2);
	});

	it("limits --base to changed lines of a renamed file", () => {
		const padding = "// padding\n".repeat(20);
		const original = `${padding}export const a = (x) => (x ? 1 : 2);\n`;

		rmSync(path.join(directory, "rule.mjs"));
		writeFileSync(path.join(directory, "old.mjs"), original);
		git("init", "--initial-branch=base");
		git("add", "old.mjs");
		git("commit", "--message=first");
		git("checkout", "-b", "pr");
		git("mv", "old.mjs", "rule.mjs");
		writeFileSync(
			path.join(directory, "rule.mjs"),
			`${original}export const b = (x) => (x ? 3 : 4);\n`,
		);
		git("commit", "--all", "--message=pr");

		// None of the user's git settings should change how the diff reads.
		git("config", "color.ui", "always");
		git("config", "diff.external", "false");
		git("config", "diff.mnemonicPrefix", "true");
		git("config", "diff.renames", "false");

		const report = reportOf(run("--test", "node rule.mjs", "--base", "base"));

		expect(report.survivors.map(({ line }) => line)).toEqual([22, 22]);
	});

	it("kills everything the test command started on timeout", async () => {
		const marker = path.join(directory, "still-running");

		const result = run(
			"--test",
			`test -f ready && (sleep 1; touch "${marker}") & touch ready; wait`,
			"--max",
			"1",
			"--timeout",
			"0.5",
		);

		await new Promise((resolve) => setTimeout(resolve, 1500));

		expect(reportOf(result).timeouts).toBe(1);
		expect(existsSync(marker)).toBe(false);
	});

	it("kills the running tests when stopped", async () => {
		const started = path.join(directory, "started");
		const marker = path.join(directory, "still-running");
		const child = spawn(
			"node",
			scriptArguments(
				"--test",
				`test -f "${started}" && sleep 1 && touch "${marker}"; touch "${started}"`,
			),
			{ cwd: directory, stdio: "ignore" },
		);
		const exited = new Promise((resolve) => {
			child.on("close", resolve);
		});

		await waitFor(
			() => readFileSync(path.join(directory, "rule.mjs"), "utf8") !== rule,
		);

		child.kill("SIGTERM");
		await exited;
		await new Promise((resolve) => setTimeout(resolve, 1500));

		expect(existsSync(marker)).toBe(false);
	});

	it.each([
		"SIGABRT",
		"SIGALRM",
		"SIGHUP",
		"SIGINT",
		"SIGQUIT",
		"SIGTERM",
		"SIGUSR2",
	] as const)("restores the rule and stops on %s", async (signal) => {
		const started = path.join(directory, "started");
		const rulePath = path.join(directory, "rule.mjs");
		const child = spawn(
			"node",
			scriptArguments(
				"--test",
				`test -f "${started}" && sleep 30; touch "${started}"`,
			),
			{ cwd: directory, stdio: "ignore" },
		);
		const exited = new Promise<null | number>((resolve) => {
			child.on("close", resolve);
		});

		// The baseline run makes the marker, so the first mutant's run is the one that sleeps.
		await waitFor(() => readFileSync(rulePath, "utf8") !== rule);

		child.kill(signal);

		expect(await exited).toBeGreaterThan(128);
		expect(readFileSync(rulePath, "utf8")).toBe(rule);
	});
});
