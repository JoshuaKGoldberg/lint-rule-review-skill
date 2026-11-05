#!/usr/bin/env node
// Mutates conditions in one rule file, runs its tests after each change, and lists mutants that survive.
// A survivor means no test noticed the change: either a test is missing or the code is dead.
// Run from the target repo root, so its own `typescript` package is used.
//
//   node mutate-conditions.mjs --file src/rules/foo.ts --test "pnpm vitest run foo"
//     Limit to changed lines with one of: --base origin/main | --diff pr.diff | --lines 10-40,55
//     Other options: [--max 60] [--timeout 180] [--out results.json] [--typescript <path to a typescript 5 or 6 package>]
//
// This edits the rule file in place, so don't run anything else against the rule until it finishes.
// Survivors marked likelyTypeOnly are bare null-check early exits, which often exist only for the compiler.
import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";

const typeScriptHelp = `Install an older copy outside the repo and pass it:
  npm install --prefix /tmp/mutate-ts typescript@6
  ... --typescript /tmp/mutate-ts/node_modules/typescript`;

const nullCheck = /(==|!=)=? *(null|undefined)$|^!\w+$/;

/** Parses `--name value` pairs. */
export function parseArgs(argv) {
	return Object.fromEntries(
		argv.flatMap((arg, i) =>
			arg.startsWith("--") ? [[arg.slice(2), argv[i + 1]]] : [],
		),
	);
}

/** Expands a value like `10-12,55` into a set of line numbers. */
export function parseLines(value) {
	return new Set(
		value.split(",").flatMap((range) => {
			const [start, end = start] = range.split("-").map(Number);
			return Array.from({ length: end - start + 1 }, (_, i) => start + i);
		}),
	);
}

/** Reads added line numbers for one file from a unified diff with any amount of context. */
export function addedLines(diff, file) {
	const lines = new Set();
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
			line = Number(/\+(\d+)/.exec(text)[1]);
		} else if (inFile && text.startsWith("+")) {
			lines.add(line++);
		} else if (inFile && !text.startsWith("-") && !text.startsWith("\\")) {
			line++;
		}
	}

	return lines;
}

