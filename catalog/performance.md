# Performance

## Run cheap AST checks before type information and expensive lookups

*19 comments*

**Check:** Order syntactic checks before type checker calls, and watch for manual traversals (such as `simpleTraverse`) or per-file graph building. Readability refactors can also move work into hot paths.

**Why:** Asking the type checker for anything can be slow, so AST comparison goes first. Reducing the amount of work done is a design goal for type-heavy rules.

**Verify:** Read each listener for type checker calls that run before a cheap syntactic bail-out.

**From your reviews:**

- ["We'd want to do them in that order because asking the type checker for anything can be slow."](https://github.com/typescript-eslint/typescript-eslint/pull/5728#issuecomment-1307161253)
- ["Generally, asking for type information is the most performance-expensive part of rules."](https://github.com/typescript-eslint/typescript-eslint/pull/8094#discussion_r1449111178)
- ["Ah splitting to variables in this way and then having the `if` _after_ them is a performance papercut."](https://github.com/typescript-eslint/typescript-eslint/pull/8011#discussion_r1438374214)
- ["Asking TypeScript for the type of a node can sometimes be surprisingly expensive. It's best to minimize those calls when possible."](https://github.com/typescript-eslint/typescript-eslint/pull/5852#discussion_r1020978822)

## Stop traversing once the answer is known

*10 comments · automatable*

**Check:** Check loops and tree walks for a point where the result can't change. Bail out once a threshold is reached, return truthy from `forEachChild` to stop it, use `.some` over `.every` where valid, and walk up from a node via parents rather than down through all children.

**Why:** Continued iteration keeps paying for calls such as `getStart()`, and recursing down into a node with many children can take a lot of time. A traverser that can't break is the wrong tool.

**From your reviews:**

- ["If `numExplicitUses >= 2` then we can bail out of the loop for the `typeParameter`."](https://github.com/typescript-eslint/typescript-eslint/pull/8173#discussion_r1445179350)
- ["That means we can bail out of the loop early as soon as a match is found."](https://github.com/typescript-eslint/typescript-eslint/pull/6096#discussion_r1032949483)
- ["`forEachChild` bails out when a truthy value is returned."](https://github.com/flint-fyi/flint/pull/2828#discussion_r3320679004)
- ["That way the loop doesn't have to _always_ go through the length of the array."](https://github.com/typescript-eslint/typescript-eslint/pull/6096#discussion_r1038807822)

## Hoist invariant work out of per-node visitors

*7 comments*

**Check:** Look for `new RegExp`, constant arrays, closures, and option normalization inside visitors or nested functions. Static values go at module scope; values derived from options go at the root of `create()`, normalized once.

**Why:** Work repeated per node or per dependency multiplies; a config with many patterns creates many regexes for no reason.

**Verify:** Confirm the value depends on nothing narrower than the options, then move it.

**From your reviews:**

- ["This re-runs the `new RegExp` on each `switch` statement."](https://github.com/typescript-eslint/typescript-eslint/pull/10218#discussion_r1854542175)
- ["any particular reason to put this inside the `ExportNamedDeclaration` function? It could go above the `return` to only have to be called once."](https://github.com/typescript-eslint/typescript-eslint/pull/3936#discussion_r730317031)
- ["There's no need for these to be re-created inside the `create(context) {` function each time."](https://github.com/michaelfaith/eslint-plugin-package-json/pull/741#discussion_r1921551713)
- ["Maybe it'd make sense to generate this list within the rule, so a bunch of truthiness checks don't need to happen each time a template expression is looked at?"](https://github.com/typescript-eslint/typescript-eslint/pull/8389#discussion_r1500168708)
