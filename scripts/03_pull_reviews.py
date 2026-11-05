#!/usr/bin/env python3
"""Pull reviews, review threads, and PR comments for each rule PR. Resumable: skips URLs already saved."""
import json, os, subprocess, sys, threading, time
from concurrent.futures import ThreadPoolExecutor

IN, OUT, FAILED = "data/rule_prs.jsonl", "data/raw_reviews.jsonl", "data/raw_failed.jsonl"
QUERY = """
query($owner: String!, $name: String!, $number: Int!) {
  repository(owner: $owner, name: $name) { pullRequest(number: $number) {
    url baseRefOid headRefOid
    reviews(first: 100) { totalCount nodes {
      author { login } state body submittedAt url commit { oid }
    } }
    reviewThreads(first: 100) { totalCount nodes {
      isResolved isOutdated path line originalLine
      comments(first: 50) { nodes {
        author { login } body diffHunk createdAt url
        commit { oid } originalCommit { oid } replyTo { url }
      } }
    } }
    comments(first: 100) { totalCount nodes { author { login } body createdAt url } }
  } }
}"""

def fetch(pr):
    owner, name = pr["repository"]["nameWithOwner"].split("/")
    args = ["gh", "api", "graphql", "-f", f"query={QUERY}", "-f", f"owner={owner}",
            "-f", f"name={name}", "-F", f"number={pr['number']}"]
    err = ""
    for attempt in range(5):
        r = subprocess.run(args, capture_output=True, text=True)
        if r.returncode == 0:
            return json.loads(r.stdout)["data"]["repository"]["pullRequest"], None
        err = r.stderr[:300]
        time.sleep(10 * (attempt + 1))
    return None, err

done = set()
if os.path.exists(OUT):
    done = {json.loads(l)["url"] for l in open(OUT)}
prs = [json.loads(l) for l in open(IN)]
todo = [p for p in prs if p["url"] not in done]
print(f"{len(prs)} PRs, {len(todo)} to fetch", flush=True)
lock, count = threading.Lock(), [0]

def work(pr):
    data, err = fetch(pr)
    with lock:
        if data:
            with open(OUT, "a") as f:
                f.write(json.dumps(data) + "\n")
        else:
            with open(FAILED, "a") as f:
                f.write(json.dumps({"url": pr["url"], "error": err}) + "\n")
        count[0] += 1
        if count[0] % 100 == 0:
            print(count[0], flush=True)

with ThreadPoolExecutor(3) as ex:
    list(ex.map(work, todo))
print("done", flush=True)
