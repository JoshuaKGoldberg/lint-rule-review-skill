# Fixers and suggestions

## Autofix only what keeps behavior and types; otherwise use a suggestion

*21 comments*

**Check:** For each `fix`, ask whether it changes runtime behavior or the resulting types. If so it must be a suggestion; if it changes neither, a suggestion should be promoted to a `fix`.

**Why:** Anything that can break the build goes in suggestions. A change might be objectively better and still not be what a fixer is meant to do. Not changing code or types is roughly the only dividing line.

**Verify:** Apply the fixer to a typed sample and compare. `arr[arr.length - 1]` -> `arr.at(-1)` turns `T` into `T | undefined`, and `delete arr[i]` -> `arr.splice(i, 1)` changes behavior, so both tests need `output: null` plus `suggestions`.

**From your reviews:**

- ["We generally put anything that can break the build into _suggestions_ fixers rather than direct _fix_ fixers."](https://github.com/typescript-eslint/typescript-eslint/pull/6411#discussion_r1267190056)
- ["the fixers would need to be suggestions given they change code behavior"](https://github.com/typescript-eslint/typescript-eslint/pull/9707#pullrequestreview-2276237784)
- ["`eslint --fix` isn't supposed to meaningfully change the runtime of code."](https://github.com/typescript-eslint/typescript-eslint/pull/5852#discussion_r1111175050)
- ["Starting a new thread: let's make sure the existing behavior is preserved?"](https://github.com/typescript-eslint/typescript-eslint/pull/5097#pullrequestreview-1048663086)

## Keep fixes small and comments intact

*12 comments*

**Check:** Check that fixers replace the smallest range possible and don't drop or misplace comments inside that range. Fixes that rebuild whole nodes from text are the usual suspects.

**Why:** Comment handling is what makes autofixes brittle, and the reviewer repeatedly finds comment locations that break them. Existing comment handling must not regress; brand-new gaps can be a followup.

**Verify:** For each fix, add a test with `/* comment */` at every position inside the replaced range and assert it survives or that no fix is offered.

**From your reviews:**

- ["I regret not thinking more on comments earlier"](https://github.com/typescript-eslint/typescript-eslint/pull/10861#pullrequestreview-2710266709)
- ["It's hard to write comments handling code that's specific to types of comments & indentation. This very specific, which makes it brittle."](https://github.com/typescript-eslint/typescript-eslint/pull/10137#discussion_r1854400776)
- ["I think the autofixing/suggesting is still a little too brittle and can be reworked to better handle some comments."](https://github.com/typescript-eslint/typescript-eslint/pull/10137#pullrequestreview-2690853359)
- ["Comments around the `if` are removed"](https://github.com/typescript-eslint/typescript-eslint/pull/10137#discussion_r1827891304)

## Prove fix output is valid and keeps operator precedence

*8 comments*

**Check:** Run each fixer and suggestion against awkward inputs and read the output. It must still compile, keep everything the original declared, and survive precedence and neighboring elements. Compute fix positions from the original node list, not a filtered copy.

**Why:** A suggestion shouldn't suggest something that's a type error, and shouldn't silently delete what the code meant. Filtering elements before the fixer sees them makes it fix incorrectly around the removed ones.

**Verify:** Assert exact output for `{ "files": ["README.md", null, "./package.json"] }`: the commas must remain valid with the `null` in the middle (the author confirmed that placement is what fails). For `delete arr[i]` with `i: number | string`, assert no suggestion. For wrapped replacements, reuse the edge cases in `getWrappingFixer` tests.

**From your reviews:**

- ["The suggestion fixer shouldn't suggest something that's a type error - so I think it shouldn't suggest anything at all in this case."](https://github.com/typescript-eslint/typescript-eslint/pull/5852#discussion_r1265791007)
- ["Autofixers have a bad habit of changing PEMDAS accidentally."](https://github.com/typescript-eslint/typescript-eslint/pull/6641#discussion_r1141148693)
- ["this should also add the equivalent property to the class. Otherwise the suggestion is removing a property."](https://github.com/JoshuaKGoldberg/eslint-plugin-erasable-syntax-only/pull/14#discussion_r1957406276)
- ["I think this is a bug in the fixer right now. Before fixing, the code would delete element `1`; after, it passes `something(), 1` as two function arguments."](https://github.com/typescript-eslint/typescript-eslint/pull/5852#discussion_r1020980293)

## Ask whether each report can have a fixer or suggestion

*6 comments · any, flint*

**Check:** For each report without `fix` or `suggest`, ask whether a safe fix or suggestion would be straightforward, including on secondary message IDs.

**Why:** A fix is nice and convenient for users, and for many reports the replacement is straightforward.

**Verify:** Assert suggestion output in the rule's tests for every report that has a remedy.

**From your reviews:**

- ["This should have an auto-fixer. Add one."](https://github.com/flint-fyi/flint/pull/470#discussion_r2647153838)
- ["The original ESLint rule has an auto-fixer. And what is this "TODO" in suggestions??"](https://github.com/flint-fyi/flint/pull/962#discussion_r2481525462)
- ["Are you up for adding a suggestion changer? It should be relatively straightforward, I think."](https://github.com/flint-fyi/flint/pull/2591#discussion_r3150864985)
- ["Add two suggestion fixers: one to remove the preceding `0`, and one to switch to the explicit octal syntax"](https://github.com/flint-fyi/flint/pull/370#discussion_r2413586440)

## Make fixers edit only the tokens that change

*5 comments*

**Check:** Flag fixers that call `replaceText` on a whole parent node or rebuild it from strings, and fixers that move comments by hand. Prefer `fixer.remove`, `insertTextBefore`, or `replaceTextRange` on the smallest node or token.

**Why:** Replacing unchanged text trims comments and mangles formatting, and bigger fix ranges are more likely to overlap when there are multiple reports. If the fixer doesn't remove ranges containing comments, there's no need to manage comment locations.

**Verify:** Run the fixer on input with comments and unusual spacing between the nodes; both should survive in the output.

**From your reviews:**

- ["We generally try to avoid replacing text that isn't actually changed."](https://github.com/typescript-eslint/typescript-eslint/pull/5943#discussion_r1020943866)
- ["Bigger fix ranges are more likely to overlap if there are multiple reports"](https://github.com/typescript-eslint/typescript-eslint/pull/7691#discussion_r1353258446)
- ["Instead of doing a full replacement of the node, this should `fixer.remove` to remove any duplicate nodes."](https://github.com/typescript-eslint/typescript-eslint/pull/5728#discussion_r985667996)
- ["No need to manage comment locations if the fixer isn't removing ranges that include them."](https://github.com/typescript-eslint/typescript-eslint/pull/10137#discussion_r1998970941)

## Give suggestions their own specific message

*4 comments · automatable*

**Check:** Each suggestion needs a message ID that differs from its report, worded as a specific action. Reports say "Prefer", suggestions say "Use" or "Remove". Placeholders must never render empty, so use a second message ID when data can be missing.

**Why:** Editors surface suggestions under the error, so repeating the same text is confusing. An empty placeholder produces nonsense such as `Replace with "".`

**Verify:** Assert `messageId` on each entry in `suggestions` and confirm it differs from the error's. Add a case where optional data is absent and read the rendered text.

**From your reviews:**

- ["Suggestions should use a different message ID than the parent report. Editors surface them under the messages, so it'd be confusing to have it be the same as the visible error message."](https://github.com/typescript-eslint/typescript-eslint/pull/5852#discussion_r1264767397)
- ["This `""` means the suggestion message will show up like:"](https://github.com/flint-fyi/flint/pull/1457#discussion_r2684300683)
- ["_"Use"_ is an action verb, which we'd normally put in the suggestion message. _"Prefer"_ is what we tend to put for the actual rule error complaint."](https://github.com/typescript-eslint/typescript-eslint/pull/8216#discussion_r1471869796)
- ["This is specific to imports, so we should be more specific here I think."](https://github.com/typescript-eslint/typescript-eslint/pull/11243#discussion_r2486826380)

## Compute fix-only values inside the fix

*3 comments*

**Check:** Variables, node text, and suggestion objects used only by a fixer should be built inside `fix`, or inline in the `context.report` call, rather than ahead of it.

**Why:** Declaring them outside is confusing, and they don't need to be created until and unless they're needed.

**Verify:** Check that each variable above `context.report` is used by something other than `fix`.

**From your reviews:**

- ["Let's move any variables only used for fixing inside the `fix`."](https://github.com/michaelfaith/eslint-plugin-package-json/pull/741#discussion_r1921550629)
- ["These objects don't need to be created until & unless they're needed."](https://github.com/typescript-eslint/typescript-eslint/pull/11032#discussion_r2031609592)
- ["Even better, once the message no longer has node texts in it, the logic to retrieve them can move to inside the `fix` function."](https://github.com/typescript-eslint/typescript-eslint/pull/8067#discussion_r1428249321)
