#!/usr/bin/env python3
"""Check every cited URL and quote against the training shards, and confirm no hold-out comment was cited."""
import collections, glob, json, re
body = {}
for f in glob.glob("data/shards/*.jsonl"):
    for l in open(f):
        r = json.loads(l); body[r["url"]] = r
hold = set()
for f in glob.glob("data/holdout/*.jsonl"):
    for l in open(f): hold.add(json.loads(l)["url"])
norm = lambda s: re.sub(r"\s+", " ", s).strip().lower()
allp, tot = [], collections.Counter()
for f in sorted(glob.glob("data/patterns/*.json")):
    d = json.load(open(f)); c = collections.Counter()
    for i, p in enumerate(d["patterns"]):
        p["id"] = f"{d['shard']}-{i:02d}"; p["shard"] = d["shard"]; allp.append(p)
        if len(p["examples"]) < 2: c["under 2 examples"] += 1
        for e in p["examples"]:
            c["examples"] += 1
            if e["url"] in hold: c["HOLDOUT LEAK"] += 1
            r = body.get(e["url"])
            if not r: c["bad url"] += 1; continue
            src = norm(r["body"] + " " + " ".join(r.get("replies") or []))
            q = norm(e["quote"])
            parts = [x.strip() for x in re.split(r"\.\.\.|…", q) if x.strip()]
            if not all(x in src for x in parts): c["quote mismatch"] += 1; e["_bad"] = True
    print(f"{d['shard']:16s} read {d['records_read']:5d} patterns {len(d['patterns']):3d} {dict(c)}")
    tot.update(c)
print("TOTAL patterns", len(allp), dict(tot))
print("kinds", collections.Counter(p["kind"] for p in allp).most_common())
print("applies_to", collections.Counter(p["applies_to"] for p in allp).most_common())
print("stale", sum(bool(p["possibly_stale"]) for p in allp), "automatable", sum(p["automatable"] in (True, "true") for p in allp))
json.dump(allp, open("data/patterns_all.json", "w"), indent=1)
for p in allp:
    for e in p["examples"]:
        if e.get("_bad"): print("BAD", p["id"], e["url"][-30:], repr(e["quote"][:90]))
