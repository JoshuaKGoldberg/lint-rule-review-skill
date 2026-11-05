#!/usr/bin/env python3
"""For each eval PR, save what a reviewer saw at the reviewed commit, and keep the real comments apart as the answer key."""
import collections, json, os, subprocess, sys
SPLIT, PRS = sys.argv[1], sys.argv[2:]   # e.g. holdout_older typescript-eslint/typescript-eslint#12280
H = [json.loads(l) for l in open(f"data/holdout/{SPLIT}.jsonl")]

def gh(path, accept=None):
    a = ["gh", "api", path] + (["-H", f"Accept: {accept}"] if accept else [])
    r = subprocess.run(a, capture_output=True, text=True)
    return r.stdout if r.returncode == 0 else None

for spec in PRS:
    repo, n = spec.split("#")
    xs = [x for x in H if x["pr"].endswith(f"{repo}/pull/{n}")]
    inline = [x for x in xs if x["source"] == "inline" and x["is_thread_start"]]
    sha = collections.Counter(x["reviewed_sha"] for x in inline if x.get("reviewed_sha")).most_common(1)[0][0]
    key = [x for x in inline if x.get("reviewed_sha") == sha]
    bodies = [x for x in xs if x["source"] == "review_body" and x.get("reviewed_sha") == sha]
    d = f"eval/{repo.split('/')[1]}-{n}"; os.makedirs(f"{d}/files", exist_ok=True)
    meta = json.loads(gh(f"repos/{repo}/pulls/{n}"))
    diff = gh(f"repos/{repo}/compare/{xs[0]['base_sha']}...{sha}", "application/vnd.github.diff")
    if diff is None:
        print("SKIP no diff", spec); continue
    open(f"{d}/pr.diff", "w").write(diff)
    open(f"{d}/description.md", "w").write(f"# {meta['title']}\n\n{meta.get('body') or ''}\n")
    cmp = json.loads(gh(f"repos/{repo}/compare/{xs[0]['base_sha']}...{sha}"))
    names = [f["filename"] for f in cmp["files"] if f["status"] != "removed"]
    for f in names[:12]:
        c = gh(f"repos/{repo}/contents/{f}?ref={sha}", "application/vnd.github.raw")
        if c is not None: open(f"{d}/files/{f.replace('/', '__')}", "w").write(c)
    os.makedirs("data/eval_keys", exist_ok=True)
    json.dump({"pr": spec, "sha": sha, "comments": [{"id": i, "path": x["path"], "line": x["line"], "label": x["label"], "body": x["body"]} for i, x in enumerate(key)],
               "review_bodies": [{"state": x.get("state"), "body": x["body"]} for x in bodies]},
              open(f"data/eval_keys/{repo.split('/')[1]}-{n}.json", "w"), indent=1)
    print(spec, sha[:9], "key comments", len(key), "files", len(names), "diff", len(diff))
