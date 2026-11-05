#!/usr/bin/env python3
"""Drop praise, bot commands, and unsubmitted drafts; extract the [Label] prefixes; mark hold-out PRs."""
import json, re, subprocess, collections
CUTOFF = "2026-07"  # PRs created after the model's June 2026 knowledge cutoff
R = [json.loads(l) for l in open("data/corpus.jsonl")]

# Inline comments belonging to unsubmitted reviews
raw = [json.loads(l) for l in open("data/raw_reviews.jsonl")]
pending_prs = [r["url"] for r in raw if any(v["state"] == "PENDING" and (v.get("author") or {}).get("login") == "JoshuaKGoldberg" for v in r["reviews"]["nodes"])]
Q = """query($owner:String!,$name:String!,$number:Int!){repository(owner:$owner,name:$name){pullRequest(number:$number){
  reviews(first:20,states:PENDING){nodes{comments(first:100){nodes{url}}}}}}}"""
pending_urls = set()
for u in pending_prs:
    m = re.match(r"https://github.com/([^/]+)/([^/]+)/pull/(\d+)", u)
    out = subprocess.run(["gh","api","graphql","-f",f"query={Q}","-f",f"owner={m[1]}","-f",f"name={m[2]}","-F",f"number={m[3]}"],capture_output=True,text=True,check=True).stdout
    for v in json.loads(out)["data"]["repository"]["pullRequest"]["reviews"]["nodes"]:
        pending_urls |= {c["url"] for c in v["comments"]["nodes"]}

BOT = re.compile(r"^\s*@(copilot|all-contributors|dependabot|renovate|coderabbitai|github-actions)\b", re.I)
LABEL = re.compile(r"^\s*(?:\*\*)?\[([A-Za-z][A-Za-z /-]{1,24})\](?:\*\*)?")
def strip_noise(b):
    b = re.sub(r"```suggestion.*?```", " SUGGESTION ", b, flags=re.S)
    return re.sub(r"[^\w\s`]", "", b, flags=re.UNICODE).strip()
PRAISE = re.compile(r"^(lgtm|thanks?|thank you|swell|super|great|nice|yay|awesome|progress|cool|perfect|looks good|sgtm|shipit|ack|done|sounds good|good catch|wonderful|lovely)\b", re.I)

reasons, kept = collections.Counter(), []
for x in R:
    b = x["body"]
    label = LABEL.match(b)
    has_code = "```" in b or "`" in b
    if x["url"] in pending_urls: reasons["unsubmitted draft"] += 1; continue
    if BOT.match(b): reasons["bot command"] += 1; continue
    if not label and not has_code:
        s = strip_noise(b)
        if len(s) < 25 or (PRAISE.match(s) and len(s) < 60):
            reasons["praise or too short"] += 1; continue
    x["label"] = label[1].strip().lower() if label else None
    x["holdout"] = x["pr_created"] >= CUTOFF
    kept.append(x)

with open("data/corpus_substantive.jsonl", "w") as f:
    for x in kept: f.write(json.dumps(x) + "\n")

C = collections.Counter
print("pending PRs", len(pending_prs), "pending inline urls", len(pending_urls))
print("dropped", dict(reasons), "| kept", len(kept), "of", len(R))
print("source", C(x["source"] for x in kept).most_common())
print("framework", C(x["framework"] for x in kept).most_common())
print("file_kind", C(x["file_kind"] for x in kept).most_common())
print("labeled", sum(bool(x["label"]) for x in kept))
print("labels", C(x["label"] for x in kept if x["label"]).most_common(25))
ho = [x for x in kept if x["holdout"]]
print("holdout comments", len(ho), "PRs", len({x["pr"] for x in ho}), C(x["framework"] for x in ho).most_common())
print("holdout inline on rule/test", sum(x["source"]=="inline" and x["file_kind"] in("rule","test") for x in ho))
print("first-labeled year", min((x["created"][:7] for x in kept if x["label"]), default=None))
