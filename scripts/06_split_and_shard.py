#!/usr/bin/env python3
"""Drop TSLint, reserve hold-out PRs, and write the remaining comments into category shards."""
import collections, hashlib, json, os, re
R = [json.loads(l) for l in open("data/corpus_substantive.jsonl")]
R = [x for x in R if x["framework"] != "tslint"]

# Hold-out A: post-cutoff PRs. Hold-out B: a stable ~12% of earlier PRs with inline rule/test comments.
def bucket(pr): return int(hashlib.sha256(pr.encode()).hexdigest(), 16) % 100
eligible = {x["pr"] for x in R if x["source"] == "inline" and x["file_kind"] in ("rule", "test") and x["is_thread_start"]}
for x in R:
    x["split"] = "holdout_recent" if x["holdout"] else ("holdout_older" if x["pr"] in eligible and bucket(x["pr"]) < 12 else "train")

os.makedirs("data/holdout", exist_ok=True); os.makedirs("data/shards", exist_ok=True)
for name in ("holdout_recent", "holdout_older"):
    with open(f"data/holdout/{name}.jsonl", "w") as f:
        for x in R:
            if x["split"] == name: f.write(json.dumps(x) + "\n")

GROUPS = {"bug": {"bug", "functionality", "feature", "request"},
          "testing": {"testing", "tests"},
          "refactor": {"refactor", "cleanup", "performance", "suggestion"},
          "docs": {"docs", "proofreading", "typo"},
          "style": {"style", "naming", "nit", "nitpick", "nitpicking", "formatting"},
          "positive": {"praise", "non-actionable", "aside"},
          "question": {"question", "followup"}}
L2G = {l: g for g, ls in GROUPS.items() for l in ls}

def tail(h, n=14):
    return "\n".join((h or "").split("\n")[-n:])

shards = collections.defaultdict(list)
for i, x in enumerate(R):
    if x["split"] != "train": continue
    if x["source"] == "inline" and not x["is_thread_start"] and not x["label"]: continue  # replies stay as thread context
    if x["label"]: g = L2G.get(x["label"], "other_labeled")
    elif x["source"] == "inline": g = f"unlabeled_{x['file_kind']}"
    else: g = "unlabeled_pr_level"
    rec = {"url": x["url"], "repo": x["repo"], "path": x.get("path"), "label": x["label"], "framework": x["framework"],
           "body": x["body"][:1800], "code_moved_on": x.get("code_moved_on")}
    if x["source"] == "inline":
        rec["diff_tail"] = tail(x["diff_hunk"])
        rec["replies"] = [f"{t['author']}: {t['body'][:300]}" for t in x["thread"][1:4]]
    shards[g].append(rec)

for g, rs in shards.items():
    with open(f"data/shards/{g}.jsonl", "w") as f:
        for r in rs: f.write(json.dumps(r) + "\n")

C = collections.Counter
print("split", C(x["split"] for x in R).most_common())
for s in ("holdout_recent", "holdout_older"):
    h = [x for x in R if x["split"] == s]
    print(s, "PRs", len({x["pr"] for x in h}), "inline rule/test starts", sum(x["source"]=="inline" and x["file_kind"] in("rule","test") and x["is_thread_start"] for x in h))
for g, rs in sorted(shards.items(), key=lambda kv: -len(kv[1])):
    print(f"{len(rs):5d} {sum(len(json.dumps(r)) for r in rs)//1024:5d}KB {g}")
