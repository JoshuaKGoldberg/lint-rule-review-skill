# Extra checks

Checks found while trialing this skill. Unlike the other references, they don't come from past review comments.

## Trust your tools less than your findings

- A "no differences" result that came back suspiciously fast may mean nothing parsed. If you run a rule over real code, confirm that files were actually linted.
- Fixture types can silently resolve to something trivial, for example `HTMLElement` when the fixture `tsconfig` has no DOM lib. Check that a fixture compiles, and use a project with the libs the case needs.
- In a copied checkout, `pnpm exec` can rerun install and wipe built packages. Call tools from `node_modules/.bin` directly.
- Check exit codes, not grepped output. Colored test output and shell quirks can turn a failure into an empty result.
- If the PR's own tests fail at its head, run a sibling rule's tests as a control. Then find the smallest change that makes them pass, and record it in the review.

## Rule logic

- **A visitor or selector that matches nothing:** a mistyped selector, or a visitor key that isn't a real node kind, silently disables the rule. Confirm that each listener actually fires.
- **Recursive type walks:** test generic types that expand on each recursion, such as `type Nested<T> = { value: T; next: Nested<T[]> }`, and self-referencing types. Check termination and time, not just the result.
- **Static values or the checker:** `getStaticValue` answers questions about runtime values in this file. For what a key resolves to on a type, including `Symbol()`, enums, and imported keys, the checker usually knows more. Prefer the checker when the question is about types.

## Adding a fixer to an existing rule

A fix that reads well can still change behavior. Run the code before and after where you can, and check:

- `this` binding of anything moved or extracted
- How many times each expression is evaluated, and in what order
- Snapshot reads versus live reads, such as an array that's mutated during a loop
- Iteration protocol differences, such as `for...of` on a sparse array or a non-iterable array-like
- Name capture, and declarations leaking into the surrounding scope
- Whether it should be a suggestion, given all of the above

## Import and export rules

- Cover every form: `import =`, `export import =`, `import {}`, `export {}`, `export * as`, `export type *`, `import defer`, `import()`, string names, and `default`.
- Test realistic dependency layouts: a `node_modules` package with `name` and `version`, `@types`, scoped packages, subpaths, an `exports` map, untyped JS, and workspace symlinks.
- `declare module` fixtures skip the real resolution path, so they can hide bugs there.

## typescript-eslint CI variants

These were true when written, so confirm them against the current code:

- The tsgo job runs typed rules on a native checker and program that don't support every TypeScript API. Check each new checker call against `UNSUPPORTED_CHECKER_MEMBERS` in `nativeCheckerAdapter.ts`, and each new `program` call against `UNSUPPORTED_PROGRAM_MEMBERS` in `nativeProgramAdapter.ts`, both in `packages/typescript-estree/src/native/`. If a call is listed, compute the answer from syntax or a supported call. Run the tests that way with `TYPESCRIPT_ESLINT_EXPERIMENTAL_BACKEND=tsgo TYPESCRIPT_ESLINT_PROJECT_SERVICE=true` and `--testTimeout=30000` on Node 22.12 or newer, as CI does. Under the test runner it falls back to the classic backend without a warning on older Node or other TypeScript versions, so add `DEBUG=typescript-eslint:typescript-estree:parseSettings:createParseSettings` and check that no "Falling back to the classic backend" line prints.
- The oldest-TypeScript job runs the minimum supported TypeScript, where types can print or simplify differently. To check one type, install that TypeScript in a scratch folder and print the type, rather than reinstalling the repo. To run the suite, copy that job's steps, including its fixture `tsconfig` rewrite, in a copy of the repo.
- Gate a case that needs newer TypeScript behavior with `dependencyConstraints: { typescript: '<version>' }`, found by checking the type on old and new TypeScript. The first `dependencyConstraints` in a `ruleTester.run()` call makes `RuleTester` overwrite every case's `skip` in that call, which drops checks such as a Node version skip. So if the call has a `skip` and no constraints yet, use `skip: !typescriptVersionIsAtLeast['<version>']` from `@typescript-eslint/type-utils` instead. If it already has constraints, any `skip` in it is already ignored, which is a finding in itself, so use `dependencyConstraints`. While any case has `only`, constraints aren't applied at all, so don't reproduce this with `only`.

## Flint

There's no compare harness for Flint, and its internals change, so stay on the public `RuleTester`:

- `RuleTester` asserts snapshots. To see what a rule reports, write a temporary test using the rule's own `ruleTester`, and put each case in `invalid` with `snapshot: ""`. The failure output prints the reports.
- Test filters are substring matches, so name temporary test files something that doesn't contain the rule's name, or mutation runs will pick them up.
- `files` adds other files to a case, for cross-file tests. Workspace packages such as `@flint.fyi/core` don't resolve in these virtual files.
- Check what lives in `setup()`, and whether that state should last for a whole run or a single file.
- If a new rule ports an ESLint rule, that rule is the useful "base": compare behavior against its tests and docs.
