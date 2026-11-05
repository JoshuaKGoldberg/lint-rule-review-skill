// Mutates conditions in one rule file, runs its tests after each change, and lists mutants that survive.
// A survivor means no test noticed the change: either a test is missing or the code is dead.
// Run from the target repo root, so its own `typescript` package is used. Needs Node 22.18 or newer.
//
//   node mutate-conditions.ts --file src/rules/foo.ts --test "pnpm vitest run foo"
//     Limit to changed lines with one of: --base origin/main | --diff pr.diff | --lines 10-40,55
//     Other options: [--max 60] [--timeout 180] [--out results.json] [--typescript <path to a typescript 5 or 6 package>]
//
// This edits the rule file in place, so don't run anything else against the rule until it finishes.
// Survivors marked likelyTypeOnly are bare null-check early exits, which often exist only for the compiler.
import type * as TS from "typescript";

import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";

export interface Mutant {
	end: number;
	from: string;
	kind: string;
	likelyTypeOnly: boolean;
	line: number;
	start: number;
	to: string;
}

type Args = Partial<Record<string, string>>;

const nullCheck = /(?:==|!=)=? *(?:null|undefined)$|^!\w+$/;

const usage =
	'Usage: --file <rule> --test "<command>" [--base <ref> | --diff <file> | --lines 10-40,55] [--max 60] [--timeout 180] [--out <file>]';

/**
 * Reads added line numbers for one file from a unified diff with any amount of context.
 */
