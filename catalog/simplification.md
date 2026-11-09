# Simplification

## Move shared logic into one utility instead of copying it

*58 comments*

**Check:** Before accepting a nontrivial helper, grep the `util` directory and sibling rules for the same logic, such as `getStaticStringValue`, `skipChainExpression`, `getWrappingFixer`, or `isBuiltinSymbolLike`. If it exists, reuse it; if it is copied, move it to a util, and switch older call sites to it.

**Why:** This need comes up a lot in rules, so nontrivial logic should live in one place. New helpers should also replace existing code doing the same checks, or they sit beside duplicates.

**Verify:** Grep the plugin for the helper body's distinctive calls. After reuse, run tests for every rule touched.

**From past reviews:**

- ["This is directly copied from `return-await`, right? Since it's a nontrivial function I think it'd be best to put in a util file and re-use between the two rules."](https://github.com/typescript-eslint/typescript-eslint/pull/10719#discussion_r1958256601)
- ["I like the logic and am mostly requesting it be moved into `type-utils` so that all rules can benefit from it."](https://github.com/typescript-eslint/typescript-eslint/pull/11954#pullrequestreview-3650793006)
- ["This kind of logic will be used in the future. Write a util function in `packages/ts/src/utils` that dives into the expression of a parenthesized expression."](https://github.com/flint-fyi/flint/pull/392#discussion_r2414969692)
- ["I'm surprised a utility doesn't already exist for this - but I couldn't find one."](https://github.com/typescript-eslint/typescript-eslint/pull/11720#discussion_r2487408647)

## Delete comments that restate the code

*38 comments*

**Check:** In rule source, remove one-line comments and JSDoc `@param`/`@returns` tags that repeat what names, types, and context already convey. Keep comments that add information the code doesn't show.

**Why:** They don't add anything, they're apparent from the name and context, and they're not worth keeping up to date. A type predicate's `@returns boolean` is less information than the signature.

**Verify:** For each comment, delete it and ask whether nearby names and types still convey the same information.

**From past reviews:**

- ["Nit: I don't think these comments add anything. They're all pretty apparent from the name & context."](https://github.com/typescript-eslint/typescript-eslint/pull/8502#discussion_r1580078782)
- ["a lot of these comments are pretty self-apparent from the code IMO."](https://github.com/typescript-eslint/typescript-eslint/pull/11720#discussion_r2538246858)
- ["Nit: the comment is a little redundant, I think."](https://github.com/typescript-eslint/typescript-eslint/pull/6195#discussion_r1051149819)
- ["I think the test stands on its own just fine"](https://github.com/flint-fyi/flint/pull/1457#discussion_r2690520208)

## Drop guards for states the AST or earlier code rules out

*34 comments · automatable*

**Check:** Flag `node.parent?.`, `!x` checks, `?? []`, `Array.isArray(options)`, and `.length` pre-checks on values that callers, selectors, `defaultOptions`, or the AST already guarantee. Trace the call sites before keeping one, including guards added only to satisfy `noUncheckedIndexedAccess`.

**Why:** Defensive checks for impossible states confuse readers about what can actually happen. Where the type system can't see the guarantee, a `!` or restructuring beats a branch that can never run.

**Verify:** List every caller of the helper and confirm what each has already narrowed, then remove the guard and run the tests.

**From past reviews:**

- ["we humans know `node` always has a `parent`, so the type system is wrong to suggest it could be `undefined`:"](https://github.com/typescript-eslint/typescript-eslint/pull/11032#discussion_r2035348039)
- ["If `node.parent.type === AST_NODE_TYPES.CallExpression` then we know `node.parent` exists:"](https://github.com/typescript-eslint/typescript-eslint/pull/6237#discussion_r1051447888)
- ["If they should never occur, then we don't need to handle them."](https://github.com/typescript-eslint/typescript-eslint/pull/5728#discussion_r997224610)
- ["TypeScript only allows the first param to be named `this`. JavaScript doesn't allow any params to be named `this`."](https://github.com/eslint/eslint/pull/19678#discussion_r2071618823)

## Delete any code that no test requires

*24 comments*

**Check:** For each guard, branch, `?.`, or helper in the rule, ask what fails if it is removed. If nothing fails, it is either dead code or an untested behavior, and the PR must resolve which.

**Why:** Passing tests after a deletion mean one of two things: a unit test is missing or the code is dead. Either the code goes, or a test proves why it stays.

**Verify:** Delete the line, or change the `if` to `if (true)`, then run the rule's tests. If they stay green, add a failing test case or keep the deletion.

**From past reviews:**

- ["No tests fail from removing the `?`. Either a unit test is missing or this is a teeny bit of dead code:"](https://github.com/eslint/eslint/pull/19565#discussion_r2010465116)
- ["For this and my other "dead code" notes: if I'm wrong, we should have unit tests proving it."](https://github.com/eslint/eslint/pull/19564#discussion_r2010426970)
- ["No tests fail if the `if`s are changed to `if (true)`."](https://github.com/flint-fyi/flint/pull/1366#discussion_r2728630503)
- ["Unnecessary, or untested?"](https://github.com/eslint/eslint/pull/19565#discussion_r2010470555)

## Reduce conditions to the smallest equivalent expression

*23 comments · automatable*

**Check:** Look for if/else ladders, `a && b` pairs, and accumulator variables that collapse into one expression: `??`, `?.`, `!x?.length`, or comparing two booleans with `===`.

**Why:** The reduced form often reads closer to what the code is trying to do, and it exposes logic that was never needed.

**Verify:** Run the existing tests after rewriting; the rewrite must be behavior-preserving.

**From past reviews:**

- ["The current code was a little confusing to me at first. But it actually reduces down nicely:"](https://github.com/typescript-eslint/typescript-eslint/pull/11617#discussion_r2369250736)
- ["any reason for the double-nesting?"](https://github.com/typescript-eslint/typescript-eslint/pull/8903#discussion_r1623497022)
- ["Nit: expressing the intent of the code a little bit more... what do you think?"](https://github.com/typescript-eslint/typescript-eslint/pull/5728#discussion_r997225798)
- ["Small nit, you can make this function several lines smaller:"](https://github.com/typescript-eslint/typescript-eslint/pull/8502#discussion_r1541713914)

## Use existing APIs instead of hand-written checks and caches

*21 comments · automatable · any, typescript-eslint*

**Check:** Flag bitwise `type.flags & ...`, `as ts.ObjectType` casts, manual union recursion, and paired per-kind checks. Use `tsutils.isTypeFlagSet`, `isObjectFlagSet`, `isObjectType`, `typeParts`, `isLiteralType`, and `isIntrinsicErrorType`, and pass OR-ed flags in one call rather than checking each flag separately.

**Why:** The library already covers these cases with fewer characters and more type safety, so a local reimplementation is extra code to maintain.

**Verify:** Search the rule for `.flags &`, `.objectFlags`, and `.isUnion()` followed by recursion, then look up the equivalent ts-api-utils export.

**From past reviews:**

- ["Fun fact, `ts-api-utils` has a `typeParts` function for just this!"](https://github.com/typescript-eslint/typescript-eslint/pull/8509#discussion_r1528472678)
- ["I've seen this "make a Map for a single cache" pattern a bunch, I made a [`cached-factory`](https://www.npmjs.com/package/cached-factory) package for it."](https://github.com/michaelfaith/eslint-plugin-package-json/pull/721#discussion_r1918721192)
- ["We have a utility for this now"](https://github.com/typescript-eslint/typescript-eslint/pull/8249#discussion_r1471928736)
- ["We generally don't like doing `in` checks on AST nodes. It's less precise & less clear to read than checking on the node's `.type`."](https://github.com/typescript-eslint/typescript-eslint/pull/6211#discussion_r1083381548)

## Use concise modern syntax and array helpers

*19 comments · automatable*

**Check:** Rewrite `x && x.type === y` as `x?.type === y`, `a = a || b` as `||=`, `if (!a) a = b` as `??=`, `.map().flat()` as `.flatMap()`, and `arr[arr.length - 1]` as `.at(-1)`.

**Why:** A teeny bit less code, and flatMap avoids a later `.flat()`.

**Verify:** Enable prefer-optional-chain, logical-assignment-operators, and unicorn's flat-map and at rules.

**From past reviews:**

- ["Nit: Just a teeny bit less code..."](https://github.com/typescript-eslint/typescript-eslint/pull/3959#discussion_r728543556)
- ["I'm surprised this isn't caught by https://typescript-eslint.io/rules/prefer-nullish-coalescing ..."](https://github.com/typescript-eslint/typescript-eslint/pull/10218#discussion_r1827992697)
- ["no need to loop through all of the signatures, even if there are never that many..."](https://github.com/typescript-eslint/typescript-eslint/pull/10010#discussion_r1765040763)
- ["Nit: this way it doesn't need to `.flat()` later"](https://github.com/typescript-eslint/typescript-eslint/pull/5728#discussion_r1083521102)

## Encode guaranteed node shapes in types, not narrowing guards

*18 comments · any, typescript-eslint*

**Check:** When a rule uses `nullThrows`, `/* istanbul ignore */`, `'x' in node`, or an unreachable `return` because a type is too wide, narrow the type instead: restrict the parameter, use `MakeRequired<T, 'field'>`, add `{ parent: ... }`, or use an `as` assertion as a fallback.

**Why:** Unreachable code is usually a sign the types don't match reality and are pressuring you to write code you don't need. If the AST types are too loose, fix those.

**Verify:** Remove the check, tighten the type, and run `tsc`. Coverage ignores should disappear with it.

**From past reviews:**

- ["Unreachable code is often a sign that the type system isn't matching reality, and pressuring you to write code you don't need to."](https://github.com/typescript-eslint/typescript-eslint/pull/5471#discussion_r947131690)
- ["If the reason it's here is to narrow `argNode`'s type down to `TSESTree.Expression` then maybe either the types are suggesting a legit case to handle, or are wrong?"](https://github.com/typescript-eslint/typescript-eslint/pull/9707#discussion_r2175872432)
- ["Tests still pass without this check. Is there any reason to include it?"](https://github.com/typescript-eslint/typescript-eslint/pull/6487#discussion_r1111119590)
- ["We know `tsNode.typeParameters` must exist. So it'd be preferable to use a type assertion:"](https://github.com/typescript-eslint/typescript-eslint/pull/8173#discussion_r1477520397)

## Weigh added lines against the rule's responsibilities

*16 comments*

**Check:** Look for ways to reduce added lines in large rule files. Bring specific counts or targets where possible; net code removal with tests still passing is the best outcome.

**Why:** Lean code is easier to read and review, especially in rules that are already a lot of lines. Code removal reliably earns praise.

**Verify:** Compare `git diff --stat` before and after, with tests passing.

**From past reviews:**

- ["We should be able to trim the changes down a bit to be easier to read & review."](https://github.com/typescript-eslint/typescript-eslint/pull/5965#pullrequestreview-1180987107)
- ["Adding 175 lines of new code to an already-large rule to support fixing outside the rule's responsibilities is... a lot."](https://github.com/typescript-eslint/typescript-eslint/pull/5050#pullrequestreview-1048661675)
- ["Just tentatively requesting changes in the interest of keeping the code lean"](https://github.com/typescript-eslint/typescript-eslint/pull/4066#pullrequestreview-793793544)
- ["If this PR was just a couple lines it'd be a lot more palatable."](https://github.com/typescript-eslint/typescript-eslint/pull/11990#issuecomment-3781750466)

## Let selectors and visitors do the structural work

*13 comments · any, typescript-eslint*

**Check:** Replace in-handler operator or parent checks with an esquery selector, replace flags set during traversal and read at `Program:exit` with a direct check on the parent node, drop `:exit` when ordering no longer matters, and prefer a node-type visitor to manual recursion from a catch-all `SourceFile`. Watch descendant versus child combinators.

**Why:** Waiting until the end adds more complexity than needed when the property is a known child. The selector also states the rule's scope and avoids nested-function edge cases.

**Verify:** Test nested-scope cases, such as a `function` inside a constructor, when changing a descendant selector to a child one.

**From past reviews:**

- ["This _"wait until the end"_ strategy adds a bit more complexity than we need."](https://github.com/michaelfaith/eslint-plugin-package-json/pull/851#discussion_r1938501913)
- ["It succinctly filters away undesirable node shapes that this rule wouldn't want to check for"](https://github.com/typescript-eslint/typescript-eslint/pull/5852#discussion_r1020981677)
- ["Inline would mean an inferrable type for `node`:"](https://github.com/typescript-eslint/typescript-eslint/pull/7822#discussion_r1416290948)
- ["How about adding a `!=` to exclude these?"](https://github.com/typescript-eslint/typescript-eslint/pull/7074#discussion_r1211133639)

## Use optional chaining exactly where it is needed

*10 comments · automatable*

**Check:** Replace `x && x.y === z` and `!x || !x.y` with `x?.y`. Conversely, remove `?.` after a check has already proven the value exists, such as `node.parent?.type === ... && node.parent?.body`.

**Why:** It is more succinct, and the reviewer is often surprised lint didn't flag it. When a chained value compares as defined, its object is known to exist.

**Verify:** Run @typescript-eslint/prefer-optional-chain and no-unnecessary-condition on the rule.

**From past reviews:**

- ["Nit, I'm surprised this wasn't flagged by linting:"](https://github.com/JoshuaKGoldberg/eslint-plugin-erasable-syntax-only/pull/39#discussion_r2005453147)
- ["This would be a bit more succinct, I think."](https://github.com/eslint/eslint/pull/17985#discussion_r1454655100)
- ["If `node.parent?.type` is something defined, we know `node.parent` exists."](https://github.com/typescript-eslint/typescript-eslint/pull/6885#discussion_r1165963830)
- ["Small nitpick 🧹"](https://github.com/michaelfaith/eslint-plugin-package-json/pull/70#discussion_r1423137090)

## Inline premature abstractions and speculative types

*10 comments*

**Check:** Remove one-line wrappers like `isString`, predicate parameters with a single kind of caller, intermediate variables used once, and structures separating values that are consumed identically. Wait for an actual need.

**Why:** A straightforward `typeof` in place is fine. Extra generality is more complexity than the code needs today.

**Verify:** Replace the type with the plain form and run tsc: no new errors means the specificity was unused.

**From past reviews:**

- ["I don't think we need such a straightforward function. Just a `typeof` in-place is code is fine."](https://github.com/michaelfaith/eslint-plugin-package-json/pull/741#discussion_r1921551139)
- ["We can always expand to more cases later. But in the meantime it's extra cognitive complexity for a feature we aren't 100% likely to need."](https://github.com/typescript-eslint/typescript-eslint/pull/6881#discussion_r1262787708)
- ["I think expanding the use case to predicates is just a bit more complexity than we need."](https://github.com/typescript-eslint/typescript-eslint/pull/8094#discussion_r1465021421)
- ["Why wrap the `object` expression in an object literal?"](https://github.com/typescript-eslint/typescript-eslint/pull/7092#discussion_r1262762950)

## Remove annotations and arguments TypeScript can infer

*9 comments · automatable*

**Check:** Flag explicit return types on non-exported functions, explicit generics on `createRule` or helpers, annotations on constants, unneeded `as const`, and listeners split out so that `node` must be annotated. Contributors have pushed back on this for exported functions, so treat it as a preference.

**Why:** Non-trivial annotations take up a lot of syntax space and make code a little harder to read, and TypeScript reports any mismatch anyway. typescript-eslint stopped enforcing explicit return types for non-exported functions.

**Verify:** Delete the annotation and run tsc --noEmit: no new errors means it was unnecessary.

**From past reviews:**

- ["we haven't enforced explicit return types for non-exported functions in a while. Non-trivial ones like this union with a deep object take up a lot of syntax space"](https://github.com/typescript-eslint/typescript-eslint/pull/11974#discussion_r2712810225)
- ["No need to explicitly declare those type arguments"](https://github.com/typescript-eslint/typescript-eslint/pull/8903#discussion_r1659831122)
- ["no need for this type or type annotation, TypeScript will let us know if anything is mismatched."](https://github.com/typescript-eslint/typescript-eslint/pull/11974#discussion_r2712813357)
- ["Many of the functions in this file have unnecessary type annotations."](https://github.com/flint-fyi/flint/pull/2169#discussion_r2738736485)

## Give AI-assisted rule code a discerning simplification pass

*8 comments*

**Check:** In generated-looking code, look for the reviewer's recurring tells together: explicit return types, property-capturing local variables, and separate `if` statements that could be one condition. Ask about authorship kindly or not at all: one author said the variable was their own habit and the reviewer apologized.

**Why:** The reviewer should not be able to tell code was AI-authored, and removing these is manual work that lands on the reviewer.

**From past reviews:**

- ["I can tell this is probably authored with AI. I should not be able to. Please apply a more discerning eye to the code."](https://github.com/typescript-eslint/typescript-eslint/pull/12218#discussion_r3311360419)
- ["I'd recommend doing a pass to remove unnecessary type annotations, variable closures, etc."](https://github.com/flint-fyi/flint/pull/2406#discussion_r2915201936)
- ["I've been manually removing them from AI-generated code."](https://github.com/flint-fyi/flint/pull/2169#discussion_r2738736485)
- ["Well in that case I apologize for implying it was from an API 😄 it's a very reasonable habit!"](https://github.com/typescript-eslint/typescript-eslint/pull/11974#discussion_r2712803097)

## Skip locals that only alias a property or are used once

*8 comments · automatable*

**Check:** Flag `const parent = node.parent;`-style aliases and variables used once on the next line. First check whether the variable exists for TypeScript narrowing, which is a legitimate reason: the reviewer retracted this comment once for that, and elsewhere recommended a variable to keep a narrowed type inside a closure.

**Why:** The pattern isn't worth the extra line and is a little verbose compared with using the original property. The reviewer wants a lint rule against it.

**Verify:** Inline the variable and run tsc: if narrowing breaks, keep the variable.

**From past reviews:**

- ["this _"store a single property in a variable"_ pattern isn't really necessary; I don't think it's worth the extra line."](https://github.com/typescript-eslint/typescript-eslint/pull/11974#discussion_r2712803097)
- ["Why bother making the variable if it's only used once, on a next line?"](https://github.com/typescript-eslint/typescript-eslint/pull/5965#discussion_r1022901113)
- ["it seems to like these "capture the property under a nicely-named variable" property. But it's a little verbose and I tend to just go with the original property."](https://github.com/flint-fyi/flint/pull/1513#discussion_r2690364043)
- ["_Ah_ it's because of the `if` statement's type narrowing. Fun. Never mind 🙂"](https://github.com/typescript-eslint/typescript-eslint/pull/11954#discussion_r2970269822)

## Extract long inline logic into named functions

*8 comments*

**Check:** When a block of `let` declarations is assigned once, or dozens of lines in the middle of a function or file do a separate job, extract a function that returns the result and name it for the job.

**Why:** Rules that are long for a first version are hard to read through, and `const` results of a named function make it clearer what is going on.

**From past reviews:**

- ["This file is already pretty big & chonky to understand."](https://github.com/flint-fyi/flint/pull/2316#discussion_r2915134434)
- ["But they are an indication IMO that a well-named function could clear up the code instead, too."](https://github.com/typescript-eslint/typescript-eslint/pull/8216#discussion_r1446586005)
- ["This code creates a collection of `let` variables once and then never changing their values again."](https://github.com/typescript-eslint/typescript-eslint/pull/5848#discussion_r1092539697)
- ["I found this `if`'s condition to be rather difficult to read."](https://github.com/typescript-eslint/typescript-eslint/pull/8011#discussion_r1438374214)

## Simplify helper signatures to what callers provide

*8 comments*

**Check:** Flag boolean parameters that change a function's core behavior, mutually exclusive parameters, single-property option objects, and parameters always called with every value. Split the function, take one input, or have it handle both cases in one call.

**Why:** Boolean parameters make a function's responsibilities hard to track, and mutually exclusive inputs aren't easily representable in TypeScript.

**Verify:** Narrow the parameter type and confirm assertions inside the function can be deleted.

**From past reviews:**

- ["I'm not generally a fan of adding boolean parameters to modify core behavior of a function."](https://github.com/typescript-eslint/typescript-eslint/pull/6853#discussion_r1160312087)
- ["we know `createPropertyKeyFixer` is only ever called with a `TSESTree.TSAnyKeyword`."](https://github.com/typescript-eslint/typescript-eslint/pull/11032#discussion_r2031606252)
- ["I'm finding it confusing to read through the mutually exclusive `node` and `type`."](https://github.com/typescript-eslint/typescript-eslint/pull/8502#discussion_r1575354697)
- ["Instead of using `!` non-null assertion operators frequently, the type system should be told that the property exists."](https://github.com/typescript-eslint/typescript-eslint/pull/6211#discussion_r1083381852)

## Use public APIs and avoid TypeScript internals

*7 comments · automatable · possibly stale · typescript-eslint*

**Check:** Prefer direct, public APIs over workarounds. Treat type assignability checks as high risk: they need extra review, and their internal status may have changed since these comments.

**Why:** Assignability APIs have been reverted after reaching production, so a rule that depends on them needs more than one maintainer's review.

**Verify:** Remove the augmentation and confirm the rule compiles against public TypeScript types.

**From past reviews:**

- ["This LGTM, but given how dangerous it is we should definitely also get review from @bradzacher and @kirkwaiblinger if they have time."](https://github.com/typescript-eslint/typescript-eslint/pull/11789#pullrequestreview-4125418837)
- ["We try very hard not to use TypeScript-internal APIs in our rules."](https://github.com/typescript-eslint/typescript-eslint/pull/7390#discussion_r1285114885)
- ["Requesting changes on using more direct, public APIs, and some more testing."](https://github.com/typescript-eslint/typescript-eslint/pull/7390#pullrequestreview-1564005113)
- ["But this is very risky (what if they update their internals?) so we try not to."](https://github.com/typescript-eslint/typescript-eslint/pull/7691#discussion_r1353270031)

## Don't redo what a helper or earlier branch already handles

*7 comments*

**Check:** Check whether a new condition is already covered by a function it calls, an earlier branch, or a later catch-all. Pass a found value in as a parameter instead of re-finding it, and fold a check repeated before every call into the callee.

**Why:** Doing the same search or check in two places lets them drift, especially as the logic gets more complex.

**Verify:** Remove the redundant check and run the tests; reorder branches if one call can serve both paths.

**From past reviews:**

- ["This should have already been found by `getSwitchMetadata`."](https://github.com/typescript-eslint/typescript-eslint/pull/10218#discussion_r1827999729)
- ["`getComputedPropertyDeprecation` is already being called in `getDeprecationReason`, just after the `getCallLikeDeprecation`."](https://github.com/typescript-eslint/typescript-eslint/pull/11006#discussion_r2031140948)
- ["This is handled by `isGlobalDocumentReference`:"](https://github.com/flint-fyi/flint/pull/2804#discussion_r3259587111)
- ["Moving the `isThisMemberExpression` check inside `getPropertyName` would clean up the code a bit, I think."](https://github.com/typescript-eslint/typescript-eslint/pull/8903#discussion_r1623496705)

## Prefer plain, conventional code over clever code

*6 comments*

**Check:** Flag constructs that took effort to read: clever automation, type-level tricks, general names like `key` or `iterator`, and mixed idioms for the same thing, which also tend to mark AI-authored code.

**Why:** Clever code has a difficulty cost for readers, and these rules are maintained for a long time. Most TypeScript developers won't understand elaborate type shenanigans.

**From past reviews:**

- ["...but like many clever code things, there was a difficulty cost of reading it at first."](https://github.com/typescript-eslint/typescript-eslint/pull/8389#pullrequestreview-1897298560)
- ["My only concern is that these types of types shenanigans can be unapproachable or complex to work with."](https://github.com/michaelfaith/eslint-plugin-package-json/pull/1258#pullrequestreview-3224280333)
- ["Try to use informative names when possible, not general ones like `key` or `iterator`"](https://github.com/typescript-eslint/typescript-eslint/pull/8282#pullrequestreview-1857025298)
- ["We try to keep these rules & the general typescript-eslint code really clean since we're a long-lived linting project."](https://github.com/typescript-eslint/typescript-eslint/pull/12317#pullrequestreview-4587432965)

## Remove commented-out code and leftover notes

*6 comments · automatable*

**Check:** Scan new rule files for commented-out code, personal notes, and fragments left from copying.

**Why:** Old commented-out code tends to get out of date and makes the file harder to read through.

**Verify:** Search the diff for `//` lines containing code.

**From past reviews:**

- ["Are these leftover from somewhere?"](https://github.com/typescript-eslint/typescript-eslint/pull/6096#discussion_r1032949538)
- ["Was this meant to indicate something? Or should it be removed?"](https://github.com/typescript-eslint/typescript-eslint/pull/6211#discussion_r1083382803)
- ["We generally don't like TODOs in code"](https://github.com/typescript-eslint/typescript-eslint/pull/6881#discussion_r1163225429)

## Prefer const expressions over `let` assigned later

*6 comments*

**Check:** Flag `let` variables given a placeholder value and overwritten, booleans set inside an `if`, and shared accumulators outside a loop. Try a `const` with a ternary, destructuring, or a direct boolean expression.

**Why:** A `let` confuses the reader and tends to duplicate logic, and placeholder values like `-1` are unnecessary if they are always overridden.

**From past reviews:**

- ["The `let` variable confused me a bit - there are a few points of duplication in the code."](https://github.com/typescript-eslint/typescript-eslint/pull/11767#discussion_r2556426880)
- ["Setting the values to `-1` is unnecessary because they're always overridden later."](https://github.com/typescript-eslint/typescript-eslint/pull/5965#discussion_r1022892176)
- ["Is there a need to have a shared variable outside the `forEach`?"](https://github.com/typescript-eslint/typescript-eslint/pull/8282#discussion_r1476282595)

## Return early instead of nesting

*5 comments · automatable*

**Check:** Look for deep `if` nesting, `else` after `return`, and large conditions that could be guard clauses. In the reviewer's words: invert if, reduce nesting. If the author has a real preference for nesting, let it go.

**Why:** Returning as soon as possible makes it clearer what's going on and avoids more indentation. The reviewer drops this when an author actually has an opinion.

**From past reviews:**

- ["I used to use the phrase _"invert if, reduce nesting"_ more in PR reviews. Now I'd rather make a lint rule for it"](https://github.com/typescript-eslint/typescript-eslint/pull/8216#discussion_r1471878174)
- ["In general, I think it's preferable to `return` as soon as possible. A bit clearer what's going on in the code."](https://github.com/michaelfaith/eslint-plugin-package-json/pull/70#discussion_r1460172259)
- ["This is quite a lot of nesting for consecutive `if` statements."](https://github.com/typescript-eslint/typescript-eslint/pull/8216#discussion_r1446586005)

## Merge redundant state into one source of truth

*5 comments*

**Check:** Look for two variables or fields where one is derivable from the other: paired booleans, a boolean alongside a nullable value, a field that is a `flatMap` of another, or an object used only to build an array. Keep one, using a union type where variants exist.

**Why:** If one value being truthy implies the other, the code is using two variables to store a single piece of info, which is a code smell for duplicate state.

**Verify:** Delete one variable, derive it from the other, and confirm tests pass.

**From past reviews:**

- ["So this is using two variables to store a single piece of info."](https://github.com/typescript-eslint/typescript-eslint/pull/5848#discussion_r1092537930)
- ["That's a bit of a code smell for duplicate state."](https://github.com/typescript-eslint/typescript-eslint/pull/8282#discussion_r1476290695)
- ["But the latter is just a flatMap of the former's `.selections`."](https://github.com/flint-fyi/flint/pull/1366#discussion_r2672445264)
- ["`optionsObj` is only ever used to create `optionsArr` - so we can inline them a bit."](https://github.com/typescript-eslint/typescript-eslint/pull/8389#discussion_r1500166587)

## Use Set or Map lookups instead of predicates and linear scans

*5 comments*

**Check:** Replace chained `===` name checks, `.find` over `Map` entries, and predicate-array schemes with a `Set` and `.has`, a `Map` keyed by what is being looked up, or a name-to-flags object. Don't widen a helper to a predicate if every caller passes a fixed set of names.

**Why:** A Set says more clearly what is happening, and keying the Map on the compared value turns an O(N) search into a single O(1) lookup.

**From past reviews:**

- ["I think it'd be a lot simpler to move those names into a `Set<string | undefined>` and use `.has`"](https://github.com/typescript-eslint/typescript-eslint/pull/6411#discussion_r1174754261)
- ["Then we can do a single O(1) lookup!"](https://github.com/typescript-eslint/typescript-eslint/pull/5728#discussion_r1146359968)
- ["How about using a `Set` instead to make it more clear what's happening?"](https://github.com/typescript-eslint/typescript-eslint/pull/8094#discussion_r1464980671)
- ["we can get rid of a good amount of the manual `... && ... && ...` checks by using a direct mapping from the name to type flags."](https://github.com/typescript-eslint/typescript-eslint/pull/10182#discussion_r2072022744)

## Compute a repeated value once

*3 comments*

**Check:** Look for the same function call or regex execution repeated with the same inputs in adjacent code. Store the result and reuse it, and use capture groups rather than running a second regex.

**Why:** Duplicate calls add noise even when the performance effect is negligible.

**From past reviews:**

- ["Nit, since we're calling the same function twice ~"](https://github.com/typescript-eslint/typescript-eslint/pull/10979#discussion_r2031125826)
- ["Instead of duplicating the function call, we can more directly check the `?.value` in the `if`:"](https://github.com/michaelfaith/eslint-plugin-package-json/pull/721#discussion_r1911404668)
- ["The `isCleanGitHubUrl` function above already performs a RegExp run on the string."](https://github.com/michaelfaith/eslint-plugin-package-json/pull/70#discussion_r1423138442)

## Omit meta fields that restate defaults

*3 comments · automatable · typescript-eslint*

**Check:** Remove `requiresTypeChecking: false`, `extendsBaseRule: false`, `hasSuggestions: false`, and similar falsy meta properties.

**Why:** Falsy is their default, so stating them adds nothing.

**Verify:** Delete the property and confirm rule behavior and generated docs are unchanged.

**From past reviews:**

- ["It's fine to leave this out; falsy is its default."](https://github.com/typescript-eslint/typescript-eslint/pull/5848#discussion_r1092543136)
- ["Nit: this is the default."](https://github.com/typescript-eslint/typescript-eslint/pull/5830#discussion_r996370984)
