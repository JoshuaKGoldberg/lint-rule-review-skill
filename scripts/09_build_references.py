#!/usr/bin/env python3
"""Turn the catalog into compact skill reference files: the check, how to verify it, and one or two real quotes."""
import collections, json
TITLES = {"bugs": "Bugs", "fixes": "Fixers and suggestions", "test-method": "Test quality", "test-cases": "Adversarial test cases",
          "simplification": "Simplification", "performance": "Performance", "design": "Rule design and scope",
          "messages": "Report messages", "docs": "Docs pages", "naming": "Naming and consistency"}
INTRO = "Ordered by how often this came up in past reviews. The number is rough weight, not a score."
C = json.load(open("data/catalog.json"))
by = collections.defaultdict(list)
for r in C: by[r["section"]].append(r)
for slug, title in TITLES.items():
    out = [f"# {title}", "", INTRO, ""]
    rows = sorted(by[slug], key=lambda r: -r["count"])
    if len(rows) > 15:
        out += ["## Contents", ""] + [f"- {r['title']}" for r in rows] + [""]
    for r in rows:
        tags = [str(r["count"])]
        if r["stale"]: tags.append("possibly stale: confirm against current code")
        if "any" not in r["applies_to"]: tags.append("/".join(r["applies_to"]))
        out += [f"## {r['title']}", "", f"({'; '.join(tags)})", "", r["check"], "", f"Why: {r['why']}", ""]
        if r["verify"]: out += [f"Verify: {r['verify']}", ""]
        out += [f"> {e['quote']}" + "\n" for e in r["examples"][:2]]
    open(f"skills/lint-rule-review-skill/references/{slug}.md", "w").write("\n".join(out))
praise = sorted(by["praise"], key=lambda r: -r["count"])
voice = open("catalog/review-voice.md").read()
voice += "\n## What earns praise\n\n" + "\n".join(f"- {r['title']}" for r in praise) + "\n"
open("skills/lint-rule-review-skill/references/review-voice.md", "w").write(voice)
# index.md is written by hand, so catch any title that has drifted from it.
index = open("skills/lint-rule-review-skill/references/index.md").read()
missing = [r["title"] for r in C if r["section"] in TITLES and r["title"] not in index]
assert not missing, missing
