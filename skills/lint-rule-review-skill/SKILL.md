---
name: lint-rule-review-skill
description: Review a custom lint rule the way an experienced ESLint, typescript-eslint, and Flint maintainer would, proving bugs by mutating the rule and running adversarial test cases. Use this whenever the user asks to review, audit, critique, or sanity-check a lint rule, a rule's fixer, its tests, or its docs, or a PR or branch that adds or changes one, even if they only say "take a look at this rule" or give a PR number in a linter or plugin repo. Don't use it for configuring lint rules in a project or fixing lint errors in application code.
---

# ESLint Rule Review Skill

Review a lint rule the way a maintainer with thousands of past review comments would.
That maintainer's defining habit is empirical: they don't just read a rule, they try to break it.
They delete a condition and see whether a test fails, and they invent the syntax nobody thought of.
Follow that habit here.
A finding backed by a failing test or a surviving mutant is worth far more than a plausible-sounding one, and plausible-sounding noise is what makes automated reviews get ignored.

The findings go to the user, who decides what to do with them.
Writing the review to a local file is the whole job: posting to GitHub, or pushing anything, happens only if the user separately asks for it.

## 1. Understand the change

Work out what is under review: a PR, a branch, or a rule file.
For a PR, check out its head commit if you can, because later steps run the code.

Read these before forming opinions:

- The rule, its tests, and its docs page
- The PR description and linked issue, because a rule is judged against its purpose, not its own algorithm
- Two or three sibling rules in the same repo, plus `CONTRIBUTING` docs

Note any question the author asks in the description.
The review should answer it.

Repo conventions beat this skill's references.
The references come from several projects, so if a pattern contradicts what the repo clearly does, follow the repo.
That decides how to write the code, not whether a reproduced wrong result is a bug.

The references are large, so don't read them end to end.
Start from [references/index.md](references/index.md), which lists every pattern: skim every title, and read the sections that fit this change.
Also read [references/extra-checks.md](references/extra-checks.md), which is short and covers tool pitfalls, running rules over real code, typescript-eslint CI variants, and checks for fixers and suggestions, import rules, and Flint.

If the PR changes several rules, set up the CI matrix once, take each rule through mutation, head-vs-base cases, and adversarial cases, then do the rest of step 4 once for the whole PR: the real-code run, the cross-rule pass, big suggestions, the CI-variant runs, and cleanup.

## 2. Check the rule's design

Pick from the `design.md` list in the index by the kind of change:

- **New rule:** whether it belongs, its scope, overlap with other rules, type information, options, and preset placement.
- **Change to an established rule:** semver impact, sibling rules that need the same change, and whether the change serves the issue.
  Skip the rest.

If the PR is rough, such as having no tests yet or a design that can't serve the issue, stop at a high-level review and say so, and skip mutation, which can't tell you anything without tests.
Still try the rule on a few cases, since a real bug is worth reporting at any stage.
Detailed comments on code that's about to change waste everyone's time.
Suggesting a redesign that still serves the issue, such as narrowing what the rule reports, doesn't make a PR rough when it has tests: review it in full and post bugs as step 5's One root cause says, even when the redesign would also fix a blocking bug.
If you ask for the redesign rather than offer it, leave out comments other than bugs on code it would remove.

## 3. Read every added line

Use the index to pull the sections that match what changed:

| Changed                      | Look in                                          |
| ---------------------------- | ------------------------------------------------ |
| Rule logic                   | `bugs.md`, `simplification.md`, `performance.md` |
| Fixers or suggestions        | `fixes.md`                                       |
| Messages                     | `messages.md`                                    |
| Tests                        | `test-method.md`                                 |
| Docs pages                   | `docs.md`                                        |
| New names, options, or rules | `naming.md`                                      |

Do this before trying to break anything, because bug hunting takes over once it starts.
Take notes as you go, and sort them in step 5.

**Go through the diff one added line at a time**, and ask these of each:

- **Names:** could you tell what this identifier holds or does without reading further?
  Watch for names that describe a type rather than a purpose, and names that claim the wrong action.
  If it took a second read to understand, say so and suggest a better name.
- **Locals:** is this variable used once, right after it's set?
  Suggest inlining it.
- **Conditions:** does it collapse? `!x || x.kind !== y` becomes `x?.kind !== y`.
  Nested or adjacent `if`s often merge, and a boolean `if` often returns directly.
