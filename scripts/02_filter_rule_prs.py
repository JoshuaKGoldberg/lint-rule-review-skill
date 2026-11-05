#!/usr/bin/env python3
"""Keep PRs that change lint rule implementation files; report what the filter matched."""
import json, re, collections
RULE = re.compile(r"(^|/)(rules?|lib/rules|src/rules)/[^/]+(/[^/]+)*\.(ts|tsx|js|mjs|cjs|mts|cts)$", re.I)
EXCLUDE = re.compile(r"(\.test\.|\.spec\.|/tests?/|__tests__|/fixtures?/|\.d\.ts$|/node_modules/|(^|/)docs?/)", re.I)
prs = [json.loads(l) for l in open("data/reviewed_prs.jsonl")]
kept, truncated = [], 0
for p in prs:
    paths = [f["path"] for f in p["files"]["nodes"]]
    hits = [x for x in paths if RULE.search(x) and not EXCLUDE.search(x)]
    if p["files"]["totalCount"] > 100: truncated += 1
    if hits:
        p["rule_files"] = hits
        kept.append(p)
with open("data/rule_prs.jsonl", "w") as f:
    for p in kept: f.write(json.dumps(p) + "\n")
print("total", len(prs), "rule PRs", len(kept), "PRs with >100 files (paths truncated)", truncated)
c = collections.Counter(p["repository"]["nameWithOwner"] for p in kept)
print("repos", len(c))
for r, n in c.most_common(40): print(f"{n:5d} {r}")
print("private rule PRs", sum(p["repository"]["isPrivate"] for p in kept))
y = collections.Counter(p["createdAt"][:4] for p in kept)
print(sorted(y.items()))
print("after 2026-06:", sum(p["createdAt"] >= "2026-07" for p in kept))
