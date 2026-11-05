# Testing: adversarial cases to generate

## Put comments and whitespace in every token gap

*20 comments*

**Check:** If the rule or its fixer reads source text, compares tokens, or rewrites a range, test line and block comments before and after each token of the matched syntax. Fixer output must keep those comments somewhere near their original spot.

**Why:** Comments trip up string checks and `getText()`, and fixers that rebuild text silently delete the comments inside the replaced range. The reviewer expects comments to be preserved, not dropped.

**Verify:** Feed a case with two block comments in every gap and assert that every letter survives in the output: `/* a */ /* b */ if /* c */ /* d */ ( /* e */ /* f */ foo /* g */ /* h */) /* i */ /* j */ { /* k */ /* l */ foo /* m */ /* n */ . /* o */ /* p */ bar /* q */ /* r */ () /* s */ /* t */; }`

**From your reviews:**

- ["Comments tend to trip up string checking, so it'd be good to have this (already working, yay!) test case:"](https://github.com/typescript-eslint/typescript-eslint/pull/8277#discussion_r1474788172)
- ["They tend to be broken over time by AST oddities like comments and whitespace."](https://github.com/typescript-eslint/typescript-eslint/pull/10963#discussion_r2010144851)
- ["Checking for commas tends to make me nervous because it's easy to write logic that's sensitive to the amount of spaces around tokens such as the `,`."](https://github.com/typescript-eslint/typescript-eslint/pull/4901#discussion_r866016122)
- ["comments tend to get in the way when using `getText()`!"](https://github.com/typescript-eslint/typescript-eslint/pull/7691#discussion_r1362613345)

## Types: test every position that supplies a contextual type

*14 comments · typescript-eslint*

**Check:** If a rule uses `getContextualType` or depends on inference, test each source of context: arguments, `return` statements, arrow bodies, array and tuple elements, default parameters, conditional branches, nested and discriminated object properties, `satisfies`, tagged templates, and outer annotations on generic constructors.

**Why:** Contextual typing differs at each position, and some of them cause false positives: removing an assertion can widen a generic or change a `satisfies` inferred type, so the fix may be unsafe.

**Verify:** `function f(): 'a' | 'b' { return 'a' as const; }`, `const e: () => 'a' | 'b' = () => 'a' as const;`, `const t: ['a' | 'b'] = ['a' as const];`, `function f(x: 'a' | 'b' = 'a' as const) {}`, `const c: Container<'a' | 'b'> = new Container('a' as const);`, `{ kind: 'a' as const } satisfies Recipient`.

**From your reviews:**

- ["`getContextualType` behavior on return positions can be really tricky."](https://github.com/typescript-eslint/typescript-eslint/pull/12317#discussion_r3311731396)
- ["Arrow function inference is a whole thing too:"](https://github.com/typescript-eslint/typescript-eslint/pull/12317#discussion_r3311731741)
- ["Another "fun" bug farm, a generic constructor pinned by an outer annotation:"](https://github.com/typescript-eslint/typescript-eslint/pull/12317#discussion_r3311729242)
- ["**False positive** `satisfies` operator:"](https://github.com/typescript-eslint/typescript-eslint/pull/12317#discussion_r3311731033)

## Nest the matched syntax one level deeper

*11 comments*

**Check:** Test the construct nested beyond the first level the rule was written for: blocks in a body, IIFEs, ternaries in ternaries, deep member chains, nested object or type literals, nested namespaces.

**Why:** Checks written against a specific parent often work for only one level. Deep member access and nested expressions have caused rule bugs before.

**Verify:** `constructor(public foo: string) { { this.foo = foo; } }`, `(() => () => {})()()`, `a ? (b ? { a: 'Hello' } : {}) : {}`, `a.b.c === a.b.c`, `this.testObj?.prop?.prop`, `outer: { middle: { inner: {} } }`.

**From your reviews:**

- ["Checks for specifically conditionals sometimes only work for one level."](https://github.com/typescript-eslint/typescript-eslint/pull/11908#discussion_r2655958614)
- ["I've seen issues with rules in the past from deeply nested expressions: `a.b.c` and the like."](https://github.com/flint-fyi/flint/pull/2169#discussion_r2738729118)
- ["A block in the constructor body: `constructor(public foo: string) { { this.foo = foo; } }`"](https://github.com/typescript-eslint/typescript-eslint/pull/8903#discussion_r1623497766)
- ["Multiple levels of IIFEs (e.g. `(() => () => {})()()`)"](https://github.com/typescript-eslint/typescript-eslint/pull/6237#discussion_r1051448088)

## Types: test unions and intersections of the matched type

*10 comments*

**Check:** If a rule matches a type, test that type as one constituent of a union, of an intersection, and of a combined `|` and `&` type, mixing in unrelated types.

**Why:** Unions and intersections are among the first gaps the reviewer lists for type-aware rules, and even a change that doesn't seem to depend on them gets a cursory test just in case.

**Verify:** `string | string[]`, `number[] & string[]`, `Map<boolean, string> & Set<number>`, `1 & number`, `(A | B) & C`. Include one case where only some constituents match.

**From your reviews:**

- ["Intersections and unions: with `Map`, `Set`, and/or other types"](https://github.com/typescript-eslint/typescript-eslint/pull/9369#discussion_r1657113106)
- ["Combination `|` union and `&` intersection types"](https://github.com/typescript-eslint/typescript-eslint/pull/10907#discussion_r1987131861)
- ["Targets that are a union type including array (e.g. `string | string[]`)"](https://github.com/typescript-eslint/typescript-eslint/pull/5852#discussion_r1111175381)
- ["Intersections, like `number[] & string[]` or `Map<boolean, string> & Set<number>`"](https://github.com/typescript-eslint/typescript-eslint/pull/8509#discussion_r1500652364)

## Types: test every spelling of built-in collection types

*9 comments*

**Check:** If a rule matches arrays, maps, sets, or iterables, test each way to write them: `T[]`, `Array<T>`, `readonly T[]`, `ReadonlyArray<T>`, `Readonly<T[]>`, tuples, `ArrayLike`, typed arrays, multi-dimensional arrays, `ReadonlyMap`, `ReadonlySet`, and classes with `[Symbol.iterator]`.

**Why:** A test on `string[]` says nothing about readonly, alias, tuple, and built-in array-like forms, and the reviewer lists these repeatedly as missing.

**Verify:** One test each for `ReadonlyArray<string>`, `Readonly<Array<string>>`, `[string, number]`, `[]`, `Uint8Array`, `string[][]`, `ReadonlySet<string>`. Decide explicitly on ambiguous ones such as `ArrayLike`.

**From your reviews:**

- ["Built-in aliases, like `ReadonlyMap` and `ReadonlySet`"](https://github.com/typescript-eslint/typescript-eslint/pull/8509#discussion_r1500652364)
- ["Targets that are declared as `Array<something>`, not just `something[]`"](https://github.com/typescript-eslint/typescript-eslint/pull/5852#discussion_r1111175381)
- ["`Uint8Array` (as in, a built-in array-like)"](https://github.com/typescript-eslint/typescript-eslint/pull/8509#discussion_r1528461940)
- ["I think we'll want a few more for more edge cases around tuples: `[]`, `[() => void]`, `[undefined, () => void]`, etc."](https://github.com/typescript-eslint/typescript-eslint/pull/5731#discussion_r986385835)

## Types: test type operators and utility types

*9 comments*

**Check:** Run a type-aware rule against types built with type operators, not just named or literal ones: conditional, mapped, `keyof`, `typeof`, indexed access, template literal types, and utilities such as `Readonly`, `Partial`, `Omit`, and `ReturnType`.

**Why:** These variants could break the rule because they resolve differently from a plain interface, and they are common in real code.

**Verify:** `Readonly<Error>`, `Partial<Foo>`, `type U<T> = { [K in keyof T]: 0 }`, a template literal type such as ``export type M = `${Accessibility}`;``, `Key extends keyof typeof fruits`, `type Foo = Bar[1 & number];`.

**From your reviews:**

- ["There are going to be quite a few variants of types that could break the rule:"](https://github.com/typescript-eslint/typescript-eslint/pull/10744#discussion_r1999068740)
- ["I'd think `keyof` and/or `typeof` types should be flagged too:"](https://github.com/typescript-eslint/typescript-eslint/pull/8443#discussion_r1667410552)
- ["Usage of the built-in `Partial` type"](https://github.com/typescript-eslint/typescript-eslint/pull/11720#discussion_r2487520317)
- ["Missing test coverage: wild and wacky types"](https://github.com/typescript-eslint/typescript-eslint/pull/6211#discussion_r1083383520)

## Types: test `any`, `unknown`, `never`, `void`, and the error type

*8 comments*

**Check:** For a type-aware rule, run each checked position with `any`, `unknown`, `never`, `void`, and an unresolved (intrinsic error) type, and decide deliberately whether each reports.

**Why:** The reviewer adds these to the missing-case list of nearly every type-aware rule, and the right answer isn't always obvious: an argument for allowing `unknown` may not apply to `never`.

**Verify:** `declare const x: never; delete x[0];`, `declare const x: unknown; ...`, `declare const intrinsicError: NotKnownType;`. One standalone test per type.

**From your reviews:**

- ["`never`: I'd think this should report an error, similar to `unknown`?"](https://github.com/typescript-eslint/typescript-eslint/pull/8094#discussion_r1449143075)
- ["We should make sure `unknown` contextual types aren't reported on:"](https://github.com/typescript-eslint/typescript-eslint/pull/12317#discussion_r3311728670)
- ["The namespace being `any` `unknown`, and instrinsic error"](https://github.com/typescript-eslint/typescript-eslint/pull/10374#discussion_r1866046444)

## Wrap matched nodes in redundant parentheses

*7 comments*

**Check:** Test each matched expression or type wrapped in one and two layers of unnecessary parentheses, including on inner operands, and include a case where the fixer has to handle them.

**Why:** Parentheses and wrapping expressions are tricky, and they tend to be an edge case rules break on over time even when they work today.

**Verify:** `delete ((abc[((def))]))`, `...(map)`, `((z = y))`, `( /* */ ( z = y ) /* */ )`, `((() => void))`. Assert the same report as the unwrapped form and a syntactically valid fix.

**From your reviews:**

- ["It works right now, but parenthesis tend to be an edge case we break on over time."](https://github.com/typescript-eslint/typescript-eslint/pull/10719#discussion_r1958259464)
- ["Parenthesis and wrapping expressions are tricky."](https://github.com/typescript-eslint/typescript-eslint/pull/4848#discussion_r856473295)
- ["These can be surprisingly tricky! `delete ((abc[((def))]))`"](https://github.com/typescript-eslint/typescript-eslint/pull/8067#discussion_r1438397989)

## Test every way to spell a name

*7 comments*

**Check:** If a rule matches a property, key, or member by name, test quoted, computed, template-literal, and constant-variable forms, plus names with dots, dashes, quotes, `#`, or an empty string. Cover each key node type the AST allows.

**Why:** Name matching built on identifiers or raw text misses equivalent spellings, and string parsing leads to weird accidents when a name contains punctuation.

**Verify:** `Promise['all']`, ``Promise[`all`]``, `const key = 'all'; Promise[key]`, `set [p1](val) {}`, `'b.c': Foo`, `'foo-bar': string`, `'': string`, `'0': string`.

**From your reviews:**

- ["`const key = "all"; Promise[key]`"](https://github.com/typescript-eslint/typescript-eslint/pull/8094#discussion_r1449151419)
- ["In the types, `JSONProperty`'s key is `JSONIdentifier | JSONStringLiteral | JSONNumberLiteral`"](https://github.com/michaelfaith/eslint-plugin-package-json/pull/851#discussion_r1938502998)
- ["I just want to make sure if we refactor this to be more dynamic in the future, we don't get weird accidents around incorrect string parsing."](https://github.com/typescript-eslint/typescript-eslint/pull/4054#discussion_r737100596)
- ["`'foo-bar': ...`"](https://github.com/typescript-eslint/typescript-eslint/pull/4582#discussion_r813366395)

## Test every member of a node kind or operator list

*7 comments*

**Check:** When source code lists node types, operators, or statement kinds (or the import path has an export twin), each entry needs its own test case. Do not let one entry stand in for the list.

**Why:** A list in the rule is a claim of behavior. An untested entry can be removed without anyone noticing, and the sibling forms are the ones that were forgotten.

**Verify:** For an assignment rule: `=`, `+=`, `||=`, `&&=`, `??=`. For a loop rule: `do`, `for`, `for-in`, `for-of`, `while`. For an import rule: copy each test with `export ... from`, and add `import B = A.B;`.

**From your reviews:**

- ["The rule mentions Call, Member, New, and As Expressions, as well as type assertions and variable declarators. Each should have a valid & invalid case."](https://github.com/typescript-eslint/typescript-eslint/pull/8334#discussion_r1477074987)
- ["Missing test coverage for at least `??=`. Perhaps other assignment types. Add in any you can think of."](https://github.com/flint-fyi/flint/pull/389#discussion_r2419671689)
- ["These loop checks aren't covered by tests. Removing them doesn't fail anything."](https://github.com/flint-fyi/flint/pull/468#discussion_r2430257012)
- ["I added one locally that was a copy of the last test, `// Both regular and type imports should still be restricted`, but switched to exports instead of imports."](https://github.com/eslint/eslint/pull/19562#discussion_r2035110281)

## Test class and function expressions, not just declarations

*7 comments*

**Check:** If a rule handles a class or function, test declarations, expressions, named expressions, and arrow forms. Also put them in odd places: inside function bodies, IIFEs, `extends` clauses, and other block statements.

**Why:** Tests tend to cover one tidy top-level class, while valid TypeScript allows horrifying placements that the rule's scoping logic still has to handle.

**Verify:** `const Values = class {}`, `const testE = function (this: void) {}`, `class Apple extends class Banana {} {}`, `extends class WithName { ... }`, a class declared inside `if (x) { ... }`.

**From your reviews:**

- ["Working in both class _declarations_ (`class Values {}`) as well as class _expressions_ (`const Values = class {}`)"](https://github.com/JoshuaKGoldberg/eslint-plugin-erasable-syntax-only/pull/14#discussion_r1957406691)
- ["Inside a class extends clause, like `class Apple extends class Banana {}`"](https://github.com/typescript-eslint/typescript-eslint/pull/5840#discussion_r997589637)
- ["`this` can also be annotated on function declarations & expressions:"](https://github.com/eslint/eslint/pull/19557#discussion_r2052489612)
- ["At least one other kind of block statement - to make sure it's not just `function` blocks that work"](https://github.com/typescript-eslint/typescript-eslint/pull/5998#discussion_r1024041143)

## Test spread and rest forms

*7 comments*

**Check:** If a rule walks arguments, parameters, elements, or properties, test spreads and rests, including spreads of conditional or logical expressions. Passing a spread through code that assumes an expression is a common gap.

**Why:** Guards for `SpreadElement` keep showing up untested: they can be removed with no test failing, and it is often unclear whether they can be reached.

**Verify:** `Promise.resolve().catch((...[args]: [unknown]) => {})`, `...(condition && Promise.resolve({ key: 42 }))`, `...(condition ? Promise.resolve({ key: 42 }) : {})`, `const foo: Record<string, () => void> = { ...cbs };`.

**From your reviews:**

- ["`...(condition && Promise.resolve({ key: 42 }))`"](https://github.com/typescript-eslint/typescript-eslint/pull/5053#discussion_r879670290)
- ["`Promise.resolve().catch((...[args]: [unknown]) => {`"](https://github.com/typescript-eslint/typescript-eslint/pull/8383#discussion_r1483256543)
- ["Spreads/rests"](https://github.com/typescript-eslint/typescript-eslint/pull/10009#discussion_r1764960917)
- ["If I remove this `&& elemNode.type !== AST_NODE_TYPES.SpreadElement`, all unit tests still pass."](https://github.com/typescript-eslint/typescript-eslint/pull/9707#discussion_r1741325669)

## Test each option off, on, and combined

*7 comments*

**Check:** For each option, test default behavior without it, behavior with it, a case where it does not apply, and how it interacts with overlapping options. A new option also needs cases across the kinds of values it can match.

**Why:** A test of only the enabled state misses the default, and options can accidentally override each other, which would be a breaking change.

**Verify:** Default: `exports` isn't sorted. With `options: [["exports"]]`: it is. For overlap: enable `allowAliases` and confirm `allowTemplateLiterals` doesn't override it. For allowlists, add a negative case that isn't listed.

**From your reviews:**

- ["By default, the rule does not enforce sorting for `"exports"`"](https://github.com/michaelfaith/eslint-plugin-package-json/pull/918#discussion_r1976555114)
- ["This PR's change breaks that last bit (and would be a breaking change as a result): it makes `allowTemplateLiterals` always override `allowAliases`."](https://github.com/typescript-eslint/typescript-eslint/pull/5097#discussion_r888061529)
- ["Looks like there are missing cases for having `typedefs: true` without `ignoreTypeReferences: false`?"](https://github.com/eslint/eslint/pull/19566#discussion_r2031639672)
- ["Missing tests fo the new option, I think:"](https://github.com/typescript-eslint/typescript-eslint/pull/9954#discussion_r1781096016)

## Types: test constrained, defaulted, and curried type parameters

*7 comments*

**Check:** Test a type parameter in place of each concrete type the rule matches: unconstrained `T`, `T extends Matched`, `T extends Matched | null`, `T[]`, defaults, and curried generics. Check the rule uses the constraint rather than the raw type parameter.

**Why:** These features tend to break things with type parameters. The reviewer wants constraints respected and points to `getConstrainedTypeAtLocation` as the tool.

**Verify:** `function withValues<T extends string[]>(values: T) {}`, `function f<T extends unknown>(t: T[]) { delete t[0]; }`, `id<T extends 'a' | 'b'>(x: T)`, `<T = string>`, `const curried = <Outer>(outer: Outer) => <Inner>(inner: Inner) => ({ outer, inner });`

**From your reviews:**

- ["The following features tend to break things with type parameters:"](https://github.com/typescript-eslint/typescript-eslint/pull/11918#discussion_r2682741294)
- ["Generic types (making sure type parameter constraints are respected)"](https://github.com/typescript-eslint/typescript-eslint/pull/7957#discussion_r1398732805)
- ["Constrained type parameters (`function withValues<T extends string[]>(values: T) {`)"](https://github.com/typescript-eslint/typescript-eslint/pull/8216#discussion_r1446593874)
- ["let's add an `extends` with something like `id<T extends 'a' | 'b'>(x: T)`."](https://github.com/typescript-eslint/typescript-eslint/pull/12317#discussion_r3311729536)

## Test every call-like expression

*6 comments*

**Check:** If a rule handles function calls, test the other forms that invoke something: `new`, tagged templates, methods on classes, and optional calls. If it inspects unusual parents, also try `class` and `new` expressions there.

**Why:** Forms other than a plain call get forgotten, and a generic tag function produced a real false positive where removing `as const` would let `T` widen.

**Verify:** ``myTag`abc`;``, ``tag`prefix ${'a' as const}` ``, `new Example('a' as const);`, `new K().m('a' as const);`.

**From your reviews:**

- ["Non-generic `new` calls are a thing to test too:"](https://github.com/typescript-eslint/typescript-eslint/pull/12317#discussion_r3312470395)
- ["**False positive** tagged template substitution with a generic tag function:"](https://github.com/typescript-eslint/typescript-eslint/pull/12317#discussion_r3311729928)
- ["TaggedTemplateExpressions like `noFormat` should have test coverage to make sure that's allowed:"](https://github.com/typescript-eslint/typescript-eslint/pull/11323#discussion_r2162083662)
- ["user-defined generic method on a non-generic class:"](https://github.com/typescript-eslint/typescript-eslint/pull/12317#discussion_r3311730750)

## Test every enum shape

*6 comments*

**Check:** When a rule can touch enums, test implicit values, string values, mixed number and string members, out-of-order numbers with gaps, quoted and computed `['a']` keys, and falsy members. Include both valid and invalid enum cases.

**Why:** After one rule change was reverted, the reviewer wanted thorough enum tests. String-valued enums with falsy values are of particular interest, and computed keys get in the way of `getText()`.

**Verify:** `enum E { This, That }`, `enum E { This = '', That = 'a' }`, `enum E { This = '', That = 0 }`, `enum E { A = 5, B, C = 1 }`, `enum E { ['a'] = 1 }`, `enum E { ['a' /* gotcha */] = 1 }`.

**From your reviews:**

- ["Mixed enums (`enum ExampleEnum { This = '', That = 0 }`)"](https://github.com/typescript-eslint/typescript-eslint/pull/6096#discussion_r1059523859)
- ["Numbers that are out-of-order, including gaps and/or implicit values"](https://github.com/JoshuaKGoldberg/eslint-plugin-erasable-syntax-only/pull/39#discussion_r2005464161)
- ["I think there will need to be some thorough tests around `enum`s."](https://github.com/typescript-eslint/typescript-eslint/pull/10591#discussion_r1905451031)
- ["Although TypeScript says its enums can't have computed property names, `["key"]` literals are allowed."](https://github.com/typescript-eslint/typescript-eslint/pull/7691#discussion_r1362613345)

## Test every class member modifier and kind

*5 comments*

**Check:** If a rule touches class members or parameter properties, test each of `public`, `protected`, `private`, `readonly`, `static`, `accessor`, combinations of accessibility with `readonly`, and getters and setters.

**Why:** A test for one modifier says nothing about the others, even when a selector or option claims to accept them all.

**Verify:** `constructor(public a: string) {}`, `constructor(protected a: string) {}`, `constructor(readonly a: string) {}`, `constructor(private readonly a: string) {}`, plus a getter and setter pair.

**From your reviews:**

- ["The selector describes being able to take in other modifies (`private`, `readonly`, etc.) - but this test only tests `static`."](https://github.com/typescript-eslint/typescript-eslint/pull/8084#discussion_r1449069141)
- ["IMO there should also be tests for other kinds of parameter properties:"](https://github.com/eslint/eslint/pull/19551#discussion_r2014007097)
- ["Parameter property with both an accessibility and `readonly`"](https://github.com/JoshuaKGoldberg/eslint-plugin-erasable-syntax-only/pull/14#discussion_r1990398012)
- ["Getters and setters"](https://github.com/typescript-eslint/typescript-eslint/pull/5413#discussion_r934601531)

## Test falsy and alternate numeric literals

*5 comments*

**Check:** When a rule compares or stores literal values, test `''`, `0`, `0.0`, `-0`, `-0n`, `` `0` ``, `'0'`, and bigint or template literal equivalents of the value it expects.

**Why:** A truthiness check where an `=== undefined` check was needed passes every test that uses non-empty values. The reviewer keeps these around even when the code is right, because that can change later.

**Verify:** `enum E { A = '', B = '' }` and `enum E { A = 0, B = 0 }` for a duplicate check; `arr.filter(f)[0.0]`, `[-0]`, `[-0n]`, and a template-literal `0` index for an index check.

**From your reviews:**

- ["There should probably be test cases for falsy values: `''` and `0`."](https://github.com/typescript-eslint/typescript-eslint/pull/4833#discussion_r855610518)
- ["Negatives for all the bigint/number cases: `-0`, `-0.0`, `-0n`, etc."](https://github.com/typescript-eslint/typescript-eslint/pull/8216#discussion_r1446593874)
- ["Of particular interest is how this deals with string-valued enums with falsy values."](https://github.com/typescript-eslint/typescript-eslint/pull/6096#discussion_r1059523859)
- ["`'0': ...` _(you never know with numbers...)_"](https://github.com/typescript-eslint/typescript-eslint/pull/4582#discussion_r813366395)

## Test empty, missing, and single-item inputs

*5 comments*

**Check:** If a rule walks a collection or an expected property, test it absent, empty, with one entry, and with a sibling property missing. Decide what the behavior should be, and at minimum confirm no crash.

**Why:** Boundary shapes are where the rule's assumptions about structure fail, and a surprising shape like `import {} from 'foo'` should not crash the rule.

**Verify:** `import {} from 'foo';`, `{}` with no `"scripts"` key, `{ "scripts": {} }`, `"repository": { "url": "..." }` with no `"type"`, `"some-custom-array": [ [] ]`, an empty tuple `[]`.

**From your reviews:**

- ["We should ensure that doesn't crash at the least, and also has some reasonable behavior."](https://github.com/typescript-eslint/typescript-eslint/pull/8308#discussion_r1469912070)
- ["Missing test case, I think: what happens if `"repository"` is missing a `"type"`."](https://github.com/michaelfaith/eslint-plugin-package-json/pull/70#discussion_r1460171184)
- ["No `"scripts"` key at all"](https://github.com/michaelfaith/eslint-plugin-package-json/pull/903#discussion_r1996238652)

## Test several violations or uses in one target

*5 comments*

**Check:** When a rule accumulates state or walks a list, test mixes of good and bad entries, duplicates, more than one report in a single target, and a variable used more than once. This is one behavior under test, so it doesn't conflict with granular cases.

**Why:** Some bugs only appear when there are multiple failures, and clever `.some` logic can behave differently with multiple uses.

**Verify:** 1 incorrect + 2 correct values, 2 incorrect values, 2 incorrect + 1 correct, duplicates, `"bin": { "": "" }` producing two `errors` entries, multiple `/// <reference` comments.

**From your reviews:**

- ["1 incorrect value + 2 correct values"](https://github.com/michaelfaith/eslint-plugin-package-json/pull/903#discussion_r1996239636)
- ["Missing test case: >1 elements in `errors`."](https://github.com/michaelfaith/eslint-plugin-package-json/pull/1082#discussion_r2140184747)
- ["this only happens if there are multiple failures, right?"](https://github.com/michaelfaith/eslint-plugin-package-json/pull/315#discussion_r1583223867)
- ["makes me worry about how this interacts with multiple uses"](https://github.com/typescript-eslint/typescript-eslint/pull/9330#discussion_r1653890552)

## Test ambient contexts and namespaces

*4 comments*

**Check:** Test the construct inside `declare namespace`, `declare global`, and nested namespaces, and test code that comes right after those blocks to prove any tracked state gets reset.

**Why:** Ambient context changes what is legal. Rules that track being inside a declaration can leak that state to code following the block.

**Verify:** `declare namespace myLib { let valueInside: number; } let valueOutside: number;`, and `namespace Outer { declare namespace Declared { namespace InsideDeclared {} } }`.

**From your reviews:**

- ["it's definitely an important line to have for cases of variables after a declared namespace:"](https://github.com/eslint/eslint/pull/19540#discussion_r2016253675)
- ["I think there are few more edge cases that should be tested around declared namespaces inside a non-declared one, both exported and not:"](https://github.com/typescript-eslint/typescript-eslint/pull/4844#discussion_r855622480)
- ["Inside a `declare global`"](https://github.com/typescript-eslint/typescript-eslint/pull/5840#discussion_r997589637)

## Types: test inheritance chains and mixed heritage clauses

*4 comments*

**Check:** If a rule looks at a type's base classes or interfaces, test multiple bases, transitive bases, `extends` plus `implements`, and interfaces extending other interfaces, with the relevant type at each position.

**Why:** Tests that check one direct parent miss matches in the second base or further up the chain.

**Verify:** `A extends B, C` where `B` is listed, where `C` is listed, and `A extends B, C` + `B extends D, E` where `E` is listed. Also `extends Bar implements Foo, Baz` and `interface StillUnsafe extends Function`.

**From your reviews:**

- ["`A extends B, C` + `B extends D, E` where `E` is listed"](https://github.com/typescript-eslint/typescript-eslint/pull/11764#discussion_r2538328758)
- ["`extends Bar implements Foo, Baz`"](https://github.com/typescript-eslint/typescript-eslint/pull/9707#discussion_r1967876256)
- ["Interfaces extending other interfaces"](https://github.com/typescript-eslint/typescript-eslint/pull/10744#discussion_r1999068740)
- ["Missing coverage here. I got it with:"](https://github.com/typescript-eslint/typescript-eslint/pull/10010#discussion_r1765043119)

## Types: test overloaded signatures

*4 comments*

**Check:** If a rule reads a call's signature or return type, test overloads where signatures disagree, including mixed generic and non-generic signatures. Watch for code that hardcodes `signatures[0]` instead of the resolved signature.

**Why:** Overloads are a bug farm: the first signature is often not the one that applied. Even when the rule can't be broken today, the cases guard against regressions.

**Verify:** `declare function example(x: 'a' | 'b'): void; declare function example<T>(value: T): T; example('a' as const);` and an interface with `(): undefined;` and `(value: string): void;`.

**From your reviews:**

- ["Overload signatures are a mess to deal with and tend to break over time."](https://github.com/typescript-eslint/typescript-eslint/pull/11826#discussion_r2617207576)
- [""Fun" bug farm edge case that should have coverage, overloaded callee with mixed generic + non-generic signatures:"](https://github.com/typescript-eslint/typescript-eslint/pull/12317#discussion_r3311728966)
- ["including [function overloads that report]"](https://github.com/typescript-eslint/typescript-eslint/pull/11720#discussion_r2487520317)

## Test destructuring variants

*3 comments*

**Check:** If a rule looks at bindings or parameters, test object destructuring, renamed keys, reordered keys, and tuple destructuring in addition to the plain identifier form.

**Why:** The reviewer asks for renamed, reordered, and destructured forms as cases that a plain identifier test doesn't reach.

**Verify:** `const { a: c } = values;`, `const { b, a } = values;`, `.catch(({ gotcha }) => { })`, `const [a, b = 'default'] = tuple;`.

**From your reviews:**

- ["`const { a: c } = values;`"](https://github.com/typescript-eslint/typescript-eslint/pull/6281#discussion_r1057819728)
- ["`Promise.resolve('object destructuring').catch(({ gotcha }) => { });`"](https://github.com/typescript-eslint/typescript-eslint/pull/8383#discussion_r1483256543)
- ["Destructured tuples"](https://github.com/typescript-eslint/typescript-eslint/pull/11720#discussion_r2487520317)

## Test that same-named nested keys are ignored

*3 comments*

**Check:** If a rule targets a specific key at a specific level, such as a top-level field in a JSON document, test the same key nested deeper and test sorted or valid top-level keys with messy sub-keys.

**Why:** This proves the logic looks only at the intended level rather than at any node with a matching name.

**Verify:** `{ "outer": { "repository": "https://github.com/a/b" } }` is valid for a top-level `repository` rule. A nested object with and without `author` should not change `require-author`.

**From your reviews:**

- ["Could you add a `valid` case where the top-level keys are sorted but sub-keys aren't? That way we know the logic is still just looking at the top-level keys."](https://github.com/michaelfaith/eslint-plugin-package-json/pull/312#discussion_r1582301716)
- ["Nested object with and without `author`, to make sure only the root-level one is checked"](https://github.com/michaelfaith/eslint-plugin-package-json/pull/851#discussion_r1938502998)
- ["A custom nested property like `{ "outer": { "repository": "https://github.com/a/b" } }`"](https://github.com/michaelfaith/eslint-plugin-package-json/pull/70#discussion_r1423149248)

## Test user-defined shadows and aliases of globals

*3 comments*

**Check:** If a rule matches a global by name, test a local declaration with that name (should not report) and an alias of the real global (should report), so the name match is backed by scope analysis.

**Why:** A name-only check flags user code that happens to share the name and misses calls through a variable. If the rule has scope logic, the tests need to exercise it.

**Verify:** `function require(...) {}` then `require('x')`, `const CustomFunction = Function; const fn = new CustomFunction();`, `const key = 'all'; Promise[key]`.

**From your reviews:**

- ["The rule's source includes logic around scope analysis (good!) but the tests don't. Could you add cases for user-defined `require` please?"](https://github.com/typescript-eslint/typescript-eslint/pull/8334#discussion_r1477074987)
- ["Wrong, this should be a failure case. The rule should use scope analysis (or, pending #400, type checking) to go-to-definition on calls like this."](https://github.com/flint-fyi/flint/pull/462#discussion_r2429592065)

## Test a name used in both type and value positions

*3 comments*

**Check:** For scope-based rules, test an identifier referenced as a type and as a runtime value in the same file, and `typeof` references inside type annotations.

**Why:** Clever logic that classifies a reference as type-only raises the worry of how it interacts with multiple uses.

**Verify:** `const value = 1; export const alsoValue = value; export type Type = typeof value;`

**From your reviews:**

- ["Can you also add a test for the case of a single variable being used in both a type position and a non-type / runtime?"](https://github.com/typescript-eslint/typescript-eslint/pull/9330#discussion_r1653890552)
- ["I personally don't use it, but I think some folks would still want errors in cases like:"](https://github.com/typescript-eslint/typescript-eslint/pull/8474#discussion_r1492943851)

## Types: test branded primitives

*3 comments*

**Check:** If a rule reasons about primitive or literal types, test branded forms such as `string & { __brand: string }`, including branded falsy literals and branded values inside existing complex expressions.

**Why:** Branded types exercise interesting quirks of aliases and truthiness. Adding invalid cases for them showed `"" & { __brand: string }` needed its own fix.

**Verify:** `false & { brand }`, `true & { brand }`, `'' & { __brand: string }`, `{} & { __brand: string }`, `string & string`, and a branded value swapped into `if (('' && {}) || (0 && void 0)) { }`.

**From your reviews:**

- ["`{} & { __brand: string }`: should this still cause a report?"](https://github.com/typescript-eslint/typescript-eslint/pull/7466#discussion_r1295027810)
- ["Also: how about `false & { brand }` and `true & { brand }`?"](https://github.com/typescript-eslint/typescript-eslint/pull/9297#discussion_r1653881087)
- ["I think it exercises some interesting quirks of aliases and branded types we'll want to make sure stay supported."](https://github.com/typescript-eslint/typescript-eslint/pull/11954#discussion_r2682311445)

## Types: treat `this` parameters as a distinct parameter shape

*3 comments*

**Check:** If a rule counts or indexes parameters, test an explicit `this` parameter on declarations and expressions, and a first parameter that merely looks similar, such as a non-`this` param typed `void`.

**Why:** Rule logic that special-cases a leading `this` parameter needs both sides tested. Leaving the non-`this` look-alike untested was a symptom of a bug.

**Verify:** `function testD(this: void) {}`, `const testE = function (this: void) {}`, `function test(a: void, b);`, and an assertion function with a `this` parameter.

**From your reviews:**

- ["Which is a symptom of a bug, I think: that having a non-`this` first param typed as `void` isn't tested."](https://github.com/eslint/eslint/pull/19557#discussion_r2052492994)
- ["`this` can also be annotated on function declarations & expressions:"](https://github.com/eslint/eslint/pull/19557#discussion_r2052489612)
- ["`this` parameters"](https://github.com/typescript-eslint/typescript-eslint/pull/10009#discussion_r1764960917)

## Types: test each nullish and void union combination

*3 comments*

**Check:** When a rule checks for nullability or void, test `T | null`, `T | undefined`, `T | null | undefined`, and `undefined | void`, including through constraints such as `T extends 'a' | null`.

**Why:** It's a common source of bugs to confuse a type flag being set with something being only that type, and flag checks get broken over time.

**Verify:** `string | undefined`, `string | null | undefined`, `T extends 'a' | null`, and `interface Unioned { (): undefined | void; }`.

**From your reviews:**

- ["Another common soruce of bugs is knowing when to check for a type flag being set vs. something specifically and only being a type."](https://github.com/typescript-eslint/typescript-eslint/pull/11826#discussion_r2617210237)
- ["Nullability / flag checking can be tricky & gets busted over time a lot."](https://github.com/typescript-eslint/typescript-eslint/pull/4509#discussion_r799066766)
- ["`T extends 'a' | null` (still needing `??`)"](https://github.com/typescript-eslint/typescript-eslint/pull/6910#discussion_r1167976466)

## Test multi-code-unit characters in text measurements

*2 comments*

**Check:** If a rule measures or aligns text, test astral characters, emoji, and emoji sequences in identifiers, keys, and comments.

**Why:** The reviewer points to ESLint PRs on the same kind of text handling, and in key-spacing the fix needed grapheme-aware code.

**Verify:** Keys such as `[𐌘]`, `"𐌘"`, and `🎁`, and `// @ts-expect-error 👨‍👩‍👧‍👦`, in both `valid` and `invalid`.

**From your reviews:**

- ["Missing test coverage: non-English keys such as `[𐌘]`, `"𐌘"`, and `🎁`."](https://github.com/typescript-eslint/typescript-eslint/pull/6211#discussion_r1083382065)
- ["mention including more test cases around other unusual characters."](https://github.com/typescript-eslint/typescript-eslint/pull/5704#discussion_r985055361)