- **Guards:** can this state really happen, given the AST and the code above it?
  Does it skip only what its code comment says, or more, such as a check for any string commented as allowing only the empty string?
- **Reuse:** does a shared utility do this already?
  Check before accepting any helper.
  Would a helper need fewer parameters if it lived inside `create`?
- **Length:** is there less code that does the same thing?
  Simplification is the largest category in past reviews.
- **Worth doing:** does this code or `TODO` plan for something nobody needs?
  Say it can go.

If the code looks AI-assisted, read it with a more discerning eye, because that's where padding tends to collect.

**Sweep every comment and docs sentence.** Bug hunting crowds this out, yet it's a regular source of real review comments, so do it as a separate pass over each added comment and each added line of docs.
Don't ask whether it's correct, ask whether it should be there as written:

- Will this comment go stale?
  Notes about test coverage, history, or what a test covers do, so suggest deleting them.
- Does it restate the code?
  Suggest deleting it.
- Is it a significant known shortcut, such as a fork of upstream code?
  Ask for a `TODO`, with an issue link if one exists, and suggest the exact comment.
- Would an end user care about this docs sentence?
  Implementation details don't belong on the page.
- Does this docs example carry code it doesn't need?
  Suggest trimming anything beyond what shows the behavior.
- Is the sentence precise?
  Watch for wording that sounds universal or always true when it isn't, and suggest a rewrite.

