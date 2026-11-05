import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import * as ts from "typescript";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
	addedLines,
	findMutants,
	parseArgs,
	parseLines,
} from "../skills/lint-rule-review/scripts/mutate-conditions.ts";

const script = path.resolve(
	"skills/lint-rule-review/scripts/mutate-conditions.ts",
);

function kinds(code: string, lines?: Set<number>) {
	return mutantsOf(code, lines).map((mutant) => `${mutant.kind}: ${mutant.to}`);
}

function mutantsOf(code: string, lines?: Set<number>) {
	return findMutants(ts, "rule.ts", code, lines);
}

describe(parseArgs, () => {
	it("reads pairs of names and values", () => {
		expect(parseArgs(["--file", "a.ts", "--max", "3"])).toEqual({
			file: "a.ts",
			max: "3",
		});
	});
});

describe(parseLines, () => {
	it("expands ranges and single lines", () => {
		expect([...parseLines("2-4,9")]).toEqual([2, 3, 4, 9]);
	});
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

	it("limits mutants to the given lines", () => {
		expect(kinds("if (a) {}\nif (b) {}", new Set([2]))).toEqual([
			"if-always: true",
			"if-never: false",
		]);
	});

	it("marks bare null-check exits as likely type-only", () => {
		const [guard] = mutantsOf("if (a == null) { return; }");
		const [branch] = mutantsOf("if (a == null) { b(); }");

		expect(guard.likelyTypeOnly).toBe(true);
		expect(branch.likelyTypeOnly).toBe(false);
	});
});

describe("running the script", () => {
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

	function run(...extra: string[]) {
		return spawnSync(
			"node",
			[
				script,
				"--file",
				"rule.mjs",
				"--typescript",
				path.resolve("node_modules/typescript"),
				...extra,
			],
			{ cwd: directory, encoding: "utf8" },
		);
	}

	it("reports survivors and restores the rule", () => {
		const result = run("--test", "node check.mjs");
		const report = JSON.parse(result.stdout) as {
			survivors: { kind: string; to: string }[];
		};

		expect(result.status).toBe(0);
		expect(report.survivors).toContainEqual(
			expect.objectContaining({
				kind: "drop-right-operand",
				to: "value > 2",
			}),
		);
		expect(readFileSync(path.join(directory, "rule.mjs"), "utf8")).toBe(rule);
	});

	it("refuses to start when the tests already fail", () => {
		const result = run("--test", "node missing.mjs");

		expect(result.status).toBe(1);
		expect(result.stderr).toContain("Tests fail before any mutation");
	});

	it("warns when every mutant survives", () => {
		const result = run("--test", "node --version");

		expect(result.stderr).toContain("Every mutant survived");
	});
});
