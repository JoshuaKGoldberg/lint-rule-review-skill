#!/usr/bin/env python3
"""Flatten raw reviews into one record per comment by LOGIN, tagged by framework and file kind."""
import json, re, collections
LOGIN = "JoshuaKGoldberg"
NOT_LINT_RULES = {"typescript-eslint/tslint-to-eslint-config", "octoguide/bot"}  # 'rules/' dirs that aren't lint rules
FRAMEWORK = {"palantir/tslint": "tslint", "flint-fyi/flint": "flint"}
TEST = re.compile(r"(\.test\.|\.spec\.|/tests?/|__tests__)", re.I)
DOC = re.compile(r"\.mdx?$", re.I)
RULE = re.compile(r"(^|/)rules?/", re.I)

meta = {}
for l in open("data/rule_prs.jsonl"):
    p = json.loads(l); meta[p["url"]] = p

def kind(path):
    if not path: return "pr"
    if DOC.search(path): return "docs"
    if TEST.search(path): return "test"
    if RULE.search(path): return "rule"
    return "other"

def author(n):
    return (n.get("author") or {}).get("login")

records, skipped, pending = [], 0, 0
overflow = collections.Counter()
for l in open("data/raw_reviews.jsonl"):
    r = json.loads(l)
    p = meta[r["url"]]
    repo = p["repository"]["nameWithOwner"]
    if repo in NOT_LINT_RULES:
        skipped += 1
        continue
    if r["reviews"]["totalCount"] > 100: overflow["reviews"] += 1
    if r["reviewThreads"]["totalCount"] > 100: overflow["threads"] += 1
    if r["comments"]["totalCount"] > 100: overflow["comments"] += 1
    base = dict(repo=repo, pr=r["url"], pr_title=p["title"], pr_author=author(p), pr_merged=bool(p["mergedAt"]),
                pr_created=p["createdAt"], framework=FRAMEWORK.get(repo, "eslint"), rule_files=p["rule_files"],
                base_sha=r["baseRefOid"], head_sha=r["headRefOid"])
    for t in r["reviewThreads"]["nodes"]:
        cs = t["comments"]["nodes"]
        for i, c in enumerate(cs):
            if author(c) != LOGIN or not c["body"].strip(): continue
            records.append({**base, "source": "inline", "is_thread_start": i == 0, "path": t["path"],
                "file_kind": kind(t["path"]), "line": t["originalLine"], "body": c["body"], "url": c["url"],
                "created": c["createdAt"], "diff_hunk": c["diffHunk"],
                "reviewed_sha": (c.get("originalCommit") or {}).get("oid"),
                "code_moved_on": t["isOutdated"], "resolved": t["isResolved"],
                "thread": [{"author": author(x), "body": x["body"]} for x in cs]})
    for v in r["reviews"]["nodes"]:
        if author(v) == LOGIN and v["state"] == "PENDING":
            pending += 1  # never submitted: an unpublished draft, not review history
        elif author(v) == LOGIN and v["body"].strip():
            records.append({**base, "source": "review_body", "state": v["state"], "file_kind": "pr",
                "body": v["body"], "url": v["url"], "created": v["submittedAt"],
                "reviewed_sha": (v.get("commit") or {}).get("oid")})
    for c in r["comments"]["nodes"]:
        if author(c) == LOGIN and c["body"].strip():
            records.append({**base, "source": "pr_comment", "file_kind": "pr", "body": c["body"],
                "url": c["url"], "created": c["createdAt"]})

with open("data/corpus.jsonl", "w") as f:
    for x in records: f.write(json.dumps(x) + "\n")

C = collections.Counter
print("pending reviews excluded", pending)
print("records", len(records), "| PRs dropped as non-lint", skipped, "| truncated connections", dict(overflow))
print("PRs with >=1 comment", len({x['pr'] for x in records}))
print("source", C(x["source"] for x in records).most_common())
print("framework", C(x["framework"] for x in records).most_common())
print("file_kind", C(x["file_kind"] for x in records).most_common())
inl = [x for x in records if x["source"] == "inline"]
print("inline thread starts", sum(x["is_thread_start"] for x in inl), "| replies", sum(not x["is_thread_start"] for x in inl))
print("inline code moved on", sum(x["code_moved_on"] for x in inl), "| resolved", sum(x["resolved"] for x in inl))
print("repo", C(x["repo"] for x in records).most_common(10))
print("year", sorted(C(x["created"][:4] for x in records).items()))
print("post-cutoff (>=2026-07) records", sum(x["created"] >= "2026-07" for x in records),
      "PRs", len({x['pr'] for x in records if x['pr_created'] >= '2026-07'}))
short = sum(len(x["body"]) < 40 for x in records)
print("bodies under 40 chars", short)