Give these as ` ```suggestion ` blocks.
They're quick for the author to accept.

**Notice what's good.** Note anything that helped you review or handles something tricky, and mention it specifically, in the review body or as a `[Praise]` comment.

## 4. Try to break it

This step produces the highest-value findings, so don't skip it.
Start by getting the rule's existing tests to pass, so you have a working command that runs just this rule's tests.

**Set up the CI matrix, not just the default setup.** Read the CI workflow for the rule's package, and if the PR has CI results, reproduce each failure the PR could have caused and treat it as a finding.
List each variant CI runs, such as another type checker backend, the oldest supported TypeScript, or the oldest supported Node, note which ones CI has already passed on this head, and start setting them up now, because some take a while to install.
For a typed rule, assume that new checker calls and new test cases can differ by backend and TypeScript version.
For any rule, assume that a change to `skip`, `only`, or `dependencyConstraints` in a test file can change which cases run on each Node and TypeScript version.
[references/extra-checks.md](references/extra-checks.md) lists known cases.

**Mutate the conditions.** Run the bundled script from the repo root.
It needs Node 22.18 or newer, which may differ from the version the repo pins.
Each mutant is one test run, so run it in the background.
It edits the rule in place, so anything else you run in the meantime has to use a copy of the rule saved under a temporary name:

```bash
node <skill-dir>/scripts/mutate-conditions.ts --file <rule> --test "<test command>" --base <base ref>
```

`--base` limits mutants to lines the PR changed, and `--diff <file>` does the same from a diff.
Omit both to mutate a whole new rule.
Mutants run in source order up to `--max`, 60 by default, so raise it if the summary shows any not tested.
If the tests run from a package folder, run the script from there. `--out <file>` saves the full results, and a short list of survivors always prints last.
It first checks that the tests fail when the rule throws, and stops if they don't, because then they aren't exercising the rule.
The script restores the file when it finishes or is stopped.
If it's killed outright, the next run refuses to start and prints where the original is saved, so compare the two before changing the rule, because you may have edited it since.
If the test command builds the rule, rebuild afterward, because the build output still has the last mutant.
It parses with the repo's `typescript`, and on TypeScript 7 or later it prints how to pass an older copy with `--typescript`.

Mutants the tests don't notice are survivors: each one means a test is missing or the code is dead, and you should work out which.
Delete the condition and think about what input would need it.
If you can't construct one, recommend deleting the code.
If you can, add it to the next step.
Survivors marked `likelyTypeOnly` are bare null-check exits that often exist only for the compiler, so look at them last, but check that the branch isn't simply untested.
If the test runner type-checks, a mutant can also "fail" just because it doesn't compile, so use a transpile-only command where you can.

The script only covers common mutations.
Also try by hand anything it can't reach that the PR depends on, such as swapping an argument for a similar variable already in scope.

**Compare head and base.** For a change to an existing rule, this is the most important check.
A regression in code that used to work matters far more than a gap that was already there, and you can't tell them apart without running both versions.
Save the base version beside the rule, for example with `git show <base>:./<rule> > <rule-dir>/<name>.base-tmp.ts`, or by reverse-applying the diff.
If the PR also changes utilities the rule uses, a single base file would import head's versions, so save a copy of base's whole source folder beside `src` and import the base rule from there.
Then copy [assets/compare-rule.test.ts](assets/compare-rule.test.ts) beside the rule's tests and adjust its marked lines.
It sorts each case by comparing report counts, and it also records messages, ranges, fix output, suggestions, crashes, and compile errors in each fixture.
Read `CHANGED OUTPUT` results yourself, because a changed message or fix may be the bug, and ignore any case with `fixtureErrors` until its fixture compiles, unless its only `fixtureErrors` are a missing module, export, or declaration, or ones the rule exists to report, such as a duplicate declaration for `no-redeclare`.
For a rule that uses type information, first declare what's missing with the type the case intends and rerun, and if the result changes, use the declared version as the case.
Step 5 counts these as input that compiles.
For a PR that adds a fixer, the fix and suggestion output is the main thing to read, so set `expectedOutput` on those cases.
If the PR adds an option, set `baseOptions` so that the base version's schema accepts the case.
Without it, the case is judged on head alone.

For a new rule, import it as both `head` and `base`, so that the harness reports `ok` or `WRONG` instead of comparing versions.
If the harness doesn't fit the plugin, use a temporary test file in the repo's own test harness instead.

For a change to an existing rule's logic or fixer, also run both versions over real code, because hand-written cases only find what you thought of.
Use the repo itself plus one or two outside projects that use the syntax the rule matches and don't already enable the rule, with their dependencies installed if the rule needs type information, because code that already passes a rule at base can show new reports but never lost ones.
Run each rule with its default options, plus any options the changed code needs in order to run, and set it up as "Running both versions over real code" in [references/extra-checks.md](references/extra-checks.md) describes.
Start it only once no mutation run is active, because mutation edits the rule in place.
Record where base and head differ, group the differences by rule and message, reduce one of each group to a literal case, and sort it as intended or a regression.
For a new rule, run it over the same code and read what it reports.

**Write adversarial cases.** For each behavior the PR adds or changes, go through the category list in [references/test-cases.md](references/test-cases.md), the index titles for `bugs.md` and `fixes.md`, and the "Rule logic", "Any fixer or suggestion" (plus "Adding a fixer to an existing rule" when the PR adds one), and "Import and export rules" sections of [references/extra-checks.md](references/extra-checks.md).
Write at least one literal case for each one that applies, or say why no case is possible.
For each new helper, also grep `util` and sibling rules for the same logic, as step 3's reuse question and simplification.md's "Move shared logic into one utility" ask, and run each copy's cases against the other, since either one can be the wrong copy.
Picking selectively is how a category that clearly matches gets skipped.
If a change sends inputs into a different existing branch, run the categories that fit that branch on the inputs it now gets, such as every contextual-type position for a branch that reads the contextual type.
Record this in the review's Coverage section, one line per behavior.
Decide the correct behavior before running each case, because it stops you rationalizing whatever comes back.
Print message data as well as report counts, since a wrong type name in a message is a bug too.
Pair a case in new syntax with a control in old syntax, such as a symbol key with the same case using a string key.
Look for:

- Crashes
- False positives, where valid code is reported
- False negatives, where invalid code isn't reported
- Fixes that produce invalid code, change behavior, or drop comments
- Report ranges that are wider than the offending code

Keep the cases that exposed something so that they can go in the review as literal test cases.
Literal matters: this maintainer asks for hand-written cases and pushes back on `.map`, factories, and generated tests.

**Compare copies across rules.** When a PR changes several rules, do one pass over the whole diff after reviewing each rule, because a per-rule review can't see that two rules solved the same problem differently.
If you were asked about only some of its rules, compare just the helpers, guards, and self-contained loops or blocks they add, whether in a helper or inline, against the rest of the diff, utilities included.
Group new helpers, guards, and repeated blocks of code by what they decide or do, such as whether a call is a known array method, whether a name is the real global, where a node ends including parentheses, reading a static property name, or skipping TypeScript wrappers such as `as`, `!`, and `satisfies`.
Find copies by what the code checks, such as the node types it walks through, not by name, and search the whole diff for each one.
Include existing utilities for the same thing.
Wherever there are two or more copies, run each case that one copy handles against the others, report the ones that disagree, and recommend one shared utility where the logic is nontrivial.
Some copies differ on purpose, such as a rule that checks for `any` and unwraps `!` but not `as`, because an `as` can turn `any` into a safe type, so report a disagreement only when a copy gives a wrong result for its own rule, or, for a utility, for any caller.
If you post a bug in which a copy gives a wrong result for its own rule, or for a utility, for any caller, put the shared-utility suggestion in the first such bug's comment, in step 5's Order, and say "see <file:line>" in the others.
Build it on the copy or existing utility whose answers are right for every rule that would call it, or, if none is, on the one closest to that, naming the fix it needs for each case it gets wrong, and leave out any copy that is right for its own rule but differs on purpose, as in the `any` example, so another caller can't use its answer.
Say adopting it is optional as long as the bug is fixed, unless it's the smallest fix, leave the comment's blocking status to step 5, and leave that group out of the `[Refactor]` comment.
If that bug isn't posted, because it's in a rule the PR doesn't touch or you weren't asked about, or step 5's cap on non-blocking comments cut it, which it can't for a bug step 5 protects, keep the group in the `[Refactor]` comment, name the case the wrong copy gets wrong, and build the suggested helper on a copy that gets it right, or say the existing utility needs that fix first.
Put every other group of two or more nontrivial copies, such as a loop over several node types, that agree, or that differ only where either copy's answer would be right for every caller, leaving out any copy that is right for its own rule but differs on purpose, in one non-blocking `[Refactor]` comment that lists each group and its files and suggests a shared helper, or the existing utility where one already does it, or in a `[Followup]` for a large PR.
That comment competes for the cap like any other non-blocking comment, and if the cap cuts it, keep a one-sentence followup mention of the groups, their files, and any case a copy gets wrong in the review body.

**Prove big suggestions.** If you think a redesign would remove several bugs, prototype it and run the existing tests. "267 of 268 tests pass, and here's why the other fails" is far more useful than a hunch.

**Run the CI variants.** Under each variant CI hasn't passed on this head, run the tests of every rule whose source or tests changed or that uses a changed utility by name, not just through a shared barrel export, plus the repo's docs, schema, and utility tests for anything the PR changed, and treat each failure as a finding.
First move the base copies and harness copies out of the repo, because a full-suite run picks them up, and some repos fail any file in the rules folder that isn't a rule.
Then run each case you kept for the review under every variant, as temporary cases in the rule's own test file, since CI never ran them.
If one fails on the oldest TypeScript only because types print or simplify differently there, gate it as [references/extra-checks.md](references/extra-checks.md) describes, and treat any other failure on a variant as a finding.

**Clean up.** Run `git status` and remove every temporary file before moving on, so the repo is back to how you found it.

## 5. Filter the findings

Before writing anything, go through each finding:

- **Bugs:** include the case and what actually happened.
  If you couldn't reproduce it, cut it, or downgrade it to a `[Question]` if you still have a specific reason to suspect it.
- **Order:** within each blocking status, regressions come first, then bugs in new code, then existing bugs the PR touches.
  Put rare bugs after every realistic bug of the same blocking status, in that same order.
- **One root cause:** if a redesign, including a shared utility from step 4's "Compare copies across rules", would fix several bugs, make that one comment and list the cases in it.
  That includes each reproduced bug the rest of this step would post whose case the prototype gets right when you run it, with its case and what happens, not only a line in Coverage.
  If the redesign removes, bypasses, or makes unnecessary code that has a bug, such as a too-broad guard, run that bug's cases on the prototype, and judge them by the PR's stated intent where it covers the case, otherwise by the behavior you decided on in step 4, not by what the redesign reports.
  A redesign that narrows what the rule matches doesn't turn a guard that skips more than its code comment, description, or docs say into a missed report to defer, as the paragraph after this list that caps non-blocking comments explains.
  Keep a separate comment at the buggy line for a case the prototype got wrong when you first ran it, a bug that blocks, or a bug in a guard or exemption the redesign removes, bypasses, or makes unnecessary, since the author may not adopt the redesign, and have the redesign comment say "see <file:line>".
  Keep that comment even if you then change the prototype to get the case right, and don't say the redesign makes that code unnecessary while the prototype still gets its case wrong, unless the redesign deliberately stops reporting that case and its comment says so.
  The cap paragraph may still merge rare non-blocking ones in the same file, each with its own fix, but a bug in a guard or exemption stays at that guard's line.
  When adopting the redesign is optional, give each other bug in the same rule that the redesign fixes its standalone fix inside the redesign comment, not a second comment.
  A bug the redesign fixes in another rule the PR changes that you were asked about gets its own comment in that rule's file, with its case, even when the redesign comment also lists it.
  Give it its own fix when adopting the shared one is optional, and say "see <file:line>" for the shared fix, as step 4's "Compare copies across rules" says, rather than a "here and elsewhere" under Duplicates.
  The cap paragraph after this list protects that rule's own comment, as it says.
  The Existing code bullet below doesn't rule this comment out, and it's a bug, not `[Non-Actionable]`.
  A bug in a copy in a rule the PR doesn't touch, or that you weren't asked about, gets no comment of its own: name it in the redesign comment if there is one, otherwise in the `[Refactor]` comment.
- **Repo tooling:** if a bug comes from code or tooling in this repo that the PR doesn't touch, and that code goes against its own evident intent, such as the repo's `RuleTester` dropping a case's `skip`, add a non-blocking note in the bug's comment suggesting a fix there in a followup issue or PR.
  Skip the note when other callers may rely on that behavior or the PR uses that code outside its contract.
  The Existing code bullet below doesn't rule this out, since the note goes in a comment you're already posting.
- **Contested positions:** treat these as non-blocking questions: `in` checks on nodes, `esquery` use, option schema shape, and `import ts` style.
  Other maintainers have reasonably disagreed on them.
- **Widen or defer:** if a gap is the same concept as the rule and real users would hit it, ask for it in this PR.
  Otherwise suggest a followup issue.
  A new exemption that skips more than it says is a bug, not a gap, as the cap paragraph after this list says.
- **Add or drop an option:** ask for an option only where the rule would otherwise ban valid code, or where a real user asked for one.
- **Existing code:** leave out problems the PR didn't touch unless they're serious, and mark those `[Non-Actionable]`.
- **Duplicates:** merge repeats into one comment that says "here and elsewhere", except as One root cause says for bugs in other rules' files.

Noise costs more than a miss: an author who skims past three weak comments will skim past the real one too.
Blocking comments should be only what must change before merge.
Keep at most about eight non-blocking comments, choosing the ones that most improve the code, with a ready-to-apply suggestion wherever the comment requests a change.
Don't cut a reproduced regression for how rare or unrealistic it is, or because other existing code has the same bug.
The same goes for a reproduced wrong report, message, fix, or suggestion in a code path the PR adds, such as a new branch, fix, or suggestion, but not code it only moves or rewrites without changing behavior on that input, and for a fix or suggestion the PR adds, including a new branch of an existing one, that drops a source comment.
The same goes for a bug that One root cause gives its own comment in another rule's file, even when base has it too, if the PR changes the buggy code or it's a fix or suggestion whose output doesn't parse or type-check.
If the cap cuts the comment that holds the shared fix, move the shared fix into the first remaining comment that says "see <file:line>" for it.
Output that doesn't parse or type-check means an error the output adds that the Suggestions bullet in extra-checks.md doesn't excuse.
Each of these needs input that compiles, which includes cases whose only `fixtureErrors` are a missing module, export, or declaration, or ones the rule exists to report, as step 4 says.
Post these inline, not only in Coverage, say how rare each is, order them as Order says, and choose labels as the rest of this step says.
A reproduced regression is a bug, not `[Non-Actionable]`, even when the new approach matches how nearby code already works.
When that approach is one bugs.md warns about, such as comparing source text, try its usual failure cases, such as a comment inside the compared range, and report each one that fails at head and not at base, or in a code path the PR adds.
A description that names the approach doesn't make its failure cases deliberate.
Block on one only if both hold: its wrong result is new in this PR, meaning base didn't give that wrong result, or one at least as wrong, on that input, or the rule is new; and it crashes the rule, fails one of the repo's existing tests, its type check, or a CI job, makes an autofix produce invalid code or change behavior or types, makes a fix or suggestion drop a source comment whose loss changes behavior or types, regresses comment handling, or, for anything other than a dropped source comment, would plausibly hit real code.
A new exemption is a guard or early return the PR adds whose code comment, the description, or docs name the narrower code it's meant to allow.
A valid test alone doesn't state a purpose, and a description that allows only the narrower case doesn't make the rest deliberate.
Likewise, no test makes a fix or suggestion deliberate where its output doesn't parse or type-check, whether it expects that output or only a similar shape, such as a new declaration where the code augments an existing one, and nothing makes a duplicate identifier deliberate.
If a new exemption also skips code the rule should report, don't cut that bug, as with a wrong report.
It blocks only under the test above, so in an existing rule it can't block on input base didn't report.
A check the PR adds with no stated purpose that skips a syntax form the rule otherwise covers, such as an `Identifier`-only or `node.computed` check, needs a stated reason, as bugs.md says, so ask at the check why it's needed, as a non-blocking `[Question]` with a case it skips, which competes for the cap.
If it also skips input base reported, report that as a regression instead.
Every other missed report in a code path the PR adds that isn't a regression, a new exemption, or such a check follows Widen or defer instead, and the rare ones among those go together in one `[Followup]` comment, which competes for the cap, or a one-sentence followup mention in the review body if they span files.
A source comment dropped by a fix or suggestion the PR adds, including a new branch of an existing one, where base had no fix or suggestion for that input or its fix or suggestion also lost the comment, doesn't block unless losing it changes behavior or types, as with `@ts-expect-error` or `/* @__PURE__ */`, since fixes.md lets brand-new comment gaps be a followup.
If the cap still forces cuts after cutting the list below and then the unprotected comments that improve the code least, merge the rare non-blocking findings this paragraph protects in one file that share a label, including regressions, into one comment that lists each case and its fix, with a `suggestion` block only for the line it's on, and then merge across files of the same rule if needed, keeping each rule's bugs in that rule's files and a bug in a new exemption at its guard's line, even past the cap.
Don't cut a realistic bug in code the PR adds or changes the behavior of, or any finding this paragraph protects, unless the description says it's deliberate.
Realistic bugs that base has too, in code the PR touches but doesn't add, can go together in one `[Followup]` comment per file if the cap still forces cuts after cutting the list below.
Choose among the remaining findings as above.
Cut these first:

- Matters of taste with no real gain in clarity, such as rewording a message or collapsing a conditional that reads fine
- Anything the description says is deliberate, such as scaffolding for planned work
- Reproduced bugs that base has too, in code the PR touches but doesn't add or only moves or rewrites without changing behavior on that input, where no code path the PR adds gives the wrong result and no case is realistic, unless One root cause gives it its own comment in another rule's file.
  Keep one that does serious harm, such as deleting used code, or a fix or suggestion whose output doesn't parse or type-check.
- Whitespace and quote style
- Requests for process that adds nothing, such as a tracking issue for every small `TODO`

Nothing to report is a fine result, so don't invent findings to look thorough.

Match the verdict to the blocking comments.
If nothing blocks, approve and leave the rest as suggestions.
Many reviews from this maintainer on solid PRs are a warm approval with one or two small requests.

## 6. Write the review

Read [references/review-voice.md](references/review-voice.md), then write `lint-rule-review-skill-<pr-or-rule>.md` in the current directory, without committing it.
Keep the review body to a few sentences, going longer only to answer the author's questions or explain a design call.
Use this structure:

````markdown
# Review of <PR or rule>

**Verdict:** approve | request changes | high-level only

<Review body, following the order in review-voice.md>

## Inline comments

### `path/to/file.ts:42` · blocking

[Bug] <Comment as it would be posted>

```ts
<Literal failing case or suggestion>
```

Evidence: <What you ran and what happened, or "not reproduced">

## Coverage

<One line per behavior the PR adds or changes: each category that applies, and the case you ran for it or why no case is possible>

## Not checked

<Anything you couldn't run or verify, and why>
````

Mark each comment `blocking` or `non-blocking`, ordered blocking first. "Evidence" is for the user and wouldn't be posted, so be plain there about how strong each finding is.
Coverage is also for the user and wouldn't be posted.
Finish by giving the user the verdict, the blocking findings, and the file path.