/** Lists mutants for a source file, optionally limited to a set of line numbers. */
export function findMutants(ts, file, original, lines) {
	const source = ts.createSourceFile(
		file,
		original,
		ts.ScriptTarget.Latest,
		true,
		file.endsWith("x") ? ts.ScriptKind.TSX : undefined,
	);
	const textOf = (node) => original.slice(node.getStart(source), node.end);
	const mutants = [];
	const seen = new Set();

	function isBareExit(statement) {
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

	function add(node, replacement, kind) {
		const start = node.getStart(source);
		const line = source.getLineAndCharacterOfPosition(start).line + 1;
		const key = `${start}:${node.end}:${replacement}`;
		if (
			(lines && !lines.has(line)) ||
			textOf(node) === replacement ||
			seen.has(key)
		) {
			return;
		}

		seen.add(key);
		const { parent } = node;
		const likelyTypeOnly =
			ts.isIfStatement(parent) &&
			parent.expression === node &&
			nullCheck.test(textOf(node)) &&
			isBareExit(parent.thenStatement);
		mutants.push({
			start,
			end: node.end,
			line,
			kind,
			likelyTypeOnly,
			from: textOf(node),
			to: replacement,
		});
	}

	// Skips arrays in `meta`, such as message text and schema enums, which tests rarely pin down.
	function isInMeta(node) {
		for (let current = node.parent; current; current = current.parent) {
			if (
				ts.isPropertyAssignment(current) &&
				current.name.getText(source) === "meta"
			) {
				return true;
			}
		}

		return false;
	}

	function visit(node) {
		if (ts.isIfStatement(node)) {
			add(node.expression, "true", "if-always");
			add(node.expression, "false", "if-never");
		} else if (ts.isConditionalExpression(node)) {
			add(node.condition, "true", "ternary-always");
			add(node.condition, "false", "ternary-never");
		} else if (
			ts.isBinaryExpression(node) &&
			[
				ts.SyntaxKind.AmpersandAmpersandToken,
				ts.SyntaxKind.BarBarToken,
			].includes(node.operatorToken.kind)
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
			["some", "every"].includes(node.expression.name.text)
		) {
			add(
				node.expression.name,
				node.expression.name.text === "some" ? "every" : "some",
				"swap-some-every",
			);
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

function loadTypeScript(typescriptPath) {
	const require = createRequire(path.join(process.cwd(), "noop.js"));
	let ts;
	try {
		ts = require(typescriptPath ? path.resolve(typescriptPath) : "typescript");
	} catch {
		console.error(
			"Could not resolve `typescript`. Run from the repo root after installing dependencies, or pass --typescript.",
		);
		process.exit(2);
	}

	if (typeof ts.createSourceFile !== "function") {
		// TypeScript 7 has no createSourceFile. Parsing is all this script needs, so any older copy works.
		console.error(
			`typescript ${ts.version} has no createSourceFile API. ${typeScriptHelp}`,
		);
		process.exit(2);
	}

	return ts;
}

function main() {
	const args = parseArgs(process.argv.slice(2));
	if (!args.file || !args.test) {
		console.error(
			'Usage: --file <rule> --test "<command>" [--base <ref> | --diff <file> | --lines 10-40,55] [--max 60] [--timeout 180] [--out <file>]',
		);
		process.exit(2);
	}

	const ts = loadTypeScript(args.typescript);
	const { file } = args;
	const maxMutants = Number(args.max ?? 60);
	const timeout = Number(args.timeout ?? 180) * 1000;
	const original = readFileSync(file, "utf8");

	let lines;
	if (args.lines) {
		lines = parseLines(args.lines);
	} else if (args.diff) {
		lines = addedLines(readFileSync(args.diff, "utf8"), file);
	} else if (args.base) {
		lines = addedLines(
			execFileSync("git", ["diff", "-U0", args.base, "--", file], {
				encoding: "utf8",
			}),
			file,
		);
	}

	const mutants = findMutants(ts, file, original, lines);
	const restore = () => writeFileSync(file, original);
	for (const signal of ["SIGINT", "SIGTERM"]) {
		process.on(signal, () => {
			restore();
			process.exit(130);
		});
	}

	function runTests() {
		const result = spawnSync(args.test, {
			shell: true,
			timeout,
			stdio: "ignore",
		});
		if (result.error?.code === "ETIMEDOUT") {
			return "timeout";
		}

		return result.status === 0 ? "pass" : "fail";
	}

	if (runTests() !== "pass") {
		console.error(
			"Tests fail before any mutation, so results would mean nothing. Fix the test command first.",
		);
		process.exit(1);
	}

	const selected = mutants.slice(0, maxMutants);
	const survivors = [];
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
			}

			if (outcome === "timeout") {
				timeouts++;
			}

			console.error(
				`[${i + 1}/${selected.length}] ${outcome === "pass" ? "SURVIVED" : outcome} ${file}:${mutant.line} ${mutant.kind}`,
			);
		}
	} finally {
		restore();
	}

	const report = JSON.stringify(
		{
			file,
			found: mutants.length,
			tested: selected.length,
			skipped: mutants.length - selected.length,
			timeouts,
			survivors: survivors.map(({ line, kind, likelyTypeOnly, from, to }) => ({
				line,
				kind,
				likelyTypeOnly,
				from: from.slice(0, 200),
				to: to.slice(0, 200),
			})),
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
		`\n${survivors.length} of ${selected.length} mutants survived (${mutants.length - selected.length} not tested, ${timeouts} timed out):`,
	);
	if (selected.length > 3 && survivors.length === selected.length) {
		console.error(
			"  Every mutant survived, so the test command probably doesn't exercise this file. Check it before reading anything into this.",
		);
	}

	for (const { line, kind, likelyTypeOnly } of survivors) {
		console.error(
			`  ${file}:${line} ${kind}${likelyTypeOnly ? " (likely type-only)" : ""}`,
		);
	}
}

if (
	process.argv[1] &&
	import.meta.url === pathToFileURL(process.argv[1]).href
) {
	main();
}
