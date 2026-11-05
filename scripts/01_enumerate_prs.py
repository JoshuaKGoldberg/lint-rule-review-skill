#!/usr/bin/env python3
"""Enumerate every PR reviewed by LOGIN (not authored by them), with changed file paths.
GitHub search caps at 1000 results per query, so date windows are split adaptively."""
import json, subprocess, sys, time
from datetime import date, timedelta

LOGIN = "JoshuaKGoldberg"
OUT = "data/reviewed_prs.jsonl"
QUERY = """
query($q: String!, $after: String) {
  search(query: $q, type: ISSUE, first: 25, after: $after) {
    issueCount
    pageInfo { hasNextPage endCursor }
    nodes { ... on PullRequest {
      number title url state createdAt mergedAt additions deletions
      author { login }
      repository { nameWithOwner isPrivate }
      files(first: 100) { totalCount nodes { path } }
    } }
  }
}"""

blocked = [0]

def gql(q, after=None):
    args = ["gh", "api", "graphql", "-f", f"query={QUERY}", "-f", f"q={q}"]
    if after:
        args += ["-f", f"after={after}"]
    for attempt in range(6):
        r = subprocess.run(args, capture_output=True, text=True)
        # SAML-protected orgs come back as null nodes plus FORBIDDEN errors, and gh exits 1.
        # Keep the nodes this token may read and count the ones it may not.
        try:
            body = json.loads(r.stdout)
        except json.JSONDecodeError:
            body = {}
        search = (body.get("data") or {}).get("search")
        errors = body.get("errors", [])
        if search and all(e.get("type") == "FORBIDDEN" for e in errors):
            blocked[0] += len(errors)
            return search
        print(f"retry {attempt}: {r.stderr[:200]}", file=sys.stderr, flush=True)
        time.sleep(5 * (attempt + 1))
    raise SystemExit(f"failed: {q}")

def q_for(a, b):
    return f"reviewed-by:{LOGIN} is:pr -author:{LOGIN} created:{a.isoformat()}..{b.isoformat()}"

seen = set()
def walk(a, b, out):
    first = gql(q_for(a, b))
    n = first["issueCount"]
    if n > 950 and a < b:
        mid = a + (b - a) // 2
        walk(a, mid, out)
        walk(mid + timedelta(days=1), b, out)
        return
    print(f"{a}..{b}: {n}", flush=True)
    page = first
    while True:
        for pr in page["nodes"]:
            if pr and pr["url"] not in seen:
                seen.add(pr["url"])
                out.write(json.dumps(pr) + "\n")
        out.flush()
        if not page["pageInfo"]["hasNextPage"]:
            break
        page = gql(q_for(a, b), page["pageInfo"]["endCursor"])

with open(OUT, "w") as out:
    walk(date(2014, 1, 1), date.today(), out)
print(f"done: {len(seen)} PRs readable, {blocked[0]} node reads blocked by SAML")
