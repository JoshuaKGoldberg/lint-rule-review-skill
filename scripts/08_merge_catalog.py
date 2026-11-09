#!/usr/bin/env python3
"""Merge the 281 per-shard patterns into one catalog. Each id must be assigned exactly once."""
import collections, json, os
P = {p["id"]: p for p in json.load(open("data/patterns_all.json"))}
S = {
"bugs": ("Bugs: what rules miss or misreport", [
 ("Resolve static keys and values instead of matching only `Literal` nodes", "bug-01 pr_level-20"),
 ("Match by declaration, not by name: confirm it's the real global", "bug-02 unlabeled_rule-05 pr_level-12"),
 ("Cover the whole syntax family of the matched construct", "unlabeled_rule-13 bug-10 bug-14"),
 ("Treat `as` and `in` on AST nodes as signs of an unhandled case", "unlabeled_rule-11 bug-16"),
 ("Decide from AST nodes and checker types, not source text or printed names", "unlabeled_rule-08 bug-03 unlabeled_rule-09 unlabeled_rule-07 refactor-26"),
 ("Walk into unions, intersections, arrays, and tuples", "pr_level-28"),
 ("Resolve type parameters to their constraints", "pr_level-27"),
 ("Decide how a typed rule treats `any`, `unknown`, and `error` types", "bug-18 unlabeled_rule-49"),
 ("Detect types by behavior instead of hard-coding built-in names", "unlabeled_rule-06"),
 ("Check type flags with helpers, not `===`", "bug-19"),
 ("Justify every exemption", "bug-09"),
 ("Keep checking after one unhandled element", "bug-04"),
 ("Report even when no fix can be produced", "bug-05"),
 ("Apply a change to every report path", "bug-11"),
 ("Keep traversal state in a stack that tolerates nesting", "bug-12"),
 ("Don't assume a fixed parent depth", "bug-13"),
 ("Don't hand-roll declaration or lib file detection", "bug-15"),
 ("Don't report when the rule can't be confident", "pr_level-11"),
 ("Keep results independent of unrelated code aspects", "unlabeled_rule-35"),
 ("Resolve TODOs for unhandled syntax before merging", "bug-24"),
]),
"fixes": ("Fixers and suggestions", [
 ("Autofix only what keeps behavior and types; otherwise use a suggestion", "bug-06 pr_level-03 unlabeled_rule-16 pr_level-29"),
 ("Keep fixes small and comments intact", "pr_level-04 bug-08"),
 ("Prove fix output is valid and keeps operator precedence", "bug-07 testing-03"),
 ("Make fixers edit only the tokens that change", "unlabeled_rule-15"),
 ("Ask whether each report can have a fixer or suggestion", "bug-28 unlabeled_rule-17"),
 ("Give suggestions their own specific message", "bug-21"),
 ("Compute fix-only values inside the fix", "refactor-28"),
]),
"test-method": ("Testing: how tests should work", [
 ("Delete or flip each condition and confirm a test fails", "testing-00 unlabeled_rule-00 bug-00 pr_level-23 style-25"),
 ("Resolve every uncovered line with a test or by deleting it", "testing-39 unlabeled_rule-01 unlabeled_rule-02"),
 ("Keep test cases granular: one behavior each", "testing-41 pr_level-26"),
 ("Pair each behavior with valid and invalid cases", "testing-16"),
 ("Add near-miss valid cases one token away from a report", "testing-15"),
 ("Keep edge-case tests that already pass", "testing-35"),
 ("Get tests in place before judging the implementation", "pr_level-25"),
 ("Write test cases by hand instead of generating them", "testing-45"),
 ("Require a test with every rule logic change", "testing-48"),
 ("Target new logic instead of re-testing existing logic", "testing-46"),
 ("Assert exact, tight report ranges on the offending span", "testing-43 bug-20"),
 ("Assert message data in errors", "testing-42"),
 ("Run the rule on the repo and on real code, then reduce what you find", "pr_level-24 testing-38"),
 ("Turn scenarios named in the issue or PR into tests", "testing-37"),
 ("Move test cases instead of deleting them", "testing-47"),
 ("Keep snippets valid and type-clean, using `declare` for typed values", "testing-44 style-26"),
 ("Strip test code to what the case exercises", "refactor-32 testing-50"),
 ("Leave explanatory comments out of test cases", "testing-49 style-11 docs-33"),
 ("Use plain template literals for test code", "testing-51"),
]),
"test-cases": ("Testing: adversarial cases to generate", [
 ("Put comments and whitespace in every token gap", "testing-01 unlabeled_rule-14 testing-33"),
 ("Wrap matched nodes in redundant parentheses", "testing-02"),
 ("Nest the matched syntax one level deeper", "testing-18"),
 ("Test every way to spell a name", "testing-11"),
 ("Test every member of a node kind or operator list", "testing-14"),
 ("Test class and function expressions, not just declarations", "testing-12"),
 ("Test every class member modifier and kind", "testing-13"),
 ("Test every call-like expression", "testing-30"),
 ("Test spread and rest forms", "testing-26"),
 ("Test destructuring variants", "testing-27"),
 ("Test falsy and alternate numeric literals", "testing-10"),
 ("Test empty, missing, and single-item inputs", "testing-19"),
 ("Test several violations or uses in one target", "testing-20"),
 ("Test that same-named nested keys are ignored", "testing-17"),
 ("Test user-defined shadows and aliases of globals", "testing-24"),
 ("Test a name used in both type and value positions", "testing-29"),
 ("Test ambient contexts and namespaces", "testing-31"),
 ("Test every enum shape", "testing-09"),
 ("Test multi-code-unit characters in text measurements", "testing-34"),
 ("Test each option off, on, and combined", "testing-36"),
 ("Types: test every position that supplies a contextual type", "testing-23"),
 ("Types: test unions and intersections of the matched type", "testing-05"),
 ("Types: test every spelling of built-in collection types", "testing-08"),
 ("Types: test type operators and utility types", "testing-25"),
 ("Types: test `any`, `unknown`, `never`, `void`, and the error type", "testing-04"),
 ("Types: test constrained, defaulted, and curried type parameters", "testing-07"),
 ("Types: test inheritance chains and mixed heritage clauses", "testing-21"),
 ("Types: test overloaded signatures", "testing-22"),
 ("Types: test branded primitives", "testing-06"),
 ("Types: treat `this` parameters as a distinct parameter shape", "testing-28"),
 ("Types: test each nullish and void union combination", "testing-32"),
]),
"simplification": ("Simplification", [
 ("Delete any code that no test requires", "refactor-00"),
 ("Drop guards for states the AST or earlier code rules out", "refactor-01 unlabeled_rule-04 unlabeled_rule-03 refactor-27 refactor-30"),
 ("Encode guaranteed node shapes in types, not narrowing guards", "refactor-06 testing-40 bug-25"),
 ("Move shared logic into one utility instead of copying it", "refactor-03 pr_level-19 unlabeled_rule-40 style-31 style-29 refactor-04"),
 ("Use existing APIs instead of hand-written checks and caches", "refactor-09 refactor-10 refactor-12 unlabeled_rule-10"),
 ("Use public APIs and avoid TypeScript internals", "pr_level-37 unlabeled_rule-47"),
 ("Let selectors and visitors do the structural work", "refactor-14 unlabeled_rule-39 style-24"),
 ("Reduce conditions to the smallest equivalent expression", "refactor-05 style-18 unlabeled_rule-42 style-23"),
 ("Don't redo what a helper or earlier branch already handles", "refactor-07"),
 ("Weigh added lines against the rule's responsibilities", "pr_level-31 pr_level-01"),
 ("Give AI-assisted rule code a discerning simplification pass", "style-15"),
 ("Prefer plain, conventional code over clever code", "pr_level-30"),
 ("Delete comments that restate the code", "docs-01 style-10 unlabeled_rule-43 refactor-20"),
 ("Remove commented-out code and leftover notes", "unlabeled_rule-44"),
 ("Use optional chaining exactly where it is needed", "style-17"),
 ("Remove annotations and arguments TypeScript can infer", "style-14"),
 ("Skip locals that only alias a property or are used once", "style-13"),
 ("Prefer const expressions over `let` assigned later", "style-22"),
 ("Use concise modern syntax and array helpers", "unlabeled_rule-41 style-28 style-21"),
 ("Return early instead of nesting", "style-19"),
 ("Merge redundant state into one source of truth", "refactor-13"),
 ("Use Set or Map lookups instead of predicates and linear scans", "refactor-15"),
 ("Inline premature abstractions and speculative types", "refactor-18 style-16"),
 ("Extract long inline logic into named functions", "refactor-23 style-30"),
 ("Simplify helper signatures to what callers provide", "refactor-21 unlabeled_rule-12"),
 ("Compute a repeated value once", "refactor-31"),
 ("Omit meta fields that restate defaults", "unlabeled_rule-26"),
]),
"performance": ("Performance", [
 ("Run cheap AST checks before type information and expensive lookups", "pr_level-14 refactor-08 style-20 unlabeled_rule-36"),
 ("Stop traversing once the answer is known", "refactor-19 unlabeled_rule-38"),
 ("Hoist invariant work out of per-node visitors", "refactor-22 unlabeled_rule-37"),
]),
"design": ("Rule design and scope", [
 ("Ask whether the rule belongs in this plugin at all", "pr_level-00"),
 ("Widen the rule to everything its concept covers", "pr_level-09"),
 ("Start with the smaller rule and add surface on demand", "pr_level-07"),
 ("Send out-of-scope expansions to followup issues", "pr_level-10"),
 ("Judge the rule against the issue's purpose, not its algorithm", "pr_level-36"),
 ("Check for overlap with other rules, flags, and options", "pr_level-15 bug-22"),
 ("Leave formatting concerns to formatters", "pr_level-02"),
 ("Decide up front whether the rule needs type information", "pr_level-13"),
 ("State the semver impact of each behavior change", "pr_level-17 bug-23"),
 ("Place the rule in the right preset, staging big rules out first", "unlabeled_rule-31 pr_level-16"),
 ("Deprecate old rules and options instead of removing them", "pr_level-18"),
 ("Mirror the change across sibling rules and cases", "pr_level-21"),
 ("Keep extension rules in parity with the base rule", "pr_level-05"),
 ("Check the reference rule's implementation when porting", "unlabeled_rule-18"),
 ("Make report messages coach instead of adding logic", "pr_level-22"),
 ("Add an option where the rule would ban valid code", "pr_level-08"),
 ("Justify each option with a real use case", "bug-26 unlabeled_rule-28"),
 ("Avoid boundless or opinionated defaults", "pr_level-06"),
 ("Keep options minimal, object-shaped, and strict in schema", "refactor-17 bug-27 unlabeled_rule-27"),
 ("Use the shared specifier format for type and value allowlists", "pr_level-35 refactor-24 unlabeled_rule-29"),
 ("Fix the root cause instead of working around it", "refactor-16"),
 ("Keep rule-specific logic out of shared and core code", "refactor-25"),
 ("Keep unrelated changes out of a rule PR", "refactor-02 unlabeled_rule-46 style-09"),
 ("Keep rule meta in sync with what the rule does", "unlabeled_rule-25"),
]),
"messages": ("Report messages", [
 ("Make report messages say why the code is a problem", "unlabeled_rule-19 docs-07 bug-17"),
 ("Keep message IDs static, accurate, and few, using data for variation", "refactor-29 unlabeled_rule-23 style-05 unlabeled_rule-24"),
 ("Keep full serialized types out of messages", "unlabeled_rule-22"),
 ("Read the rendered message as an end user would", "unlabeled_rule-20"),
 ("Reuse the wording of sibling rules and messages", "unlabeled_rule-21"),
]),
"docs": ("Docs", [
 ("Ship and update docs with every rule, option, and behavior change", "pr_level-33 docs-16 unlabeled_rule-32 docs-37"),
 ("Give When Not To Use It a concrete scenario, and targeted disables first", "docs-00 docs-10"),
 ("Explain what the construct is and why it's a problem", "docs-15"),
 ("State exactly what the rule covers, and keep the page to that rule", "docs-05 docs-30"),
 ("Call out surprising limitations and fallbacks", "docs-22"),
 ("Document every option: why it exists, its values, and paired examples", "docs-13 docs-20 docs-38 docs-31 docs-29"),
 ("Define or replace jargon readers won't know", "docs-02"),
 ("Use the precise term, consistently", "docs-09"),
 ("Avoid prescriptive tone, absolutes, and words implying ease", "docs-11 docs-12 docs-14"),
 ("Strip LLM writing habits from rule docs", "docs-35"),
 ("Lead with essentials and move niche detail down", "docs-08"),
 ("Keep snippets clean, few, and free of distractions", "docs-04 docs-21"),
 ("Link authoritative external docs under Further Reading", "docs-03 docs-19"),
 ("Write descriptive link text", "docs-24"),
 ("Backtick code terms everywhere", "docs-06"),
 ("Prefer short sentences, one per line", "docs-26 style-27"),
 ("Use lists and tables for parallel information", "docs-27"),
 ("Match sibling rules' format and the project's description wording", "docs-18 docs-23"),
 ("Don't repeat auto-generated docs content", "docs-17"),
 ("Document only the delta on extension rules", "docs-28"),
 ("Keep the old name findable after a rename", "docs-32"),
 ("Omit the bare-string type specifier form", "docs-34"),
 ("Label new or experimental rules on the page", "docs-39"),
 ("Link TODOs, workarounds, and disables to an issue", "unlabeled_rule-45 docs-36"),
 ("Use JSDoc for overviews without restating types", "style-12"),
]),
"naming": ("Naming and consistency", [
 ("Name functions and helpers for exactly what they do", "style-02 refactor-11"),
 ("Treat option names as public API: precise, consistent, lenient when enabled", "pr_level-34 style-04 docs-25 unlabeled_rule-30"),
 ("Name rules for precisely what they check", "unlabeled_rule-33"),
 ("Match the names and constructs already in the file or project", "style-07 unlabeled_rule-34"),
 ("Drop words already implied by context", "style-03"),
 ("Replace placeholder and abbreviated names", "style-01 style-00"),
 ("Proofread identifiers for typos and bad word splits", "style-06"),
 ("Insert into sorted lists in sorted order", "style-08"),
 ("Use the canonical `ts` namespace for TypeScript imports", "unlabeled_rule-48"),
]),
"praise": ("What earns praise", [
 ("Clear, concise rule docs and examples", "style-38"),
 ("Thorough tests where each case tests one thing", "style-32"),
 ("Comments that explain non-obvious reasoning", "style-34"),
 ("Logic split into well-named helpers", "pr_level-32"),
 ("Rule code that is easy to read through", "style-35"),
 ("Changes that remove code and logic", "style-37"),
 ("Tricky syntax handled that the reviewer might have missed", "style-33"),
 ("Reuse of existing utilities and shared logic", "style-36"),
]),
}
used = collections.Counter(i for _, (_, g) in S.items() for _, ids in g for i in ids.split())
assert not (missing := set(P) - set(used)), sorted(missing)
assert not (extra := set(used) - set(P)), sorted(extra)
assert not (dupes := [i for i, n in used.items() if n > 1]), dupes

