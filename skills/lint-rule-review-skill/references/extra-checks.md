# Extra checks

Checks found while trialing this skill. Unlike the other references, they don't come from past review comments.

## Trust your tools less than your findings

- A "no differences" result that came back suspiciously fast may mean nothing parsed. If you run a rule over real code, confirm that files were actually linted.
- Fixture types can silently resolve to something trivial, for example `HTMLElement` when the fixture `tsconfig` has no DOM lib. Check that a fixture compiles, and use a project with the libs the case needs.
- In a copied checkout, `pnpm exec` can rerun install and wipe built packages. Call tools from `node_modules/.bin` directly.
- Check exit codes, not grepped output. Colored test output and shell quirks can turn a failure into an empty result.
- If the PR's own tests fail at its head, run a sibling rule's tests as a control. Then find the smallest change that makes them pass, and record it in the review.

## Running both versions over real code

- Make a temporary copy of the compare harness that loops over each project's files and lints each one from disk under its real path, with an `it` timeout long enough for the whole run.
- Give the `Linter` a `cwd` of the project root, because it reports "No matching configuration" for any file outside its `cwd`, and both versions then look identical.
- For a typed rule, replace `project` with `projectService: true` and a `tsconfigRootDir` of the project root, and for an untyped rule, drop the project settings. Drop `diagnostics`, `classify`, and the `verifyAndFix` call, and compare each message's rule, position, text, `fix`, and suggestions instead.
- If the PR changes several rules, register the head of every rule whose source changed or that uses a changed utility by name in one config, and its base under the same name in another, so each file is linted once per version rather than once per rule. Give base its `baseOptions` where the PR adds an option, as in the harness. A rule that also needs non-default options gets one more pair of configs per set of options.
- Linting stops at the first rule that throws or rejects its options. When either version throws on a file, record the crash under the rule the error names, and lint that file again in both versions without that rule.
- Count the files with a fatal message, because a file outside every `tsconfig` fails the same way in both versions.

## Rule logic

- **A visitor or selector that matches nothing:** a mistyped selector, or a visitor key that isn't a real node kind, silently disables the rule. Confirm that each listener actually fires.
- **Recursive type walks:** test generic types that expand on each recursion, such as `type Nested<T> = { value: T; next: Nested<T[]> }`, and self-referencing types. Check termination and time, not just the result.
- **Static values or the checker:** `getStaticValue` answers questions about runtime values in this file. For what a key resolves to on a type, including `Symbol()`, enums, and imported keys, the checker usually knows more. Prefer the checker when the question is about types.
- **Real-global checks:** if the rule decides whether a name is the real global, such as `NaN`, `Array`, or `String`, test same-named declarations of each kind: parameter, variable, function, class, enum, interface, type alias, type parameter, import, and a namespace with and without values. Put them at the top level and in a nested scope, in a module and in a script, and test a reference inside and outside a `declare global` block that augments the name. Whether each one shadows depends on whether the rule checks a value or a type, and on where it's declared, so get the expected result from `tsc` rather than reasoning it out. Give each local declaration a type that differs from the global's and lacks its members, such as `interface String {}`, `type String = {}`, or `const NaN = 1n`. Then, for a value, assign it to a mismatched type, as in `const bad: string = NaN`, whose error names the type it resolves to, and for a type, use a member only the global has, such as `s.charAt(0)`, which then fails exactly when the local declaration shadows the global. In typescript-eslint's `RuleTester`, a script case needs `languageOptions: { parserOptions: { sourceType: 'script' } }`, because the tester's default `parserOptions.sourceType` overrides a top-level `languageOptions.sourceType`.
- **Following functions to their calls:** if the rule tracks code that runs through a function, such as a callback that writes to `this`, test a function stored in a variable and called later, as well as one passed directly as an argument.

## Any fixer

- **A changed first token:** a fix that removes, replaces, or wraps the first token of a statement or class member, such as `void`, `await`, `!`, or a modifier like `public`, can make it continue the line before it when that line has no semicolon. For each first token the fix can produce, test it after a line that ends in an identifier and after one that ends in `x++`, and for a class member, after a field like `x = y`. Other common endings, such as `)` other than the end of a control-statement header or a `do`-`while` condition, `]`, a literal, a template, or the `}` of an object, `function`, or `class` expression, but not of an arrow function's block body, continue the line the same way an identifier does. After `++`, `--`, or an `as T` or `satisfies T` type, only `+`, `-`, `/`, and `<` continue a statement, and in a class body so do `*` and a member named `in` or `instanceof`, so `x++\nvoid -y;` must not become `x++\n-y;`, which parses as `x++ - y`.
- **Shared helpers:** when a fix calls a helper such as `needsPrecedingSemicolon`, check its contract against what the fix inserts. `needsPrecedingSemicolon` is written only for `(`, `[`, and a backtick.

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