export function addedLines(diff: string, file: string) {
	const lines = new Set<number>();
	let inFile = false;
	let line = 0;

	for (const text of diff.split("\n")) {
		if (text.startsWith("+++ ")) {
			const target = text.slice(4).replace(/^b\//, "");
			inFile =
				target === file ||
				file.endsWith(`/${target}`) ||
				target.endsWith(`/${file}`);
		} else if (text.startsWith("@@")) {
			line = Number(/\+(\d+)/.exec(text)?.[1]);
		} else if (inFile && text.startsWith("+")) {
			lines.add(line++);
		} else if (inFile && !text.startsWith("-") && !text.startsWith("\\")) {
			line++;
		}
	}

	return lines;
}

/**
 * Lists mutants for a source file, optionally limited to a set of line numbers.
 */
export function findMutants(
	ts: typeof TS,
	file: string,
	original: string,
	lines?: Set<number>,
) {
	const source = ts.createSourceFile(
		file,
		original,
		ts.ScriptTarget.Latest,
		true,
		file.endsWith("x") ? ts.ScriptKind.TSX : undefined,
	);
	const mutants: Mutant[] = [];
	const seen = new Set<string>();
	const textOf = (node: TS.Node) =>
		original.slice(node.getStart(source), node.end);

	function isBareExit(statement: TS.Statement) {
		const inner =
			ts.isBlock(statement) && statement.statements.length === 1
				? statement.statements[0]
				: statement;

		return (
			ts.isContinueStatement(inner) ||
			(ts.isReturnStatement(inner) &&
				(!inner.expression || textOf(inner.expression) === "undefined"))
		);
	}

	function add(node: TS.Node, replacement: string, kind: string) {
		const start = node.getStart(source);
		const line = source.getLineAndCharacterOfPosition(start).line + 1;
		const key = `${String(start)}:${String(node.end)}:${replacement}`;

		if (
			(lines && !lines.has(line)) ||
			textOf(node) === replacement ||
			seen.has(key)
		) {
			return;
		}

		seen.add(key);

		const { parent } = node;

		mutants.push({
			end: node.end,
			from: textOf(node),
			kind,
			likelyTypeOnly:
				ts.isIfStatement(parent) &&
				parent.expression === node &&
				nullCheck.test(textOf(node)) &&
				isBareExit(parent.thenStatement),
			line,
			start,
			to: replacement,
		});
	}

	// Skips arrays in `meta`, such as message text and schema enums, which tests rarely pin down.
	function isInMeta(node: TS.Node) {
		return !!ts.findAncestor(
			node,
			(ancestor) =>
				ts.isPropertyAssignment(ancestor) && textOf(ancestor.name) === "meta",
		);
	}

	function visit(node: TS.Node) {
		if (ts.isIfStatement(node)) {
			add(node.expression, "true", "if-always");
			add(node.expression, "false", "if-never");
		} else if (ts.isConditionalExpression(node)) {
			add(node.condition, "true", "ternary-always");
			add(node.condition, "false", "ternary-never");
		} else if (
			ts.isBinaryExpression(node) &&
			(node.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken ||
				node.operatorToken.kind === ts.SyntaxKind.BarBarToken)
		) {
			add(node, textOf(node.left), "drop-right-operand");
			add(node, textOf(node.right), "drop-left-operand");
		} else if (
			ts.isPrefixUnaryExpression(node) &&
			node.operator === ts.SyntaxKind.ExclamationToken
		) {
			add(node, textOf(node.operand), "remove-negation");
		} else if (
			ts.isCallExpression(node) &&
			ts.isPropertyAccessExpression(node.expression) &&
			["every", "some"].includes(node.expression.name.text)
		) {
			const { name } = node.expression;

			add(name, name.text === "some" ? "every" : "some", "swap-some-every");
		} else if (
			ts.isExpressionStatement(node) &&
			ts.isCallExpression(node.expression)
		) {
			add(node, ";", "delete-call-statement");
		} else if (ts.isCaseClause(node) && node.statements.length > 0) {
			add(node, "", "delete-case");
		} else if (
			ts.isArrayLiteralExpression(node) &&
			node.elements.length > 1 &&
			!isInMeta(node)
		) {
			for (const element of node.elements) {
				const others = node.elements
					.filter((other) => other !== element)
					.map(textOf);

				add(node, `[${others.join(", ")}]`, "drop-array-element");
			}
		}

		ts.forEachChild(node, visit);
	}

	visit(source);

	return mutants;
}

/**
 * Parses `--name value` pairs.
 */
export function parseArgs(argv: string[]): Args {
	return Object.fromEntries(
		argv.flatMap((arg, i) =>
			arg.startsWith("--") ? [[arg.slice(2), argv[i + 1]]] : [],
		),
	);
}

/**
 * Expands a value like `10-12,55` into a set of line numbers.
 */
export function parseLines(value: string) {
	return new Set(
		value.split(",").flatMap((range) => {
			const [start, end = start] = range.split("-").map(Number);

			return Array.from({ length: end - start + 1 }, (_, i) => start + i);
		}),
	);
}

function changedLines(args: Args, file: string) {
	if (args.lines) {
		return parseLines(args.lines);
	}

	if (args.diff) {
		return addedLines(readFileSync(args.diff, "utf8"), file);
	}

	if (args.base) {
		const diff = execFileSync("git", ["diff", "-U0", args.base, "--", file], {
			encoding: "utf8",
		});

		return addedLines(diff, file);
	}

	return undefined;
}

function loadTypeScript(typescriptPath: string | undefined) {
	const require = createRequire(path.join(process.cwd(), "noop.js"));
	let ts: typeof TS;

	try {
		ts = require(
			typescriptPath ? path.resolve(typescriptPath) : "typescript",
		) as typeof TS;
	} catch {
		console.error(
			"Could not resolve `typescript`. Run from the repo root after installing dependencies, or pass --typescript.",
		);
		return undefined;
	}

	// TypeScript 7 has no createSourceFile. Parsing is all this script needs, so any older copy works.
	if (!("createSourceFile" in ts)) {
		console.error(`typescript ${(ts as typeof TS).version} has no createSourceFile API. Install an older copy outside the repo and pass it:
  npm install --prefix /tmp/mutate-ts typescript@6
  ... --typescript /tmp/mutate-ts/node_modules/typescript`);
		return undefined;
	}

	return ts;
}

function main() {
	const args = parseArgs(process.argv.slice(2));
	const { file, test } = args;

	if (!file || !test) {
		console.error(usage);
		return 2;
	}

	const ts = loadTypeScript(args.typescript);

	if (!ts) {
		return 2;
	}

	const maxMutants = Number(args.max ?? 60);
	const timeout = Number(args.timeout ?? 180) * 1000;
	const original = readFileSync(file, "utf8");
	const mutants = findMutants(ts, file, original, changedLines(args, file));

	const restore = () => {
		writeFileSync(file, original);
	};

	for (const signal of ["SIGINT", "SIGTERM"] as const) {
		process.on(signal, () => {
			restore();
			// eslint-disable-next-line n/no-process-exit -- the signal would otherwise be swallowed
			process.exit(130);
		});
	}

	const runTests = () => {
		const result = spawnSync(test, { shell: true, stdio: "ignore", timeout });

		if (result.error?.message.includes("ETIMEDOUT")) {
			return "timeout";
		}

		return result.status === 0 ? "pass" : "fail";
	};

	if (runTests() !== "pass") {
		console.error(
			"Tests fail before any mutation, so results would mean nothing. Fix the test command first.",
		);
		return 1;
	}

	const selected = mutants.slice(0, maxMutants);
	const survivors: Mutant[] = [];
	let timeouts = 0;

	try {
		for (const [i, mutant] of selected.entries()) {
			writeFileSync(
				file,
				original.slice(0, mutant.start) +
					mutant.to +
					original.slice(mutant.end),
			);

			const outcome = runTests();

			if (outcome === "pass") {
				survivors.push(mutant);
			} else if (outcome === "timeout") {
				timeouts++;
			}

			console.error(
				`[${String(i + 1)}/${String(selected.length)}] ${outcome === "pass" ? "SURVIVED" : outcome} ${file}:${String(mutant.line)} ${mutant.kind}`,
			);
		}
	} finally {
		restore();
	}

	const report = JSON.stringify(
		{
			file,
			found: mutants.length,
			skipped: mutants.length - selected.length,
			survivors: survivors.map(({ from, kind, likelyTypeOnly, line, to }) => ({
				from: from.slice(0, 200),
				kind,
				likelyTypeOnly,
				line,
				to: to.slice(0, 200),
			})),
			tested: selected.length,
			timeouts,
		},
		null,
		"\t",
	);

	if (args.out) {
		writeFileSync(args.out, report);
	} else {
		console.log(report);
	}

	// Last, so that this short list survives being piped through tail.
	console.error(
		`\n${String(survivors.length)} of ${String(selected.length)} mutants survived (${String(mutants.length - selected.length)} not tested, ${String(timeouts)} timed out):`,
	);

	if (selected.length > 3 && survivors.length === selected.length) {
		console.error(
			"  Every mutant survived, so the test command probably doesn't exercise this file. Check it before reading anything into this.",
		);
	}

	for (const { kind, likelyTypeOnly, line } of survivors) {
		console.error(
			`  ${file}:${String(line)} ${kind}${likelyTypeOnly ? " (likely type-only)" : ""}`,
		);
	}

	return 0;
}

if (
	process.argv[1] &&
	import.meta.url === pathToFileURL(process.argv[1]).href
) {
	process.exitCode = main();
}