merged = []
for slug, (heading, groups) in S.items():
    lines = [f"# {heading}", ""]
    rows = []
    for title, ids in groups:
        ps = [P[i] for i in ids.split()]
        count = sum(p["count"] for p in ps)
        ex, seen = [], set()
        for rnd in range(4):  # round-robin so every source pattern gets represented
            for p in ps:
                if rnd < len(p["examples"]) and p["examples"][rnd]["url"] not in seen and len(ex) < 4:
                    ex.append(p["examples"][rnd]); seen.add(p["examples"][rnd]["url"])
        verify = next((p["verify"] for p in ps if p.get("verify")), None)
        scope = sorted({p["applies_to"] for p in ps})
        rows.append(dict(section=slug, title=title, count=count, sources=ids.split(), check=ps[0]["check"], why=ps[0]["why"],
                         verify=verify, automatable=any(p["automatable"] in (True, "true") for p in ps),
                         stale=any(p["possibly_stale"] for p in ps), applies_to=scope, examples=ex))
    rows.sort(key=lambda r: -r["count"])
    for r in rows:
        tags = [f"{r['count']} comments"] + (["automatable"] if r["automatable"] else []) + (["possibly stale"] if r["stale"] else [])
        if r["applies_to"] != ["any"]: tags.append(", ".join(r["applies_to"]))
        lines += [f"## {r['title']}", "", f"*{' · '.join(tags)}*", "", f"**Check:** {r['check']}", "", f"**Why:** {r['why']}", ""]
        if r["verify"]: lines += [f"**Verify:** {r['verify']}", ""]
        lines += ["**From past reviews:**", ""]
        lines += [f"- [\"{e['quote']}\"]({e['url']})" for e in r["examples"]] + [""]
    open(f"catalog/{slug}.md", "w").write("\n".join(lines))
    merged += rows
json.dump(merged, open("data/catalog.json", "w"), indent=1)
print("merged", len(P), "->", len(merged))
c = collections.Counter(); n = collections.Counter()
for r in merged: c[r["section"]] += 1; n[r["section"]] += r["count"]
for k in S: print(f"{c[k]:4d} patterns {n[k]:5d} comment-matches  {k}")
print("10+", sum(r["count"] >= 10 for r in merged), "5-9", sum(5 <= r["count"] < 10 for r in merged), "<5", sum(r["count"] < 5 for r in merged))
print("automatable", sum(r["automatable"] for r in merged), "stale", sum(r["stale"] for r in merged))
