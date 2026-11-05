# Docs

## Ship and update docs with every rule, option, and behavior change

*25 comments · automatable*

**Check:** Every new rule needs its docs page and every new option, selector, or setting needs docs and tests. In Flint that means the `.mdx` file plus comparisons data. Usage should be clear from examples.

**Why:** Docs and option tests are necessities, not extras, and a PR isn't reviewable in depth without them.

**Verify:** List options in the rule's schema and confirm each has a docs entry and at least one test.

**From your reviews:**

- ["Just requesting changes to get it documented too. Every selector option should be."](https://github.com/typescript-eslint/typescript-eslint/pull/8084#pullrequestreview-1804645598)
- ["The explanation is no longer accurate now that they're also considered by the rule."](https://github.com/typescript-eslint/typescript-eslint/pull/7686#discussion_r1333033708)
- ["We'll want to also document this on `strict-boolean-expressions.md`."](https://github.com/typescript-eslint/typescript-eslint/pull/6096#discussion_r1032950264)
- ["This rule looks great, but it's missing a corresponding `.mdx` file."](https://github.com/flint-fyi/flint/pull/2301#discussion_r2788985363)

## Document every option: why it exists, its values, and paired examples

*24 comments · automatable · any, typescript-eslint*

**Check:** Every new option or newly supported syntax should have its own section showing how to configure it plus incorrect and correct code tabs for that configuration.

**Why:** Examples let users see exactly how the code looks. Text and tables alone make it hard to conceptualize what a rule does, and sub-headings without examples don't let readers actually understand the option.

**Verify:** For each key in the rule's schema, confirm the docs have a matching heading followed by a tabbed or fenced example using that option.

**From your reviews:**

- ["Could you add some examples please? We generally try to -at least for newly added rule options- so users can see exactly how the code looks."](https://github.com/typescript-eslint/typescript-eslint/pull/6487#discussion_r1254598357)
- ["The options mentions in this page don't explain why any of the options exist."](https://github.com/typescript-eslint/typescript-eslint/pull/11075#discussion_r2071978658)
- ["And the type is complex enough that I'd bet most readers aren't deeply reading it."](https://github.com/typescript-eslint/typescript-eslint/pull/12109#discussion_r2970486766)
- ["Many of our rule files intentionally have symmetry between the correct and incorrect examples in the docs."](https://github.com/typescript-eslint/typescript-eslint/pull/7957#discussion_r1398735706)

## Give When Not To Use It a concrete scenario, and targeted disables first

*20 comments*

**Check:** Read the When Not To Use It section. It should name a specific situation where the rule is the wrong fit and why, not restate the rule as 'if you don't want X, disable this rule' or a vague 'specific use case'.

**Why:** A section that only restates the rule's messaging adds no new information. Readers need to know why someone wouldn't want the behavior, for example side-effectful `.filter`s or apps never shipped to production users.

**Verify:** Delete the rule's name and behavior from each sentence. If nothing remains but 'you can disable this', ask for a named scenario such as an existing codebase style or a legacy runtime.

**From your reviews:**

- ["Can you elaborate on _why_ someone wouldn't want _X_?"](https://github.com/typescript-eslint/typescript-eslint/pull/8509#discussion_r1500647147)
- ["You might consider using [Flint disable comments](/directives) and/or [configuration file disables](/configuration#files) for those specific situations instead of completely disabling this rule."](https://github.com/flint-fyi/flint/pull/2169#discussion_r2738691903)
- ["This just restates the rule's messaging, but very broadly."](https://github.com/flint-fyi/flint/pull/348#discussion_r2395826635)
- ["you might consider using [ESLint disable comments](https://eslint.org/docs/latest/use/configure/rules#using-configuration-comments-1) and/or the [`allow` option](#allow) instead of completely disabling this rule."](https://github.com/typescript-eslint/typescript-eslint/pull/8509#discussion_r1741299381)

## Avoid prescriptive tone, absolutes, and words implying ease

*20 comments · automatable*

**Check:** Flag wording that commands or grants permission: 'is not allowed', 'should not be used', 'should be sorted', 'you may disable', 'this rule prevents'. Prefer 'Prefer X', 'can cause unexpected behavior', 'generally', 'this rule reports on'.

**Why:** Some folks chafe at stern language, and it can read as 'we're letting you'. Rules only report on violations, and some users mistakenly think rules can't be configured or overridden.

**Verify:** Try to write one counterexample for each absolute statement, such as a getter with a side effect for 'side-effect-free'.

**From your reviews:**

- ["_"is not allowed"_ is a bit too prescriptive."](https://github.com/typescript-eslint/typescript-eslint/pull/8509#discussion_r1513232386)
- ["A lot of new-to-TypeScript folks get confused by the misconception that TypeScript "guarantees" anything. It's good to use words that are a little less absolute."](https://github.com/typescript-eslint/typescript-eslint/pull/8011#discussion_r1438370892)
- ["It's also good not to use adjectives like "obviously" or "simply". They imply tasks are obvious or simple, but for new folks that often isn't the case."](https://github.com/typescript-eslint/typescript-eslint/pull/7539#discussion_r1417867355)
- ["Rule report messages should not be prescriptive "don't X". Instead, lean towards "do X"."](https://github.com/flint-fyi/flint/pull/364#discussion_r2410687388)

## State exactly what the rule covers, and keep the page to that rule

*14 comments*

**Check:** Compare the description, opening text, and When Not To Use It with the implementation. Flag text narrower than the rule (mentions only casing or functions), broader than it, tied to one coincidental case (branded types), or suggesting the opposite of what it does.

**Why:** Docs that no longer match mislead users. Accidental implications, like a rule being useful only with certain other rules, cause readers to miss its value.

**Verify:** List every node kind and type the rule matches, then check each appears in the docs and nothing else does.

**From your reviews:**

- ["It validates more than casing, no? Like, if the file doesn't exist at all, this will catch that, right?"](https://github.com/michaelfaith/eslint-plugin-package-json/pull/11#discussion_r1326239081)
- ["Nit: not relevant to this rule. We've got a separate one that'll handle that."](https://github.com/flint-fyi/flint/pull/2169#discussion_r2738690346)
- ["[Feature] It's not just functions though. It could also be, say, variables:"](https://github.com/typescript-eslint/typescript-eslint/pull/8443#discussion_r1500708617)
- ["This is good information, but is general knowledge for TypeScript -- not specific to us."](https://github.com/typescript-eslint/typescript-eslint/pull/5848#discussion_r998882860)

## Keep snippets clean, few, and free of distractions

*14 comments*

**Check:** Example code should compile cleanly apart from the reported problem: no `noImplicitAny` violations, no `any`, no initializer-less `const` (use `declare`), no types that collapse to `never`. Remove things that raise questions, such as unused parameters, variables named after primitives, or unrelated syntax that looks reported.

**Why:** Readers wonder 'why is this here?'. Distracting details make it unclear which part the rule flags, and unsafe or broken samples set a bad example even when the detail doesn't matter.

**Verify:** Paste each snippet into the playground with `strict` on. The only diagnostics should come from the rule under discussion.

**From your reviews:**

- ["Here and in the other code snippet, let's go with no `noImplicitAny` violations:"](https://github.com/flint-fyi/flint/pull/348#discussion_r2395820485)
- ["There are a _lot_ of lines of examples here."](https://github.com/typescript-eslint/typescript-eslint/pull/8011#discussion_r1416204875)
- ["Unused parameters tend to confuse some readers _("why is this here?")_."](https://github.com/typescript-eslint/typescript-eslint/pull/12218#discussion_r3070195450)
- ["This is a solid deep dive, but I think it's a little too deep for the docs."](https://github.com/typescript-eslint/typescript-eslint/pull/9707#discussion_r2175835891)

## Link authoritative external docs under Further Reading

*14 comments · automatable · any, flint*

**Check:** When a rule targets a language or platform feature with confusing behavior, or an option exists because of a long discussion, check the docs link to MDN, the TS Handbook, the relevant spec page, or the issue comment that explains it. Link the final resource directly, not a comment that points to it.

**Why:** Sparse explanations aren't useful, and confusing behaviors deserve a link to the main docs. Without the issue context most folks won't know why they'd want an option.

**Verify:** Check each Further Reading link: no eslint.org, stylelint, or other linter URLs, and the list is sorted by link text.

**From your reviews:**

- ["JS `delete` behaviors are confusing enough that linking to the main docs would be good IMO."](https://github.com/typescript-eslint/typescript-eslint/pull/5852#discussion_r1265779842)
- ["No, further reading is for external docs, not linters."](https://github.com/flint-fyi/flint/pull/375#discussion_r2413780070)
- ["This explanation is pretty sparse. We've been trying to flesh out our docs to be more useful. How about linking to the TypeScript docs?"](https://github.com/typescript-eslint/typescript-eslint/pull/8903#discussion_r1659830206)
- ["This is already covered by `RuleEquivalents`."](https://github.com/flint-fyi/flint/pull/2746#discussion_r3181698120)

## Define or replace jargon readers won't know

*11 comments*

**Check:** Find terms a typical user of the rule may not know: type-system concepts (type predicates, phantom types, contextual types, constituents), compiler options, spec terms, and uncommon English. Each should be defined briefly, linked, or replaced with plainer words, in docs and messages.

**Why:** If a maintainer doesn't know the term, neither will many readers. A quick definition and link to further reading is sufficient, and uncommon words make docs harder to read.

**Verify:** Ask whether someone who has never touched the type-checking APIs could explain each noun in the first paragraph and the message text.

**From your reviews:**

- ["I don't know what phantom types are, and neither will many readers of this. This should either define it or be omitted."](https://github.com/typescript-eslint/typescript-eslint/pull/8173#discussion_r1477517286)
- ["A lot of developers don't know what type predicates are. Could you add a line or two explaining them please?"](https://github.com/typescript-eslint/typescript-eslint/pull/6742#discussion_r1155321280)
- ["The words "obfuscate" and "superfluous" aren't commonly used even in programming."](https://github.com/typescript-eslint/typescript-eslint/pull/7539#discussion_r1417882162)
- ["I think most users won't understand what _"contextual"_  means."](https://github.com/typescript-eslint/typescript-eslint/pull/10067#discussion_r1796045775)

## Match sibling rules' format and the project's description wording

*11 comments*

**Check:** Compare headings, tab labels, list styling, and standard sentences with recently updated sibling pages and reuse them, but check any copied text is actually relevant to this rule.

**Why:** Standardized headings and phrasing keep pages consistent and familiar. Copied boilerplate that doesn't fit is its own problem.

**Verify:** Diff the page's heading outline against a sibling rule's page.

**From your reviews:**

- ["Just to align formatting with other rules..."](https://github.com/michaelfaith/eslint-plugin-package-json/pull/1077#discussion_r2135741185)
- ["Keep a normal rule description as before, and only use this _"did you mean?"_-centered wording in rule reports."](https://github.com/flint-fyi/flint/pull/370#discussion_r2413653614)
- ["We've standardized the tabs a bit:"](https://github.com/typescript-eslint/typescript-eslint/pull/10137#discussion_r1827892056)
- ["Nit: other rules do this, maybe good to do it here?"](https://github.com/typescript-eslint/typescript-eslint/pull/8383#discussion_r1483222594)

## Link TODOs, workarounds, and disables to an issue

*10 comments · automatable*

**Check:** Any `TODO`, known limitation, `eslint-disable`, or workaround for an upstream bug should reference a tracking issue, filed if needed.

**Why:** It's easy to lose track of these things, and filing gives a link to a full discussion and helps drive to a fix, so the disable is no longer necessary.

**Verify:** Grep the diff for `TODO`, `eslint-disable`, and `@ts-expect-error`, and confirm each has an issue link.

**From your reviews:**

- ["Could you file an issue to support spread arguments, and link it in the code comment please? It's easy to lose track of these things"](https://github.com/typescript-eslint/typescript-eslint/pull/5731#discussion_r986383214)
- ["Approximately every other comment has the same format, no need to diverge here. + having the link to the issue helps cross-link."](https://github.com/flint-fyi/flint/pull/2169#discussion_r2743566352)
- ["We generally like filing issues when a bug is found, both to get a link to a full discussion & to help drive to fixing it."](https://github.com/typescript-eslint/typescript-eslint/pull/5453#discussion_r941918341)
- ["So this gets picked up in searches for todos..."](https://github.com/typescript-eslint/typescript-eslint/pull/8821#discussion_r1564645596)

## Backtick code terms everywhere

*9 comments · automatable*

**Check:** Identifiers, keywords, option names, and type names like `void` or `Array<string>` should be in backticks in prose, list items, table cells, option headings, and metadata descriptions.

**Why:** Unformatted terms lose syntax highlighting and can render wrongly, and unbackticked option headings can even fail the website build.

**Verify:** Build the docs and check option headings. Search prose for bare keywords the rule is about.

**From your reviews:**

- ["The last item shows up as _"Array - to specify ..."_ in GitHub's rendered pages. Best to backtick."](https://github.com/michaelfaith/eslint-plugin-package-json/pull/55#discussion_r1362317982)
- ["The website build is failing because these should be backticked:"](https://github.com/typescript-eslint/typescript-eslint/pull/10218#discussion_r1874501034)
- ["Adding a touch of syntax highlighting, and also being explicit that void Promises are supported:"](https://github.com/typescript-eslint/typescript-eslint/pull/8289#discussion_r1477131517)
- ["Since this is a code thing, maybe?"](https://github.com/typescript-eslint/typescript-eslint/pull/9364#discussion_r1680020934)

## Use the precise term, consistently

*8 comments*

**Check:** Check that docs, option text, and messages use the correct technical term and the same one throughout: constituents not members, function not `Function`, `string` not `String`, array values not array types.

**Why:** Technical terms carry specific meanings: 'members' typically refers to class or object members, and `Function` is a specific built-in type devs are trained to avoid. Docs should be consistent with how they phrase it.

**From your reviews:**

- [""Members" typically refers to class/object members. The technical term here is _constituents_, I think."](https://github.com/typescript-eslint/typescript-eslint/pull/5728#discussion_r985670827)
- ["`Function` is a specific built-in type that TS devs are generally trained to avoid. _"function"_ the term refers to functions."](https://github.com/typescript-eslint/typescript-eslint/pull/8509#discussion_r1528436298)
- ["Here and elsewhere in the file - we should be consistent with how we phrase it."](https://github.com/typescript-eslint/typescript-eslint/pull/5728#discussion_r1027304702)

## Lead with essentials and move niche detail down

*8 comments*

**Check:** The top of the page should have the pertinent info and plain-text explanation. Details affecting few users, granular options, exhaustive lists, and internal implementation belong in the relevant option section or nowhere.

**Why:** A lot of seemingly-required reading for a limitation most projects won't hit bogs down the page. Most users don't care how equivalence is determined internally, and a code block above the fold is a tl;dr for many.

**From your reviews:**

- ["This is a lot of seemingly-required reading for a limitation that most projects won't hit."](https://github.com/typescript-eslint/typescript-eslint/pull/8765#discussion_r1623455384)
- ["I don't think there's a need to mention granular, specific options in the high-level overview."](https://github.com/typescript-eslint/typescript-eslint/pull/10218#discussion_r1854407520)
- ["I don't think most users really care about how we determine the equivalency internally."](https://github.com/typescript-eslint/typescript-eslint/pull/5728#discussion_r1083517108)
- ["That way we get the pertinent info first, then the explanation later."](https://github.com/typescript-eslint/typescript-eslint/pull/8821#discussion_r1564649189)

## Prefer short sentences, one per line

*8 comments · automatable*

**Check:** Break long multi-clause sentences apart, give separate points their own paragraphs, and cut explanations that run on.

**Why:** Simplifying makes each sentence readable on its own, which matters for rules using unfamiliar terminology. Short and sweet docs keep people from tiring out of reading them.

**Verify:** Run the sentences-per-line markdownlint rule, or grep docs for lines containing a period followed by a space and a capital letter.

**From your reviews:**

- ["Smaller sentences are easier for folks to understand."](https://github.com/typescript-eslint/typescript-eslint/pull/12317#discussion_r3487766213)
- ["We'll lint for this eventually, but I personally like keeping to one sentence per line"](https://github.com/typescript-eslint/typescript-eslint/pull/8216#discussion_r1446557754)
- ["It makes each sentence more readable on its own - which is especially important for rules that use terminology & concepts that might be unfamiliar to many readers."](https://github.com/typescript-eslint/typescript-eslint/pull/5728#discussion_r1146325004)
- ["Smaller sentences for more understandability (my editors would be pleased to see this):"](https://github.com/typescript-eslint/typescript-eslint/pull/6394#discussion_r1092398546)

## Explain what the construct is and why it's a problem

*6 comments*

**Check:** The opening of the page should say in plain text what is being reported and why it causes trouble before showing examples. Check it covers the actual mechanism, not just 'this rule disallows X' or a reference to 'unsafe assumptions'.

**Why:** A statement that never explains why one form is preferred confuses readers, and someone who doesn't already know the concepts could easily misinterpret it, for instance as saying all type assertions are unsafe.

**Verify:** Read only the first paragraph and answer: what does the rule flag, and what goes wrong if it's ignored?

**From your reviews:**

- ["This explanation confused me at first because it never explains _why_ one should be preferred."](https://github.com/michaelfaith/eslint-plugin-package-json/pull/11#discussion_r1323860982)
- ["I think we'll want to explicitly call out what the things are in plain text, before getting to the explanation of why we don't want them -> examples of them."](https://github.com/typescript-eslint/typescript-eslint/pull/10182#discussion_r2072000649)
- ["Someone reading this who isn't already familiar with the concepts wouldn't likely understand what it means."](https://github.com/typescript-eslint/typescript-eslint/pull/10051#discussion_r1835739165)
- ["this never actually mentions union types."](https://github.com/typescript-eslint/typescript-eslint/pull/10464#discussion_r1885114433)

## Don't repeat auto-generated docs content

*6 comments · typescript-eslint*

**Check:** Remove hand-written text that tooling already renders: option types and defaults, 'Options: None', and sentences repeating the schema description under `insert option description`. If the default can't flow through `defaultOptions`, state it manually.

**Why:** Our tooling will auto-generate this. Duplicates roughly repeat the option description, and option defaults are automatically stated, so hand-written copies add reading and can drift.

**Verify:** Build the docs site locally and read the rendered page for sentences that appear twice.

**From your reviews:**

- ["Our tooling will auto-generate this ✨"](https://github.com/typescript-eslint/typescript-eslint/pull/8173#discussion_r1477510504)
- ["I don't think this is necessary, given that `defaultCaseCommentPattern` already documents itself and automatically mentions its default value."](https://github.com/typescript-eslint/typescript-eslint/pull/10218#discussion_r1854533641)
- ["We know it's a `boolean` with a default value of `false` from the auto-generated code block earlier in the file."](https://github.com/typescript-eslint/typescript-eslint/pull/8334#discussion_r1477075163)
- ["not being able to use `defaultOptions` means the default isn't being put into docs."](https://github.com/typescript-eslint/typescript-eslint/pull/10218#discussion_r1874506908)

## Call out surprising limitations and fallbacks

*5 comments*

**Check:** List what users could reasonably assume but isn't so: unchecked signatures, what counts as a match, implied inclusions, option fallbacks, formats that are allowed. Check each is stated explicitly on the page.

**Why:** Limitations are surprising if you don't have a good familiarity with the type checking APIs, and unstated behavior leaves long-standing potential confusion.

**Verify:** Write a test for each stated edge case. Anything that needed a design discussion in the PR should appear in the docs too.

**From your reviews:**

- ["It's a surprising limitation if you don't have a good familiarity with the type checking APIs."](https://github.com/typescript-eslint/typescript-eslint/pull/8765#discussion_r1576881541)
- ["I think that should be explicitly called out as allowed in the docs & also tested for."](https://github.com/michaelfaith/eslint-plugin-package-json/pull/1344#discussion_r2482266734)
- ["This should mention that the option falls back to the value for `allowAliases`."](https://github.com/typescript-eslint/typescript-eslint/pull/5097#discussion_r888058472)
- ["Proposal: can we mention this in the docs here, to fix this long-standing potential confusion?"](https://github.com/eslint/eslint/pull/19562#discussion_r2035122960)

## Write descriptive link text

*5 comments · automatable*

**Check:** Links should describe their target in the link text itself. Flag '[Docs]', '[documentation]', '[this comment]', and '[here]'.

**Why:** Informative link titles make it easier to navigate the page with a screenreader. Folks who navigate through page links should be able to glean context from just the link text alone.

**Verify:** grep for markdown links whose text is only 'docs', 'documentation', 'here', 'this comment', or 'this issue'.

**From your reviews:**

- ["Informative link titles makes it easier to navigate through the page with a screenreader."](https://github.com/typescript-eslint/typescript-eslint/pull/6411#discussion_r1133456466)
- ["Accessibility fix: folks who navigate through page links should be able to glean context from just the link text alone."](https://github.com/typescript-eslint/typescript-eslint/pull/5050#discussion_r1014897927)
- ["The link text should describe what it is, so it's clear without context from the surrounding text."](https://github.com/typescript-eslint/typescript-eslint/pull/8383#discussion_r1483236619)
- ["Fun fact, having a link with an ambiguous name like just _"documentation"_ isn't great accessibility practice."](https://github.com/typescript-eslint/typescript-eslint/pull/5050#discussion_r928279917)

## Use lists and tables for parallel information

*5 comments*

**Check:** Where a paragraph enumerates formats, values, or differences between two tools, reformat as a list, comparison table, tabs, or fenced config block.

**Why:** Points in one paragraph hurt readability, and users want a quick comparison. Long inline config is a lot for a single line.

**From your reviews:**

- ["I'd expect users will want to be able to see a quick comparison chart. How about reformatting as a table?"](https://github.com/typescript-eslint/typescript-eslint/pull/8335#discussion_r1477124910)
- ["Putting these points all together in a paragraph hurts readability. I'd recommend switching to a list:"](https://github.com/typescript-eslint/typescript-eslint/pull/4436#discussion_r1092479121)
- ["This is a lot of POJO for a single line. How about ..."](https://github.com/typescript-eslint/typescript-eslint/pull/4436#discussion_r1092497730)
- ["Docs nit: I think you could streamline this explanation with tabs."](https://github.com/typescript-eslint/typescript-eslint/pull/5050#discussion_r1015926388)

## Document only the delta on extension rules

*5 comments · typescript-eslint*

**Check:** For a rule extending a base rule, keep the page to what it adds: what's newly supported, with examples for that syntax. Don't re-explain base behavior or claim base options as added.

**Why:** When the base rule's docs are filled out, only a few examples showing the basics and what the new rule adds are needed. Base-rule options technically aren't added.

**Verify:** Compare the option list and examples to the base rule's docs and remove anything already there.

**From your reviews:**

- ["This technically isn't _added_, it's already there from the base rule."](https://github.com/typescript-eslint/typescript-eslint/pull/10392#discussion_r1866057333)
- ["Just a few examples showing the basics of the new rule and what it adds."](https://github.com/typescript-eslint/typescript-eslint/pull/8011#discussion_r1416204875)
- ["Could you add examples for the newly supported syntax forms?"](https://github.com/typescript-eslint/typescript-eslint/pull/4184#discussion_r771869007)
- ["Could you add ❌ Incorrect and ✅ Correct examples for this, please?"](https://github.com/typescript-eslint/typescript-eslint/pull/10265#discussion_r1828013119)

## Strip LLM writing habits from rule docs

*4 comments*

**Check:** In AI-assisted PRs, look for catch-all reasons like 'backwards compatibility', bold labels on list items, sentences praising the language feature, and one-line narration comments.

**Why:** 'Backwards compatibility' is the catch-all reason LLMs tend to give, and it's debatably incorrect or imprecise. Readers don't need words extolling a feature.

**From your reviews:**

- [""backwards compatibility" is the catch-all reason LLMs tend to give for these docs."](https://github.com/flint-fyi/flint/pull/2591#discussion_r3150869197)
- ["I don't think these list items need to be bold/emphasized; I've been switching the AI-authored docs to not be."](https://github.com/flint-fyi/flint/pull/2169#discussion_r2738689224)
- ["I've removed almost all of the ones AI wrote for me."](https://github.com/flint-fyi/flint/pull/1758#discussion_r2698433157)
- ["We don't need to expend words extolling the JS feature - folks can have their own opinions on it."](https://github.com/typescript-eslint/typescript-eslint/pull/8509#discussion_r1741292565)

## Keep the old name findable after a rename

*4 comments*

**Check:** A renamed rule should keep a tombstone page at the old path and a migration notice on the new page naming the old rule. Any deprecation notice should state the rename and removal first, then explain.

**Why:** Folks might get confused about the rename, and having the old rule named helps people searching for the old name.

**Verify:** Check the old docs URL still resolves and that the new page contains the old rule's name.

**From your reviews:**

- ["Having the old rule named here will help with folks searching the old name."](https://github.com/typescript-eslint/typescript-eslint/pull/9207#discussion_r1623412308)
- ["Could you keep a "tombstone" page for the old rule?"](https://github.com/typescript-eslint/typescript-eslint/pull/9207#discussion_r1623412637)
- ["Maybe mention somewhere in here that it used to be called `no-useless-template-literals`?"](https://github.com/typescript-eslint/typescript-eslint/pull/8821#discussion_r1564649893)

## Omit the bare-string type specifier form

*4 comments · automatable · typescript-eslint*

**Check:** For options that take `TypeOrValueSpecifier`, link the shared format page instead of re-describing it, and don't mention the plain string form.

**Why:** Catch-all names tend to be overly permissive: the simple string format allows any coincidentally equal name to match, so the team deliberately doesn't encourage it.

**Verify:** grep the page for 'simple string' or 'independently of its origin'.

**From your reviews:**

- ["The simple string format is evil 👿. It allows any coincidentally equal name to match."](https://github.com/typescript-eslint/typescript-eslint/pull/8556#discussion_r1667480597)
- ["catch-all names tend to be overly permissive."](https://github.com/typescript-eslint/typescript-eslint/pull/8502#discussion_r1541768874)
- ["for now, I really don't want to encourage people to do this."](https://github.com/typescript-eslint/typescript-eslint/pull/9186#discussion_r1622584998)
- ["We have a thing for this now that #9875 is merged ✨ "](https://github.com/typescript-eslint/typescript-eslint/pull/8509#discussion_r1741293171)

## Label new or experimental rules on the page

*3 comments*

**Check:** If a rule is experimental or puts forward a new opinion, consider a notice on its docs page saying it may change and asking for feedback, and keep it out of strict presets until proven.

**Why:** Rules the team hasn't tried before can change significantly. Users should know an opinion is new so they can try it out and report back.

**From your reviews:**

- ["Maybe we should put some kind of "nursery" notice on this page?"](https://github.com/flint-fyi/flint/pull/1758#discussion_r2696573802)
- ["it's still somewhat experimental / something-we-haven't-tried-ourselves-before."](https://github.com/typescript-eslint/typescript-eslint/pull/8173#discussion_r1654880002)
- ["We don't really have a process for declaring rules as "canary" or "experimental"."](https://github.com/typescript-eslint/typescript-eslint/pull/9707#discussion_r1741336663)

## Use JSDoc for overviews without restating types

*3 comments · automatable*

**Check:** A comment that summarizes a whole function belongs in a `/** ... */` block on that function, not in `//` lines. JSDoc should not repeat types with tags like `@returns {Boolean}`.

**Why:** A JSDoc comment works as a good top-level overview, and TypeScript types already describe the types.

**Verify:** grep -nE '@(param|returns) \{' on the changed files.

**From your reviews:**

- ["We have TypeScript types, no need to describe them explicitly in comments."](https://github.com/typescript-eslint/typescript-eslint/pull/5965#discussion_r1022868727)
- ["any reason not to use `/** ... */` here?"](https://github.com/typescript-eslint/typescript-eslint/pull/8173#discussion_r1477525916)
- ["Can you move this one to a JSDoc comment on the function? It feels useful as a good top-level overview."](https://github.com/typescript-eslint/typescript-eslint/pull/8383#discussion_r1483258336)
