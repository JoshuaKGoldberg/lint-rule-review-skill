// Temporary harness: runs literal cases through a rule's head and base versions and records what differs.
// Copy it beside the rule's tests, adjust the marked lines, run it with the repo's test runner, then delete it.
// Written for ESLint-style rules with typed linting, and suits typescript-eslint directly.
// For a new rule with no base version, import the rule as both `head` and `base`.
import { Linter } from 'eslint';
import { appendFileSync, writeFileSync } from 'node:fs';
import * as path from 'node:path';
import { it } from 'vitest';

import * as parser from '@typescript-eslint/parser';

import head from '../../src/rules/RULE'; // ADJUST
import base from '../../src/rules/RULE.base-tmp'; // ADJUST: saved beside the rule so that its imports resolve

const rootDir = path.join(__dirname, '..', 'fixtures'); // ADJUST: a folder with a tsconfig.json and file.ts
const defaultOptions: unknown[] = []; // ADJUST: rule options
const output = '/tmp/compare-rule.jsonl'; // ADJUST: use a unique path. Results go to a file because some repos fail tests on console output.

interface Case {
  baseOptions?: unknown[]; // For options the base version's schema would reject
  code: string;
  // Reports the correct rule should give. Write this before running, so that results can't be rationalized afterward.
  expected: number;
  expectedOutput?: string; // Correct code after fixes, for a PR that adds or changes a fixer
  filename?: string; // Such as 'react.tsx'
  id: string;
  options?: unknown[];
  project?: string; // Per-case tsconfig, such as './tsconfig-with-dom.json'
}

const cases: Case[] = [
  // { code: `...`, expected: 1, id: 'generic-contextual-type' },
];

const diagnostics = {
  create(context: any) {
    return {
      Program(node: any) {
        const { program } = context.sourceCode.parserServices;
        const file = program.getSourceFile(context.filename);
        for (const diagnostic of [
          ...program.getSyntacticDiagnostics(file),
          ...program.getSemanticDiagnostics(file),
        ]) {
          const text = diagnostic.messageText;
          context.report({
            message: typeof text === 'string' ? text : text.messageText,
            node,
          });
        }
      },
    };
  },
  meta: { schema: [], type: 'problem' },
};

function optionsFor(rule: string, testCase: Case) {
  if (rule === 'diagnostics') return [];
  if (rule === 'base' && testCase.baseOptions) return testCase.baseOptions;
  return testCase.options ?? defaultOptions;
}

function config(rule: string, testCase: Case) {
  return [
    {
      files: ['**/*.ts', '**/*.tsx'],
      languageOptions: {
        parser,
        parserOptions: {
          project: testCase.project ?? './tsconfig.json',
          tsconfigRootDir: rootDir,
        },
      },
      linterOptions: { reportUnusedDisableDirectives: 'off' },
      plugins: { x: { rules: { base, diagnostics, head } as never } },
      rules: {
        [`x/${rule}`]: ['error', ...optionsFor(rule, testCase)],
      } as never,
    },
  ] as never;
}

function run(rule: string, testCase: Case) {
  const filename = path.join(rootDir, testCase.filename ?? 'file.ts');
  const linter = new Linter({ configType: 'flat' });
  try {
    const messages = linter.verify(testCase.code, config(rule, testCase), {
      filename,
    });
    const fixed = linter.verifyAndFix(testCase.code, config(rule, testCase), {
      filename,
    });
    const reports = messages.map(message =>
      message.fatal
        ? `FATAL ${message.message}`
        : `${message.line}:${message.column}-${message.endLine}:${message.endColumn} ${message.message}`,
    );
    return {
      crashed: false,
      fatal: messages.some(message => message.fatal),
      fixedOutput: fixed.fixed ? fixed.output : undefined,
      fixParseError: fixed.messages.find(message => message.fatal)?.message,
      reports,
      suggestions: messages.flatMap(message =>
        (message.suggestions ?? []).map(({ desc, fix }) => ({
          desc,
          output:
            testCase.code.slice(0, fix.range[0]) +
            fix.text +
            testCase.code.slice(fix.range[1]),
        })),
      ),
    };
  } catch (error) {
    return { crashed: true, error: String(error), fatal: false, reports: [] };
  }
}

function classify(testCase: Case, baseResult: any, headResult: any) {
  if (headResult.crashed) return baseResult.crashed ? 'EXISTING CRASH' : 'CRASH';
  if (headResult.fatal) return 'FATAL: FIXTURE OR CONFIG PROBLEM';
  if (headResult.fixParseError) return 'FIX PRODUCES INVALID CODE';
  if (
    testCase.expectedOutput !== undefined &&
    (headResult.fixedOutput ?? testCase.code) !== testCase.expectedOutput
  ) {
    return 'WRONG FIX';
  }
  const headRight = headResult.reports.length === testCase.expected;
  const baseRight = baseResult.reports.length === testCase.expected;
  if (head === (base as unknown)) return headRight ? 'ok' : 'WRONG';
  if (headRight && !baseRight) return 'FIXED BY PR';
  if (!headRight && baseRight) return 'REGRESSION';
  if (!headRight) return 'EXISTING BUG';
  // Same count, so check whether anything else moved: read these, because a changed message may be a bug.
  const same = JSON.stringify(baseResult) === JSON.stringify(headResult);
  return same ? 'ok' : 'CHANGED OUTPUT';
}

it('compares head and base', () => {
  writeFileSync(output, '');
  let baseCrashes = 0;
  for (const testCase of cases) {
    const baseResult = run('base', testCase);
    if (baseResult.crashed) baseCrashes++;
    const headResult = run('head', testCase);
    const fixtureErrors = run('diagnostics', testCase).reports;
    appendFileSync(
      output,
      `${JSON.stringify({
        base: baseResult,
        code: testCase.code,
        expected: testCase.expected,
        fixtureErrors,
        head: headResult,
        id: testCase.id,
        kind: classify(testCase, baseResult, headResult),
      })}\n`,
    );
  }
  if (cases.length > 1 && baseCrashes === cases.length) {
    // Results above would all read as FIXED BY PR, which is almost certainly wrong.
    appendFileSync(
      output,
      `${JSON.stringify({ kind: 'HARNESS PROBLEM: base crashed on every case. Check baseOptions.' })}\n`,
    );
  }
});
