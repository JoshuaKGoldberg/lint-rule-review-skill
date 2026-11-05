# What earns praise

## Clear, concise rule docs and examples

*9 comments*

**Check:** Call out docs with clear sections and short examples, including ones that say what an extension rule adds and which related rule to pick to avoid double-reporting.

**Why:** Concise, explicit docs help readers. The reviewer has soured on extension docs that don't explicitly say what gets added.

**From your reviews:**

- ["Great example, really clear and concise."](https://github.com/typescript-eslint/typescript-eslint/pull/10010#discussion_r1765015711)
- ["I've started souring on extension docs that don't explicitly say what gets added."](https://github.com/typescript-eslint/typescript-eslint/pull/7709#discussion_r1349775064)
- ["These two added valid examples are very clear & helpful for explaining the rule IMO. 🔥"](https://github.com/typescript-eslint/typescript-eslint/pull/8173#discussion_r1477526063)
- ["This is very good documentation!"](https://github.com/flint-fyi/flint/pull/2759#discussion_r3202221147)

## Thorough tests where each case tests one thing

*8 comments*

**Check:** Call out test suites that thoroughly cover syntax variants and individual cases that test one clear thing, including tests for options and complex schemas.

**Why:** A perfect test tests one thing and is very clear. Coverage this thorough earns explicit credit.

**From your reviews:**

- ["This is a perfect test 😁 tests one thing and is very clear. I like it!"](https://github.com/typescript-eslint/typescript-eslint/pull/9167#discussion_r1623586805)
- ["Super thorough tests coverage for `a: number` variants, nicely done!"](https://github.com/typescript-eslint/typescript-eslint/pull/7525#discussion_r1313844332)
- ["Such thorough testing! Lovely. 👏 🔥"](https://github.com/typescript-eslint/typescript-eslint/pull/11533#discussion_r2401765766)

## Comments that explain non-obvious reasoning

*8 comments*

**Check:** Call out comments explaining why tricky logic exists, such as compiler quirks or what an AST term refers to. This is the exception to removing comments that restate code.

**Why:** Comments are usually trimmed, but rules dealing with a lot of tricky points benefit, and helpful comments make the code easier to read and review.

**From your reviews:**

- ["I normally requests folks use fewer comments, as they often just restate what's directly inferable from code. But this rule by nature deals with a lot of tricky points and I think the comments are very helpful here."](https://github.com/typescript-eslint/typescript-eslint/pull/9707#discussion_r2649257039)
- ["Lovely. Nice investigation and very helpful comment! 🙂"](https://github.com/typescript-eslint/typescript-eslint/pull/10006#discussion_r1771756512)
- ["This second line was very helpful for understanding the code :) great comment!"](https://github.com/typescript-eslint/typescript-eslint/pull/7092#discussion_r1264763411)

## Logic split into well-named helpers

*7 comments*

**Check:** When a rule separates logic into clearly named helpers, variables, or shared utils, say so specifically. This is the structure the reviewer most often singles out for praise.

**Why:** Good separation makes tricky logic readable and reviewable, even with many logic cases inherent to the feature.

**From your reviews:**

- ["You've done a wonderful job of separating out logic to helper functions that made it easier to read through and understand."](https://github.com/typescript-eslint/typescript-eslint/pull/10861#pullrequestreview-2691361883)
- ["I like the separation out into the clearly named variables."](https://github.com/typescript-eslint/typescript-eslint/pull/10550#pullrequestreview-2525809887)
- ["I appreciate the way you've layered the utils here, I think it's very nice and composable."](https://github.com/flint-fyi/flint/pull/2518#pullrequestreview-4048030885)
- ["I like the splitting out of the helpful functions."](https://github.com/typescript-eslint/typescript-eslint/pull/9167#pullrequestreview-2092310179)

## Rule code that is easy to read through

*6 comments*

**Check:** Call out files whose `create()` reads clearly, logic split into well-named functions, and enums or helpers that make new logic understandable.

**Why:** Clear code makes the reviewer's life easier and is a real pleasure to review.

**From your reviews:**

- ["This file was _really_ clear to read through. Especially the contents of the `create()` function. A real pleasure to review."](https://github.com/typescript-eslint/typescript-eslint/pull/8509#discussion_r1741299526)
- ["I like how you split this up into functions 🙂 much easier to read through the main logic flow than keeping it all inline would be."](https://github.com/typescript-eslint/typescript-eslint/pull/7539#discussion_r1417918341)
- ["This was very clear to read through, nice! Thanks for making my life easier 😄"](https://github.com/typescript-eslint/typescript-eslint/pull/8094#discussion_r1449165213)

## Changes that remove code and logic

*6 comments*

**Check:** Call out diffs that reduce logic, delete code, or clean up tests while keeping behavior.

**Why:** The reviewer enjoys seeing how much code is removed and how much cleaner a file becomes.

**From your reviews:**

- ["I like how much code is getting removed here!"](https://github.com/typescript-eslint/typescript-eslint/pull/11760#discussion_r2538157422)
- ["this reduction in logic is quite nice..."](https://github.com/flint-fyi/flint/pull/2294#discussion_r2788996731)
- ["This is so much cleaner now!! 👏 🔥"](https://github.com/flint-fyi/flint/pull/2828#discussion_r3367933846)

## Tricky syntax handled that the reviewer might have missed

*5 comments*

**Check:** Call out rules and fixers that account for easily forgotten syntax such as sequence expressions and parentheses, and test cases that surface an interesting edge.

**Why:** These are the cases the reviewer says they would have forgotten, so handling them shows real care for rule correctness.

**Verify:** Add test cases with parenthesized expressions and sequence expressions to confirm a fixer's output is still valid.

**From your reviews:**

- ["Nice 😄 I probably would have forgotten about sequence expressions..."](https://github.com/typescript-eslint/typescript-eslint/pull/8216#discussion_r1471897435)
- ["I personally would probably have forgotten to account for these parenthesis 😄 fair play!"](https://github.com/typescript-eslint/typescript-eslint/pull/8067#discussion_r1428245019)
- ["Lots of tricky stuff here, nice job handling them all! 👏"](https://github.com/typescript-eslint/typescript-eslint/pull/8383#discussion_r1483284284)

## Reuse of existing utilities and shared logic

*4 comments*

**Check:** Call out new code that reuses existing functions or extracts logic shared by two code paths.

**Why:** Reuse is called good craft by the reviewer.

**From your reviews:**

- ["Great reuse of the existing functions!"](https://github.com/typescript-eslint/typescript-eslint/pull/8673#discussion_r1722178223)
- ["I like how you extracted out the shared logic here 😄 good craft!"](https://github.com/typescript-eslint/typescript-eslint/pull/7541#discussion_r1326094840)
- ["I like the reusing of utilities 🙂 nice!"](https://github.com/typescript-eslint/typescript-eslint/pull/9330#discussion_r1653887610)
