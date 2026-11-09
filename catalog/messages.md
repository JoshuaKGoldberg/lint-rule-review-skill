# Report messages

## Make report messages say why the code is a problem

*23 comments*

**Check:** Flag messages that only say "avoid", "should not", or "forbidden". The primary message should state the concrete hazard or reason, such as what the code silently does.

**Why:** Telling developers something is dangerous makes them feel the rule is helping; telling them it's forbidden just makes them resent it. Don't just tell someone to avoid something, explain why.

**Verify:** Read each message alone and ask whether it answers why the code is bad.

**From past reviews:**

- ["Telling them something is _"forbidden"_ just makes them resent us."](https://github.com/typescript-eslint/typescript-eslint/pull/5852#discussion_r1111174875)
- ["I'm trying to overhaul rule messages to always give some sort of _why_ in the `primary` message."](https://github.com/flint-fyi/flint/pull/1758#discussion_r2698421646)
- ["`key` isn't deprecated, `b` is. TypeScript correctly reports `'b' is deprecated.` so the rule should too."](https://github.com/typescript-eslint/typescript-eslint/pull/11006#discussion_r2031145910)
- ["Don't just tell someone to avoid something, explain why."](https://github.com/flint-fyi/flint/pull/934#discussion_r2475463150)

## Keep message IDs static, accurate, and few, using data for variation

*15 comments · automatable*

**Check:** Report with `messageId`, not `message`, except when forwarding text from external tools. Don't build IDs with template strings; inject varying parts through `data`. Describe the construct in words rather than interpolating source text.

**Why:** Dynamic IDs are hard to statically analyze and eslint-plugin-eslint-plugin's rules choke on them. Users like predictable messages, and long nodes make them funky.

**Verify:** Search for `messageId:` with a template literal, `message:` in `context.report`, and `{{ }}` placeholders fed by `getText`.

**From past reviews:**

- ["Dynamically constructed `messageId`s are nifty, but hard to statically analyze."](https://github.com/typescript-eslint/typescript-eslint/pull/9707#discussion_r1741312355)
- ["For me, dynamic IDs are a hard blocker. All IDs should be statically constructed for readability - both for us humans and the tools around them."](https://github.com/typescript-eslint/typescript-eslint/pull/9707#discussion_r1967888208)
- ["We normally go for small clean message IDs. The practice of storing them in variables doesn't scale well to rules that have many messages."](https://github.com/typescript-eslint/typescript-eslint/pull/7089#discussion_r1257382643)
- ["Nit: "violation" is implied by the fact that it's a message."](https://github.com/typescript-eslint/typescript-eslint/pull/5852#discussion_r1020979884)

## Reuse the wording of sibling rules and messages

*5 comments*

**Check:** Compare new message text, `data` values, and punctuation with the closest existing rules or with other messages in the same rule, and match them.

**Why:** The reviewer repeatedly asks that related rules say the same thing the same way, for consistency across a family of rules.

**Verify:** Search the rules folder for the same phrase and diff the wording.

**From past reviews:**

- ["For consistency, let's stick with the same as others."](https://github.com/typescript-eslint/typescript-eslint/pull/9254#discussion_r1634297660)
- ["To be consistent with the other PR and other rules:"](https://github.com/flint-fyi/flint/pull/2189#discussion_r2743592543)
- ["Any reason not to do that here?"](https://github.com/typescript-eslint/typescript-eslint/pull/9291#discussion_r1632047535)
- ["Nit: to match the `tsDirectiveCommentRequiresDescription` comment..."](https://github.com/typescript-eslint/typescript-eslint/pull/5026#discussion_r878539716)

## Read the rendered message as an end user would

*4 comments*

**Check:** Expand every message with its real `data` values and read the sentence aloud. Look for jargon, awkward grammar from interpolation, and wording that suggests the wrong problem.

**Why:** End users often don't know internal terms like "Expressions of type", and phrasing can imply the wrong thing is duplicated or missing. A message that needs knowledge of the rule to parse fails its purpose.

**Verify:** Check the reported message in a test or playground with each interpolation value.

**From past reviews:**

- ["End users generally don't know well what `Expressions of type` means (even though it is more accurate)."](https://github.com/typescript-eslint/typescript-eslint/pull/4000#discussion_r728534372)
- ["It took me a few tries to parse out the English grammar in that sentence, and I had to rely on already knowing the rule & this PR."](https://github.com/typescript-eslint/typescript-eslint/pull/11704#discussion_r2487190098)
- ["this phrasing makes me think that the member is what's duplicated -- like having two members with the same keys."](https://github.com/typescript-eslint/typescript-eslint/pull/4833#discussion_r855609685)
- ["Some might point out that functions do have built-in properties."](https://github.com/typescript-eslint/typescript-eslint/pull/8509#discussion_r1513234010)

## Keep full serialized types out of messages

*3 comments*

**Check:** Flag messages or suggestions that interpolate `typeToString` output for inferred types, and rule-specific truncation logic to tame them. Refer to the type generally, or only use an explicitly written, simple type.

**Why:** Directly printing types makes messages very long when a type isn't straightforward, and most messages avoid types or refer only to small names.

**Verify:** Report on a function returning a large inferred object type and check the message length.

**From past reviews:**

- ["Directly putting `typeToString`-ified types into error messages makes them super long when the type isn't straightforward."](https://github.com/flint-fyi/flint/pull/161#discussion_r2206023771)
- ["Most of our error messages either don't mention types or only refer to small names such as identifiers."](https://github.com/typescript-eslint/typescript-eslint/pull/10051#discussion_r1795639908)
- ["We don't add rule-specific type name truncation logic"](https://github.com/typescript-eslint/typescript-eslint/pull/4864#discussion_r864154425)
