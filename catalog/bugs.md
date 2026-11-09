# Bugs: what rules miss or misreport

## Decide from AST nodes and checker types, not source text or printed names

*17 comments · automatable*

**Check:** Look for `sourceCode.getText` or `node.getText` used to decide equality. Compare nodes and tokens, and when the rule is about type meaning, compare `ts.Type` objects with `===`.

**Why:** Text comparison breaks when a comment appears, which would confuse users. Even AST comparison misses equivalent types such as `"1" | '1'` or aliases of the same type.

**Verify:** Test `if (a /* ... */ .b === a.b)` still reports, and `type A = string; type B = string; type C = A | B;` for duplicate-type checks.

**From past reviews:**

- ["We generally try not to use `sourceCode.getText` or similar in rules if at all possible. It's less reliable than comparing AST and/or types"](https://github.com/typescript-eslint/typescript-eslint/pull/5728#discussion_r985673736)
- ["As convenient as `sourceCode.getText` is, most cases where it's used are susceptible to bugs."](https://github.com/typescript-eslint/typescript-eslint/pull/8656#discussion_r1576854167)
- ["try to stay within the ESTree AST -- only dipping into TypeScript-land when you're sure you'll need type information."](https://github.com/typescript-eslint/typescript-eslint/pull/5852#discussion_r1020981677)
- ["we really, really try to avoid `typeToString`. Types can look exactly the same but be in two different places, and/or might only differ by whitespace."](https://github.com/typescript-eslint/typescript-eslint/pull/9714#discussion_r1703406228)

## Resolve static keys and values instead of matching only `Literal` nodes

*15 comments · automatable · any, typescript-eslint*

**Check:** Look for `type === AST_NODE_TYPES.Literal` or `Identifier` checks on computed keys, indexes, and string arguments. They miss `[key]` with a const variable, `['p1']` compared against `p1`, and template literals. Use `getStaticValue` or an equivalent utility.

**Why:** Computed keys aren't just literals, and a hand-written literal check silently skips them. `getStaticValue` is the standard utility, but truly funky computed expressions and variables used as method names don't need support.

**Verify:** Add as `invalid`: `const value = 0; values.filter(f)[value];` (same report as `[0]`) and `const myObject = { /** @deprecated */ recommended: null }; const key = 'recommended'; myObject[key];`. Add as `valid` for key comparison: `class Mx { set p1(val) {} get ['p1']() { return ''; } }`. For string arguments, test a template literal such as require(`foo`).

**From past reviews:**

- ["We have at least one utility for this, `getStaticValue`."](https://github.com/typescript-eslint/typescript-eslint/pull/8216#discussion_r1446587878)
- ["Just requesting changes on handling computed values."](https://github.com/typescript-eslint/typescript-eslint/pull/8249#pullrequestreview-1852321000)
- ["This is a good start, but computed keys aren't just literals - they can also be identifiers."](https://github.com/typescript-eslint/typescript-eslint/pull/11006#discussion_r2020997063)
- ["I think there's just one case around `[key]` that I think is still missing?"](https://github.com/typescript-eslint/typescript-eslint/pull/11006#pullrequestreview-2729195273)

## Match by declaration, not by name: confirm it's the real global

*15 comments*

**Check:** Any check on a callee, type, or method name (`Boolean`, `Map`, `Uint8Array`, `.apply`, `.call`) must confirm that the thing resolves to the global, not a user declaration or a coincidentally named member. Use the scope manager, type system, or helpers like `isGlobalDeclaration`.

**Why:** Folks do redeclare built-ins and define same-named methods, so a name-only check falsely reports or misapplies logic. It's not enough to just look at the name; the same applies to option specifiers, where the declaration's origin has to be checked too.

**Verify:** Add as `valid`: `class Map { value = 1; } const map = new Map(); Object.values(map);` and `interface Gotcha { apply(...args: unknown[]): void; } declare const gotcha: Gotcha; gotcha.apply(null, 'abc');`. Repeat with a local `function Boolean(value) {}` or `class Uint8Array<T> {}` for whichever global the rule names.

**From past reviews:**

- ["It's not enough to just look at the name. If someone happens to redeclare their own class, such as `class Uint8Array<T>`, the rule should know to check that:"](https://github.com/typescript-eslint/typescript-eslint/pull/10477#discussion_r1885099562)
- ["[Bug] False report case:"](https://github.com/typescript-eslint/typescript-eslint/pull/9369#discussion_r1657110257)
- ["Users might define their own generic `Array` type. just checking for the name & type arguments match isn't enough."](https://github.com/typescript-eslint/typescript-eslint/pull/11971#pullrequestreview-3678759701)
- ["Folks sometimes write their own `function Boolean( ... ) { ... }`. This rule will need to handle that well."](https://github.com/typescript-eslint/typescript-eslint/pull/9924#discussion_r1781065043)

## Cover the whole syntax family of the matched construct

*14 comments*

**Check:** Read the AST spec for each matched node and property, then cover its sibling forms: class expressions as well as declarations, computed and literal keys, `this` and qualified type names, members without type annotations, generators, and tuples.

**Why:** Rules commonly handle the first shape the author thought of. Odd forms are still valid code, and a user would consider the gap a bug.

**Verify:** Add cases such as `class Annoying { ['ab']() {} }`, `const _ = class { ... }`, `work(other: this)`, `interface I { property; }`, and `function* test(): Generator<number | string>`.

**From past reviews:**

- ["This'll need to handle `this` and namespace types, no?"](https://github.com/typescript-eslint/typescript-eslint/pull/8443#discussion_r1612698375)
- ["Don't forget the other types of assignment expressions: `||=`, `??=`, `|=`, there may be more I'm not remembering."](https://github.com/flint-fyi/flint/pull/392#discussion_r2416520899)
- ["I don't think it being optional makes it have a side-effect?"](https://github.com/typescript-eslint/typescript-eslint/pull/12218#discussion_r3143667678)
- ["I suspect they'll also need the same fix as **declarations**."](https://github.com/typescript-eslint/typescript-eslint/pull/5901#discussion_r1008712886)

## Treat `as` and `in` on AST nodes as signs of an unhandled case

*9 comments · automatable*

**Check:** For each `as`, `!`, or `@ts-ignore`/`@ts-expect-error` in a rule, remove it and read the compiler error. Handle the node shapes it names, or use a type predicate that states the real type.

**Why:** The TSESTree types represent all possible values of properties, so needing an `as` to compile means the code isn't handling some case. Casting a non-token node to a token is unsafe.

**Verify:** Delete the assertion, list the union members the compiler reports, and add a test for each reachable one, such as a computed or literal method key.

**From past reviews:**

- ["The fact that an `as` was needed to get this code to type check means that the code isn't handling some case that it needs to handle."](https://github.com/typescript-eslint/typescript-eslint/pull/5848#discussion_r1092547616)
- ["If a property (here, `id`) doesn't exist it's because the node legitimately might be a type that doesn't have it."](https://github.com/typescript-eslint/typescript-eslint/pull/7808#discussion_r1367962086)
- ["The types are right to yell that `node.key` isn't necessarily a `TESTree.Identifier`."](https://github.com/typescript-eslint/typescript-eslint/pull/5848#discussion_r998886026)
- ["We generally don't use `in` on AST nodes. The pattern is susceptible to missing new node types as they get added later."](https://github.com/typescript-eslint/typescript-eslint/pull/8173#discussion_r1445167947)

## Decide how a typed rule treats `any`, `unknown`, and `error` types

*7 comments*

**Check:** When a rule inspects types, consider what happens with an unresolved type. It acts as `any` but isn't one, so messages should say so, fixes should stay conservative, and test fixtures shouldn't reach it by accident.

**Why:** An error type gives a misleading report if it's described as a normal type, and a test using an undeclared name silently tests `any` rather than what was intended.

**Verify:** Add a case with an undeclared type, such as `declare const value: NotKnown | 0;`, and assert the message mentions the `error` type. Review test fixtures for names that aren't declared in the same case, like `const nullish = nullish;`.

**From past reviews:**

- ["This doesn't mention the type as being an "error typed value" the way the other rules do."](https://github.com/typescript-eslint/typescript-eslint/pull/9555#discussion_r1685529895)
- ["Is there a reason to allow `unknown`s? I would have thought that they should be warned on, since they're not guaranteed to be a `Promise`."](https://github.com/typescript-eslint/typescript-eslint/pull/8094#discussion_r1449132692)
- ["Tests don't have visibility to each other. `nullish` here is an error `any`, not anything else."](https://github.com/typescript-eslint/typescript-eslint/pull/7957#discussion_r1398729584)
- ["Could you add test coverage for rest param type `any`, `any[]`, and `unknown[]`?"](https://github.com/typescript-eslint/typescript-eslint/pull/5731#discussion_r986387858)

## Walk into unions, intersections, arrays, and tuples

*6 comments · typescript-eslint*

**Check:** In typed rules, confirm logic descends into union and intersection constituents and array and tuple element types, with recursion that terminates. Checking only the top-level type is a common gap.

**Why:** These shapes get hard to reason about, and tuples in particular tend to force implementation tweaks. Each has a clear way to skip into its parts.

**Verify:** Add tests for `A | B`, `A & B`, `T[]`, `[T]`, and a union nested in a tuple.

**From past reviews:**

- ["Intersections (`T & T`) and unions (`T | T`): skip into constituent types"](https://github.com/typescript-eslint/typescript-eslint/pull/9714#issuecomment-2356004523)
- ["Mostly requesting changes around adding unit test coverage for more edge cases, in particular tuples."](https://github.com/typescript-eslint/typescript-eslint/pull/5731#pullrequestreview-1129231503)
- ["Just requesting changes on more testing coverage and deep union type checking."](https://github.com/typescript-eslint/typescript-eslint/pull/4509#pullrequestreview-872543532)
- ["I suspect you'll have to tweak the implementation a little to deal with tuples."](https://github.com/typescript-eslint/typescript-eslint/pull/11720#pullrequestreview-3412127207)

## Justify every exemption

*6 comments*

**Check:** For each `valid` test and each early exit that skips a syntax form, ask what the reason is. Skipping shapes such as computed access, optional variants, class instances, or non-identifiers needs a stated rationale, otherwise it's a false negative.

**Why:** We'd probably get a bug report from it not working. Exemptions are often based on a property that doesn't actually matter to the rule, and if a discovered edge case is truly debatable it should get an option instead.

**Verify:** For each exempted form, move the test to `invalid` and see whether anything justifies moving it back. Corpus examples: `void str['toUpperCase']();`, `([]?.filter(f))[0];`, `{ ...new A() }`, and `class A { constructor(b: 'c' | 'd') { this.b = b; } }`-style cases that an `Identifier`-only check skips.

**From past reviews:**

- ["Why would this be exempted? `node.computed` is irrelevant here."](https://github.com/typescript-eslint/typescript-eslint/pull/12218#discussion_r3319734993)
- ["Why not? This seems like it'd be a case folks would want to hit. We'd probably get a bug report from it not working."](https://github.com/typescript-eslint/typescript-eslint/pull/8216#discussion_r1446587187)
- ["Err, wouldn't we want the rule to flag on this case?"](https://github.com/typescript-eslint/typescript-eslint/pull/8509#discussion_r1513230887)
- ["Hmm, I think this is a case we'll want to tackle. Why limit to just identifiers?"](https://github.com/typescript-eslint/typescript-eslint/pull/7089#discussion_r1257381956)

## Resolve type parameters to their constraints

*4 comments · typescript-eslint*

**Check:** In typed rules, check what happens when the value's type is a type parameter. Using the original type instead of the constrained type is a repeat bug; if nothing useful can be known, skip it.

**Why:** Generics are a recurring source of rule bugs, and this class keeps coming back as new fixes.

**Verify:** Add tests with `function f<T extends string>(value: T)` alongside the concrete `string` case, plus an unconstrained `<T>`.

**From past reviews:**

- ["Yet another case of needing to use the constrained type instead of the original type."](https://github.com/typescript-eslint/typescript-eslint/pull/12125#pullrequestreview-3987101781)
- ["Yeah I don't _love_ completely omitting checking for type parameters."](https://github.com/typescript-eslint/typescript-eslint/pull/12127#pullrequestreview-3987115182)
- ["dealing with type parameters being used as type arguments (for now, just not reporting)"](https://github.com/typescript-eslint/typescript-eslint/pull/8173#pullrequestreview-1861642198)

## Keep checking after one unhandled element

*4 comments*

**Check:** Look for `return` inside a loop over elements, members, or properties, and for `.every(...)` gating a whole-node report. One hole, rest element, unsupported member, or non-matching sibling shouldn't stop the remaining elements from being checked and reported.

**Why:** There can still be a violation next to the thing the rule can't handle, and users expect a report for each problem rather than just the first. Reporting per violating element also gives a smaller, more precise range.

**Verify:** Add as `invalid`: `function test([a, , b]: [boolean, number, object, string]) {}` (reports `string`), `function receive([value]: [string, ...string[]]) {}` (rest type unused), and `` const other = 'abc'; `before${'def'}middle${other}after`; `` (reports only `${'def'}`). For a loop, use two bad entries and expect two errors.

**From past reviews:**

- ["There can still be an unused property even in the presence of empty slots:"](https://github.com/typescript-eslint/typescript-eslint/pull/10344#discussion_r1854634367)
- ["It's possible for a rest type to be unused. This rule should handle that."](https://github.com/typescript-eslint/typescript-eslint/pull/10344#discussion_r1854604702)
- ["Why `return;`? If multiple scripts are incorrect, we'd want to get reports on all of them I think."](https://github.com/michaelfaith/eslint-plugin-package-json/pull/903#discussion_r1996236620)
- ["Instead of having the rule report on the entire `node`, let's have the rule report on each violating literal."](https://github.com/typescript-eslint/typescript-eslint/pull/7957#discussion_r1416273408)

## Report even when no fix can be produced

*4 comments*

**Check:** Check that fixer or suggestion limitations never gate `context.report`. Early returns for an unsupported shape or for nearby comments should only drop the fix, and fix-building logic should live inside `fix`.

**Why:** The code still violates the rule whether or not a fix is possible. Comments in particular are all over the place and on their own don't indicate a lint rule should be ignored.

**Verify:** Add as `invalid`, not `valid`: `if (foo) { /* comment */ foo.bar(); }`. For a rule with a suggestion, add a case the suggestion can't handle and assert the error is present with no suggestions, for example `declare const arr: unknown[]; declare const i: number | string; delete arr[i];`.

**From past reviews:**

- ["The lint rule should still report even if it can't figure out a suggestion. This and the other `return;` cause it to bail out of both reporting and creating a suggestion."](https://github.com/JoshuaKGoldberg/eslint-plugin-erasable-syntax-only/pull/234#discussion_r2465895899)
- ["I think we should still report in this case. Folks put comments all over the place sometimes; on their own they don't indicate a lint rule should be ignored."](https://github.com/typescript-eslint/typescript-eslint/pull/10137#discussion_r1827900972)
- ["This `/* comment */` doesn't change the fact that the code violates the rule's new preference."](https://github.com/typescript-eslint/typescript-eslint/pull/10137#discussion_r1827887427)

## Apply a change to every report path

*4 comments*

**Check:** When a rule has several message IDs or return sites, confirm that a new option, message change, or fixer reaches each one. Search for the message IDs and return shapes rather than trusting the path the PR touched.

**Why:** PRs tend to add a check in a couple of places but not all of them, which leaves one report path behaving differently, such as an option that doesn't apply to promise arrays or a fix on only one of two reports.

**Verify:** Run `grep -n "messageId\|isUnhandled: true" src/rules/<rule>.ts` and require at least one test per hit that exercises the change. Example `valid` case: `declare const arrayOrPromiseTuple: Foo<unknown>[]; arrayOrPromiseTuple; type Foo<T> = Promise<T> & { hey?: string };` with `allowForKnownSafePromises: [{ from: 'file', name: 'Foo' }]`.

**From past reviews:**

- ["There's also a `unsafeComputedMemberAccess` message ID that's reported. I think that's missing in this PR."](https://github.com/typescript-eslint/typescript-eslint/pull/9291#discussion_r1632092033)
- ["This PR right now adds the `allowForKnownSafePromises` check for a couple places, but not all of them."](https://github.com/typescript-eslint/typescript-eslint/pull/8502#discussion_r1541670470)
- ["Is there a reason not to also add a `fix` to the `unnecessaryCatch` report?"](https://github.com/eslint/eslint/pull/19952#discussion_r2228510558)

## Don't report when the rule can't be confident

*4 comments*

**Check:** Where analysis gets murky, such as roughly invalid code or type parameters used as type arguments, prefer not reporting over guessing. Treat false positives as rule bugs, and say so in the review.

**Why:** If code is roughly not valid, the reviewer hesitates to feel confident in making changes. Silence is a safe starting point, and a bugfix can add the case later if users complain.

**From past reviews:**

- ["If users complain we can add it as a bugfix later on - but if the code is roughly not valid, I'd hesitate to feel confident in making changes."](https://github.com/typescript-eslint/typescript-eslint/pull/6397#issuecomment-1593803357)
- ["dealing with type parameters being used as type arguments (for now, just not reporting)"](https://github.com/typescript-eslint/typescript-eslint/pull/8173#pullrequestreview-1861642198)
- ["There are a couple marked as **false positive** that I think are bugs in the rule."](https://github.com/typescript-eslint/typescript-eslint/pull/12317#pullrequestreview-4373214512)

## Keep results independent of unrelated code aspects

*4 comments*

**Check:** Check whether comments, semicolons, or file type change whether a rule reports or fixes. Restrict behavior only on what the rule is about, and leave file targeting to user config.

**Why:** Users really dislike it when aspects of code unrelated to a rule change how it works; a fixer that only works on uncommented code feels like a bug.

**Verify:** Duplicate a test case with a comment added and without semicolons, and confirm identical reports and fix availability.

**From past reviews:**

- ["Users really, really dislike it when aspects of code unrelated to a rule change how that rule works."](https://github.com/typescript-eslint/typescript-eslint/pull/5728#discussion_r997242704)
- ["it'd be very confusing to users why adding a comment inside a type stops this rule from complaining on it."](https://github.com/typescript-eslint/typescript-eslint/pull/5728#discussion_r985673736)
- ["I've always found it confusing when rules enforce their own file restrictions separate from the user's config."](https://github.com/flint-fyi/flint/pull/161#discussion_r2206017888)

## Detect types by behavior instead of hard-coding built-in names

*3 comments*

**Check:** Look for lists of built-in class names or checks that a member is the built-in declaration. Prefer checking how the type behaves, such as whether it has a callable `then`, so user-defined equivalents work.

**Why:** Users write their own classes like `Bluebird` or `CachingMap` and expect the same lint checks, and projects augment built-ins as `@types/node` does for `.at`.

**Verify:** Add a test with a user-defined class that behaves like the built-in and another with a project augmentation of the built-in.

**From past reviews:**

- ["I'm not a big fan of hardcoding in built-in classes. Users tend to write their own with names like `Bluebird`, `CachingMap`, etc. - and expect the same kind of lint checks for them."](https://github.com/typescript-eslint/typescript-eslint/pull/8509#discussion_r1528451293)
- ["We generally look at how types behave (`isPromiseLike`) if there isn't a built-in API."](https://github.com/typescript-eslint/typescript-eslint/pull/4864#discussion_r864162489)
- ["So if a project adds its own `.at` method augmentation in their own file, this will return false?"](https://github.com/typescript-eslint/typescript-eslint/pull/6411#discussion_r1133451636)

## Check type flags with helpers, not `===`

*3 comments · automatable · typescript-eslint*

**Check:** Replace `type.getFlags() === ts.TypeFlags.X` and long hand-written type predicates with `tsutils.isTypeFlagSet`, and be deliberate about `Void` vs. `VoidLike` style flag groups.

**Why:** Flags are a bitmask, and odd edge cases with number literals vs. numbers have come up before. Exact equality misses them.

**Verify:** Run `grep -n "getFlags() ===\|\.flags ===" src/rules/<rule>.ts`. Test each type condition with both a primitive and its literal, such as `declare const i: number;` and `declare const i: 1;`. If swapping the flag for its `*Like` group fails no test, add one.

**From past reviews:**

- ["Anywhere that checks type flags with a `===` should probably use a `tsutils` helper instead. We've seen odd edge cases with number literals vs. numbers before."](https://github.com/typescript-eslint/typescript-eslint/pull/6411#discussion_r1133448287)
- ["You can use `tsutils.isTypeFlagSet` instead of this big name."](https://github.com/typescript-eslint/typescript-eslint/pull/5852#discussion_r1135111964)
- ["This uses `Void` but the next check uses `VoidLike`. Swapping to any other combination of the type flags doesn't produce any test failures."](https://github.com/typescript-eslint/typescript-eslint/pull/9707#discussion_r2175821455)

## Keep traversal state in a stack that tolerates nesting

*3 comments*

**Check:** Look for single variables or sets on the rule or class that are reset on entering a node, and for stacks that are read without considering emptiness. Nested classes, functions, and templates need per-level state, and code outside any function can still reach a visitor.

**Why:** Clearing shared state on each new class won't hold up for inner classes, and state flags don't scale when arbitrary nodes can be children. TypeScript may report a stray `return` as an error, but the linter may still run.

**Verify:** Add a nested case: `class First { constructor(public a: number) { class Second { constructor(public a: number) { this.a = a; } } new Second(0); this.a = a; } }`, including variants renaming either `a`. Add a top-level `return;` and assert that the rule doesn't crash.

**From past reviews:**

- ["Clearing `parameterProperties` on each new class won't hold up for inner classes declared inside outer classes."](https://github.com/typescript-eslint/typescript-eslint/pull/7089#discussion_r1257383051)
- ["I don't think any kind of state on `Converter` is going to scale."](https://github.com/typescript-eslint/typescript-eslint/pull/11355#discussion_r2318775127)
- ["Someone might write a `return` outside of a function. TypeScript will give an error, but the linter may still run."](https://github.com/typescript-eslint/typescript-eslint/pull/8508#discussion_r1516092903)

## Resolve TODOs for unhandled syntax before merging

*3 comments · automatable*

**Check:** A new rule shouldn't ship with TODOs naming syntax it doesn't yet handle. Handle the case, or at least capture it in a test and decide explicitly that it isn't worth doing.

**Why:** Later support for the skipped constructs may be a breaking change, and a TODO hides whether the case is pending or abandoned.

**Verify:** Run `grep -nE "TODO|XXX" src/rules/<rule>.ts tests/rules/<rule>.test.ts`. Each hit needs a test (even a failing one to discuss) or a linked issue.

**From past reviews:**

- ["Yeah we'll have to do something here to make this PR mergable."](https://github.com/typescript-eslint/typescript-eslint/pull/8249#discussion_r1471929896)
- ["Can you include any test cases you're thinking of for them? Even if they're not passing right now, it'd be helpful to see."](https://github.com/typescript-eslint/typescript-eslint/pull/8173#discussion_r1477515097)
- ["Is this still pending? What's up?"](https://github.com/typescript-eslint/typescript-eslint/pull/9707#discussion_r1967899283)

## Don't assume a fixed parent depth

*2 comments*

**Check:** Flag `node.parent.parent` style checks and helpers named for a specific ancestor level. Type nodes can be nested and parenthesized to any depth, so ascend the AST in a loop or track whether traversal is inside the construct.

**Why:** Literals might be more deeply nested than two levels inside a parent, and parenthesized types or more nesting trip up the check.

**Verify:** Add `type Nested = ('' | ('' | (1)));` and `declare function fn2(): (never | 'foo') | 123;`. Both must behave the same as their flat forms.

**From past reviews:**

- ["TS literals might be more deeply nested than 2 levels inside a parent:"](https://github.com/eslint/eslint/pull/19561#discussion_r2021314051)
- ["This function doesn't account for parenthesized types. This code trips it up:"](https://github.com/typescript-eslint/typescript-eslint/pull/10744#discussion_r2399235195)

## Don't hand-roll declaration or lib file detection

*2 comments · automatable*

**Check:** Flag `.endsWith('.d.ts')` and `lib.*.d.ts` filename matching. Declaration files also come as `.d.cts` and `.d.mts`, and filename patterns can match user files. Use `isDefinitionFile`, `isSymbolFromDefaultLibrary`, or `program.isSourceFileDefaultLibrary`.

**Why:** Suffix checks aren't exhaustive in one direction and get tricked in the other, and existing utilities already handle this.

**Verify:** Run the rule with `filename: 'file.d.mts'` and `'file.d.cts'`. For lib detection, declare a type in `./src/gotcha.lib.d.ts` and assert that it isn't treated as a default library type.

**From past reviews:**

- ["This isn't exhaustive: DTS files could also be `.d.cts` or `.d.mts`."](https://github.com/eslint/eslint/pull/19565#discussion_r2010458934)
- ["This will get tricked by types in files like `./src/gotcha.lib.d.ts`."](https://github.com/typescript-eslint/typescript-eslint/pull/12046#discussion_r2970413672)
