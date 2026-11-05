# Rule design and scope

## Keep unrelated changes out of a rule PR

*27 comments*

**Check:** Look for lockfile churn, editor settings, whitespace rewrites, stray scripts, or shared-logic edits that the rule does not need. Ask for them to be reverted or split into their own PR.

**Why:** Unrelated changes make it harder to see what is changing, and big PRs are harder to review.

**Verify:** Read `git diff --stat` against the base branch and justify every file outside the rule, its tests, its docs, and its registration.

**From your reviews:**

- ["Lots of unexpected changes in this file - could you please revert them?"](https://github.com/michaelfaith/eslint-plugin-package-json/pull/786#discussion_r1932750358)
- ["We try to keep PRs single-purpose so it's easier to review them and easier to determine when bugs or fixes were introduced."](https://github.com/typescript-eslint/typescript-eslint/pull/4864#discussion_r864126706)
- ["It's harder to review PRs that have unnecessary whitespace changes - especially these larger, more intricate PRs."](https://github.com/typescript-eslint/typescript-eslint/pull/9119#discussion_r1653865833)
- ["Unrelated changes? You'll want to revert these."](https://github.com/typescript-eslint/typescript-eslint/pull/8304#discussion_r1623639864)

## State the semver impact of each behavior change

*20 comments · automatable · any, typescript-eslint*

**Check:** Classify the change: bugfix, feature, or breaking. New reports in a small-to-medium set of cases aren't breaking; changed defaults and removed options wait for a major. Make the PR title match.

**Why:** Pretty much any logical change to a lint rule could be seen as breaking, so the line has to be drawn deliberately. Type prefixes show up differently in the changelog and have different version bump implications.

**Verify:** Check `meta.docs.recommended` on a new rule against the target release. For deprecations, confirm the rule has left generated configs. Confirm each case requested in the issue is covered or has a test.

**From your reviews:**

- ["Pretty much any logical change to a lint rule could be seen as a "breaking" change."](https://github.com/typescript-eslint/typescript-eslint/pull/4582#issuecomment-1064036602)
- ["Unfortunately, adding to the _recommended_ rulesets is a breaking change. This'll have to be relegated to _strict_ until the next major version."](https://github.com/typescript-eslint/typescript-eslint/pull/7957#discussion_r1416263411)
- ["Adds additional checks to an existing rule that causes new reports in a small-to-medium set of cases in an average codebase"](https://github.com/typescript-eslint/typescript-eslint/pull/10106#issuecomment-2466809966)
- ["We don't want to be in the business of recommending deprecated rules!"](https://github.com/typescript-eslint/typescript-eslint/pull/8334#discussion_r1477076939)

## Place the rule in the right preset, staging big rules out first

*14 comments · possibly stale*

**Check:** Check the rule's recommended level or preset. Opinionated rules stay out of defaults, additions to `recommended` are breaking while `strict` may grow in minors, and Flint rules that need no type information belong in `untyped` rather than `logical`.

**Why:** Many folks would be irked by opinionated rules on by default, and changing the `recommended` rulesets is a breaking change.

**Verify:** Compare with the preset of the closest existing rule, for example `no-throw-literal` for promise rejection rules.

**From your reviews:**

- ["Making changes to the `recommended` or `recommended-requiring-type-checking` rulesets are breaking changes, but `strict` is fine to make any time."](https://github.com/typescript-eslint/typescript-eslint/pull/5852#discussion_r1020978400)
- ["I think a gradual rollout to let folks try it will make sense"](https://github.com/typescript-eslint/typescript-eslint/pull/9707#pullrequestreview-3614387000)
- ["This is a pretty opinionated rule. Many folks would be irked by having it turned on by default"](https://github.com/typescript-eslint/typescript-eslint/pull/5848#discussion_r998883476)
- ["we're going to give it a warning notice and leave it out of the `strict` preset for a bit."](https://github.com/typescript-eslint/typescript-eslint/pull/8173#pullrequestreview-2141930383)

## Widen the rule to everything its concept covers

*13 comments*

**Check:** Ask what else is the same problem as the case the PR handles. A rule on functions may need variables, classes, interfaces, type aliases, and namespaces; a rule on strings may need `number` and `bigint` literals.

**Why:** A narrow first draft reads clean but leaves functional gaps. Being more comprehensive in which types and constructs it accounts for avoids a slew of edge case bugs.

**Verify:** List every syntax or type form that can express the reported concept, and add a test for each.

**From your reviews:**

- ["I think it'll need to be expanded to at least variables. Really, anything that can refer to a type: classes, interfaces / type aliases, namespaces, ..."](https://github.com/typescript-eslint/typescript-eslint/pull/8443#pullrequestreview-1898185043)
- ["I think the only blocker (other than reverting unrelated changes) is also reporting on unnecessary non-string literals such as `bigint` and `number`."](https://github.com/typescript-eslint/typescript-eslint/pull/7957#pullrequestreview-1775966056)
- ["But in order to avoid a slew of edge case bugs, it'll need to be more comprehensive in which types it accounts for."](https://github.com/typescript-eslint/typescript-eslint/pull/8656#pullrequestreview-2018234302)
- ["I think the feature request is a lot trickier than the test cases here currently capture."](https://github.com/typescript-eslint/typescript-eslint/pull/10744#pullrequestreview-2691091579)

## Use the shared specifier format for type and value allowlists

*13 comments · any, typescript-eslint*

**Check:** If an option names types or values, use the shared `TypeOrValueSpecifier` format rather than a bespoke string list, and test all sources: file, lib, and package. Bare type-name allowlists are discouraged.

**Why:** A standard format lets rules specify type locations the same way, but it's widely used and tricky, so changes to it deserve extra review eyes.

**Verify:** Test the option with one specifier of each `from` source.

**From your reviews:**

- ["The more we use the shared _TypeOrValueSpecifier_ format the more review eyes we'll want on it."](https://github.com/typescript-eslint/typescript-eslint/pull/8556#pullrequestreview-2259338204)
- ["The actual value for `.allow` is the `typeOrValueSpecifiersSchema` value from type utils:"](https://github.com/typescript-eslint/typescript-eslint/pull/10221#discussion_r1821290627)
- ["The problem with an array of plain strings is that it's easy for users to accidentally use unrelated names that coincidentally match the strings."](https://github.com/eslint/eslint/pull/19913#discussion_r2192608593)
- ["Long term we may want to build off of this PR and set up a standard format for how rules can specify type locations..."](https://github.com/typescript-eslint/typescript-eslint/pull/4436#issuecomment-1019618486)

## Send out-of-scope expansions to followup issues

*10 comments*

**Check:** When a PR grows past its backing issue, or a discussion finds a new class of cases, split it out. Only regressions and in-scope gaps should block; adjacent feature support gets its own issue.

**Why:** Single-purpose PRs get improvements in sooner without being blocked by bigger discussions. Tricky logic is delicate to expand, so go with what's working and let folks file a follow-up.

**From your reviews:**

- ["Let's ignore interfaces in this PR altogether. Adding support for them in the rule would be a separate issue."](https://github.com/typescript-eslint/typescript-eslint/pull/9536#issuecomment-2296389878)
- ["IMO it'd be best to go with what's working now, and let folks file a follow-up if they really want."](https://github.com/typescript-eslint/typescript-eslint/pull/11918#issuecomment-4104566073)
- ["I think you've swayed me into thinking that that should be a separate followup issue."](https://github.com/typescript-eslint/typescript-eslint/pull/9536#issuecomment-2515528502)
- ["The other points aren't blocking IMO as we can file them as followup issues."](https://github.com/typescript-eslint/typescript-eslint/pull/8094#pullrequestreview-1816029751)

## Mirror the change across sibling rules and cases

*10 comments*

**Check:** Ask if the same fix applies to sibling rules, and if parallel cases in the same rule behave alike. If one case gets a fixer or check, the mirror case probably should too. Follow how the area already does it.

**Why:** It would be odd for users if only one of two equivalent cases gets a fixer. Existing conventions should hold unless there's a strong reason to deviate.

**Verify:** Search for rules in the same family and compare their handling of the changed case.

**From your reviews:**

- ["I also am thinking - should a similar fix be applied to the other `any*` rules?"](https://github.com/flint-fyi/flint/pull/2516#pullrequestreview-4030688887)
- ["I do think it would be odd for users if the other case didn't also get a fixer though."](https://github.com/eslint/eslint/pull/19952#pullrequestreview-3051663384)
- ["Try to stick with the existing conventions in code unless there's a strong reason to deviate"](https://github.com/typescript-eslint/typescript-eslint/pull/8282#pullrequestreview-1857025298)
- ["I like how the array and object checks are now mirrored."](https://github.com/typescript-eslint/typescript-eslint/pull/10565#pullrequestreview-2525830999)

## Make report messages coach instead of adding logic

*10 comments*

**Check:** Review message text as part of the rule's design. If the rule branches a lot to pick an exact message, try fewer messages with better guidance. Check for copy-pasted text, extra lines, and vague wording.

**Why:** Rules can try harder than they need to to give the right errors. Less logic and more coaching in the messages can be more accurate and precise for users.

**From your reviews:**

- ["With a bit less logic & a bit more coaching in the messages, I think it'll be more accurate & precise for users."](https://github.com/typescript-eslint/typescript-eslint/pull/8509#pullrequestreview-1942799069)
- ["I think the only blocker for me is the removing the second line of the `this` messages - WDYT?"](https://github.com/typescript-eslint/typescript-eslint/pull/11704#pullrequestreview-3614017464)
- ["Just the one issue (I'm guessing copy & paste?) with the report message."](https://github.com/michaelfaith/eslint-plugin-package-json/pull/1148#pullrequestreview-2978704015)
- ["The message was technically correct (accurate) before, just not very specific (precise)."](https://github.com/michaelfaith/eslint-plugin-package-json/pull/328#issuecomment-2173249384)

## Keep options minimal, object-shaped, and strict in schema

*10 comments · automatable*

**Check:** Remove schema properties the rule never reads. Question options nobody would turn off. New options go in an object rather than array-style strings, and a boolean should default to `false` with a name to match.

**Why:** Truthy defaults for unspecified values get confusing, and needing a table to explain options is a symptom of unclear options.

**Verify:** Pass a misspelled option in a schema test and confirm config validation fails.

**From your reviews:**

- ["I'm not a fan of truthy defaults for unspecified values."](https://github.com/typescript-eslint/typescript-eslint/pull/9954#discussion_r1781091655)
- ["Inline array/string options are nice and succinct but don't scale well when other options get added in."](https://github.com/michaelfaith/eslint-plugin-package-json/pull/786#discussion_r2139956952)
- ["good to restrict the objects so people don't pass in different properties (e.g. typos/misspellings) and get confused why they do nothing."](https://github.com/typescript-eslint/typescript-eslint/pull/5728#discussion_r1146335426)
- ["we've been moving away from array-style rule options"](https://github.com/typescript-eslint/typescript-eslint/pull/10477#discussion_r2401913656)

## Ask whether the rule belongs in this plugin at all

*8 comments*

**Check:** Before reviewing the code, decide if the rule should ship here. Look for whole-project analysis that can't be made performant, a heavy new dependency, an existing third-party rule, a frozen stylistic category, or a target that modern projects no longer hit.

**Why:** A useful rule can still be a bad fit: it may be better iterated on in a separate plugin, not bound by the project's limited flexibility and staffing. Rules included by default have to stay relevant.

**From your reviews:**

- ["think this rule would be better off in a separate plugin from typescript-eslint for now"](https://github.com/typescript-eslint/typescript-eslint/pull/8965#issuecomment-2187923184)
- ["I think this should be in a separate plugin, actually."](https://github.com/flint-fyi/flint/pull/421#pullrequestreview-3332564201)
- ["I don't think it's still relevant for modern projects enough to warrant being included by default."](https://github.com/flint-fyi/flint/pull/458#issuecomment-3438528750)
- ["recreating a graph on every file parse is not a performance-friendly-enough architecture for us to go with"](https://github.com/typescript-eslint/typescript-eslint/pull/8965#pullrequestreview-2092419331)

## Check for overlap with other rules, flags, and options

*8 comments*

**Check:** Look for double-reporting within the rule, option groups that match the same thing, and existing coverage from a third-party rule or compiler flag. Ask if the behavior is still needed given those.

**Why:** Overlap means duplicate reports or behavior that's no longer worth carrying. An allowance that predates a compiler flag may not be as good as it used to be.

**Verify:** Add a test that hits two code paths or two option groups at once and assert exactly one report.

**From your reviews:**

- ["I think the direction is good - but the two new sub-groups shouldn't have overlapping matches, no?"](https://github.com/typescript-eslint/typescript-eslint/pull/8084#pullrequestreview-1861131146)
- ["That's not for this rule to say. Ignoring unused property accesses is in the realm of"](https://github.com/typescript-eslint/typescript-eslint/pull/10137#discussion_r1854381893)
- ["this addition of using `checkIdentifier` on literals caused double-reporting in quite a few test cases."](https://github.com/typescript-eslint/typescript-eslint/pull/11006#pullrequestreview-3279916279)
- ["The stylistic decision of whether to use template literals vs other forms of apostrophes when there's no interpolation is out of scope for this bug-catching rule."](https://github.com/typescript-eslint/typescript-eslint/pull/7957#discussion_r1416275932)

## Justify each option with a real use case

*8 comments*

**Check:** Question options in a rule's first version, especially granular per-case booleans or ones not agreed on in the issue. Without a known use case, leave them out and add them later on request.

**Why:** They're added complexity for a rule that hasn't been tried in the real world, and an option can always be added in a followup.

**From your reviews:**

- ["Why allow such a granular set of options? Is there a known use case where someone would want to skip, say, only `Object.values`?"](https://github.com/typescript-eslint/typescript-eslint/pull/9369#discussion_r1657096403)
- ["If it's enabled, this rule will do nothing. So why include it at all? Users can always disable the rule."](https://github.com/typescript-eslint/typescript-eslint/pull/5848#discussion_r998884067)
- ["They're added complexity for the first version of a rule we haven't tried out in the real world yet."](https://github.com/typescript-eslint/typescript-eslint/pull/9707#discussion_r1967922340)
- ["If there are none, why not hardcode the rule to always ignore them?"](https://github.com/typescript-eslint/typescript-eslint/pull/10477#discussion_r2021042432)

## Start with the smaller rule and add surface on demand

*7 comments*

**Check:** For a first version, question each option, nuance in suggestions, and speculative branch. If nobody has asked for a behavior, drop it and let users request it later.

**Why:** Options and nuance cost code and review time. Users can always feature request an option, and a pre-1.0 or unreleased project has no need to keep things around for compatibility.

**From your reviews:**

- ["For an initial version of the rule, I think nuance around suggestions aren't necessary."](https://github.com/typescript-eslint/typescript-eslint/pull/9707#pullrequestreview-2276237784)
- ["I'm strongly leaning towards simplifying it a bit by removing the `withFix` check - what do you think?"](https://github.com/michaelfaith/eslint-plugin-package-json/pull/328#pullrequestreview-2091062943)
- ["I suppose if folks _really_ want this behavior then they can always feature request an option for the rule."](https://github.com/typescript-eslint/typescript-eslint/pull/10363#pullrequestreview-2455626569)
- ["The utility has no known issues as used right now so we can cross that bridge when we get to it IMO."](https://github.com/typescript-eslint/typescript-eslint/pull/10422#pullrequestreview-2637633536)

## Keep extension rules in parity with the base rule

*7 comments · typescript-eslint*

**Check:** For an extension rule, confirm it supports every option and sub-option of the base rule, reuses the base rule's listeners instead of reimplementing them, and adds only TypeScript-specific behavior.

**Why:** No major new functionality goes on top of base rules; that request belongs in ESLint core. Reusing the base rule can cut a lot of added lines.

**Verify:** Diff the base rule's schema against the extension's schema, and port the base rule's tests.

**From your reviews:**

- ["I took a quick initial pass and think there should be an option added to maintain parity with ESLint core."](https://github.com/typescript-eslint/typescript-eslint/pull/10218#pullrequestreview-2413486777)
- ["We don't add any major new functionality on top of base rules here."](https://github.com/typescript-eslint/typescript-eslint/pull/8640#issuecomment-2085530014)
- ["I think we can reduce the lines of coded added by a bunch by reusing the base rule (`rules.Program()`)."](https://github.com/typescript-eslint/typescript-eslint/pull/5327#pullrequestreview-1064469487)
- ["Do I need to support all options & sub-options from the base rule?"](https://github.com/typescript-eslint/typescript-eslint/pull/6211#issuecomment-1350175092)

## Add an option where the rule would ban valid code

*7 comments*

**Check:** Look for cases where the rule reports a legitimate pattern that some users will want, or where a sibling rule has an equivalent option. Ask if the behavior should be opt-in or configurable rather than universal.

**Why:** It's not a linter's place to tell people not to use a totally valid pattern of code. A rule that can't be scoped ends up too opinionated and too restrictive to enable.

**From your reviews:**

- ["It's IMO not our place as a linter to tell people not to use a totally valid pattern of code like that."](https://github.com/typescript-eslint/typescript-eslint/pull/7880#issuecomment-1819868988)
- ["Just requesting changes on the missing `"allow-as-parameter"` equivalent."](https://github.com/typescript-eslint/typescript-eslint/pull/6749#pullrequestreview-1376709413)
- ["Sorry, I'm only now realizing the class instance stuff might need an option."](https://github.com/typescript-eslint/typescript-eslint/pull/8509#pullrequestreview-1917693959)
- ["I think the API might need to be able to consider the original error code(s), as many users will ask for that?"](https://github.com/typescript-eslint/typescript-eslint/pull/5026#pullrequestreview-980661543)

## Deprecate old rules and options instead of removing them

*6 comments*

**Check:** When a rule or option is replaced, keep the old one working and mark it deprecated rather than deleting it in a minor. The exception is a project with no real users yet.

**Why:** Keeping legacy options makes a change non-breaking, deprecation itself isn't breaking, and removing functionality is disliked even when technically allowed on 0.x.

**From your reviews:**

- ["Keeping the legacy options around to make this non-breaking seems reasonable + necessary to me."](https://github.com/typescript-eslint/typescript-eslint/pull/10639#pullrequestreview-2561099367)
- ["We're on 0.x so technically we can do whatever we want... but as a nicety for users I do like keeping the old one around for a while."](https://github.com/michaelfaith/eslint-plugin-package-json/pull/711#pullrequestreview-2526583032)
- ["Deprecation is not a breaking change."](https://github.com/eslint-community/eslint-plugin-eslint-comments/pull/299#pullrequestreview-3661153302)
- ["We have no real users and so no need to put things in friendly deprecation zones."](https://github.com/flint-fyi/flint/pull/2169#issuecomment-3814060134)

## Leave formatting concerns to formatters

*5 comments*

**Check:** Flag rule or fixer code that exists to preserve whitespace, blank lines, or redundant parentheses, and rules that report purely stylistic points. Parentheses only matter when removing them or keeping them causes a syntax error.

**Why:** Whitespace code tends to be verbose and hard to maintain. A slightly worse formatted autofix is better than hundreds of lines of code, and users who care should use a dedicated formatter.

**Verify:** Delete the whitespace-preserving branch; fix output should still parse, even if it is uglier.

**From your reviews:**

- ["It's better to have a slightly worse formatted output from an autofix than to have to maintain many -often hundreds- of lines of code."](https://github.com/typescript-eslint/typescript-eslint/pull/5728#issuecomment-1307161253)
- ["We generally don't try to put effort into rule fixers towards respecting nuances of original source file formatting."](https://github.com/typescript-eslint/typescript-eslint/pull/7564#issuecomment-1698327746)
- ["Detection/practices around blank lines are not in the purview of the rule."](https://github.com/typescript-eslint/typescript-eslint/pull/11990#issuecomment-3781750466)
- ["Mostly requesting changes on making the rule not flag stylistic points."](https://github.com/typescript-eslint/typescript-eslint/pull/7957#pullrequestreview-1766084544)

## Decide up front whether the rule needs type information

*5 comments*

**Check:** Ask if a syntactic rule is really correct without types, and whether a typed rule needs them. Options must fit that choice: an untyped rule can't take a format that requires type information.

**Why:** This choice changes the rule's correctness, its cost, and which options are possible, so it should be settled with the team before polish.

**From your reviews:**

- ["Unless someone in @typescript-eslint/triage-team disagrees with me, I think we'll want type checking in the rule?"](https://github.com/typescript-eslint/typescript-eslint/pull/5848#pullrequestreview-1278082999)
- ["Adding a TypeOrValueSpecifier ignore option is out-of-scope because that format requires type information. This rule isn't typed right now."](https://github.com/typescript-eslint/typescript-eslint/pull/10477#issuecomment-3482898889)
- ["If the value checking needs type information anyway..."](https://github.com/typescript-eslint/typescript-eslint/pull/10670#pullrequestreview-2691391564)

## Check the reference rule's implementation when porting

*5 comments · flint*

**Check:** When a Flint rule ports an ESLint rule, compare it with the original source, docs, and tests. Look for prior art for scope handling, token lookup, and reference tracking before writing custom logic.

**Why:** Ports have repeatedly been simpler and less reliable than their reference implementations, which already solve shadowing, comments, and modifying references.

**Verify:** Read the ESLint rule's tests and confirm each behavior has an equivalent Flint test.

**From your reviews:**

- ["Take a look at the reference rule docs, source, and tests from ESLint, and fill out this rule."](https://github.com/flint-fyi/flint/pull/962#discussion_r2481525462)
- ["Refactor to check the actual nodes/tokens, the way e.g. the ESLint rule does"](https://github.com/flint-fyi/flint/pull/423#discussion_r2427020049)
- ["It should be using a scope manager, the way e.g. ESLint does."](https://github.com/flint-fyi/flint/pull/389#discussion_r2414637699)
- ["Surely there's some prior art with looking at commas?"](https://github.com/flint-fyi/flint/pull/407#discussion_r2421204603)

## Avoid boundless or opinionated defaults

*5 comments*

**Check:** Challenge any default allowlist of specific types, and any default that makes the rule lenient. Ask where the list ends, and whether a user on default options would be confused that only some types work.

**Why:** Core rules should avoid 'boundless' defaults and shouldn't put forward opinions on which types match an option. Empty is usually the right default.

**From your reviews:**

- ["One of the rules of thumb for core lint rules is to avoid "boundless" defaults."](https://github.com/typescript-eslint/typescript-eslint/pull/4436#issuecomment-1021850458)
- ["We generally try not to put forward opinions like which internal types do or don't match up with specific rule options."](https://github.com/typescript-eslint/typescript-eslint/pull/4436#issuecomment-1019618486)
- ["But I want to discuss having the rule be lenient for conditional types by default?"](https://github.com/eslint/eslint/pull/19908#pullrequestreview-2997737545)

## Fix the root cause instead of working around it

*5 comments*

**Check:** Treat these as smells: an `as` needed to call a shared helper, synthesized AST nodes, hardcoded special cases for a runtime or package, and comments saying "for some reason". Change the helper, handle the node natively, or fix the underlying bug.

**Why:** Workarounds use general functions against how they are meant to be used and are brittle to AST changes. Unexplained behavior should be hammered out before merge.

**From your reviews:**

- ["I think the fact that this needed an `as` assertion indicates the new code is trying to work around how things are meant o be used."](https://github.com/typescript-eslint/typescript-eslint/pull/8673#discussion_r1537842742)
- ["Synthesizing nodes is a rather unusual practice. It's brittle to changes in AST and AST handling, as well as verbose."](https://github.com/eslint/eslint/pull/19562#discussion_r2021346630)
- ["As a general trend, comments like _"For some reason, ..."_ are things we should try to hammer out before merge IMO."](https://github.com/typescript-eslint/typescript-eslint/pull/8821#discussion_r1564644417)
- ["I don't think we should be hardcoding for runtime-specific behavior."](https://github.com/typescript-eslint/typescript-eslint/pull/8556#discussion_r1667474977)

## Keep rule meta in sync with what the rule does

*5 comments · automatable*

**Check:** Check that `fixable` is set only when a rule has a `fix`, suggestion flags only when it provides suggestions, and that every declared message ID is used.

**Why:** A rule that only has suggestions isn't "fixable", and leftover message IDs or `suggestion: true` misdescribe the rule.

**Verify:** Enable eslint-plugin-eslint-plugin's require-meta-fixable, require-meta-has-suggestions, and no-unused-message-ids on the rule.

**From your reviews:**

- ["The rule isn't "fixable", it just has suggestions."](https://github.com/JoshuaKGoldberg/eslint-plugin-erasable-syntax-only/pull/12#discussion_r1957404559)
- ["This rule doesn't make suggestions in its reports."](https://github.com/typescript-eslint/typescript-eslint/pull/4833#discussion_r855614512)
- ["The new `inlineTypes` message ID is no longer used anywhere."](https://github.com/typescript-eslint/typescript-eslint/pull/5050#discussion_r928280155)

## Judge the rule against the issue's purpose, not its algorithm

*4 comments*

**Check:** Compare behavior to what the backing issue asks for and what the rule says it does. An implementation detail, such as counting references, doesn't justify an outcome that contradicts the rule's purpose.

**Why:** A PR can pass its own tests while heading in a different direction from the issue. If code conflicts with the rule's general purpose, that's a conceptual bug in the algorithm.

**From your reviews:**

- ["I interpreted the counting as just an implementation detail. The rule's general purpose is to flag unnecessary type parameters."](https://github.com/typescript-eslint/typescript-eslint/pull/9536#issuecomment-2515501665)
- ["I think the direction here might be a big different from the issue?"](https://github.com/typescript-eslint/typescript-eslint/pull/9536#pullrequestreview-2221811004)
- ["Since it doesn't yet address the original issue, I'll convert it."](https://github.com/typescript-eslint/typescript-eslint/pull/6095#pullrequestreview-1194906711)

## Keep rule-specific logic out of shared and core code

*4 comments*

**Check:** Check whether a rule PR adds rule- or language-specific behavior to core packages, shared utilities, or a global test file. Move it to the rule, its tests, or the language package, and have core expose only general capabilities.

**Why:** Core should give rules what they reasonably need without knowing about any one rule. Shared logic changes are separate issues and PRs.

**From your reviews:**

- ["There should never be any rule-specific logic in core."](https://github.com/flint-fyi/flint/pull/1457#discussion_r2677892173)
- ["Hmm, we normally put rule-specific things in each rule's specific test files."](https://github.com/typescript-eslint/typescript-eslint/pull/6894#discussion_r1167973525)
- ["I think this should be in the `ts` package, no?"](https://github.com/flint-fyi/flint/pull/1605#discussion_r2688277243)
