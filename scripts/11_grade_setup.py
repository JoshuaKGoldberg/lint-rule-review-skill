#!/usr/bin/env python3
"""Blind a pair of reviews for grading: strips labels, shuffles to A/B, and keeps the mapping away from the grader."""
import json, os, random, re, sys
iter_skill, iter_plain, names = sys.argv[1], sys.argv[2], sys.argv[3:]
def clean(text):
    # Remove the parts that would reveal which configuration wrote the review.
    text = re.sub(r"(?im)^.*(skill|mutate-conditions|mutation script|harness).*$", "", text)
    return text
rng = random.Random(iter_skill + "".join(names))
for n in names:
    d = f"eval/{n}/grading/{iter_skill}"; os.makedirs(d, exist_ok=True)
    src = {"skill": f"eval/{n}/runs/{iter_skill}-skill.md", "plain": f"eval/{n}/runs/{iter_plain}-plain.md"}
    order = ["skill", "plain"]; rng.shuffle(order)
    for slot, cfg in zip("AB", order):
        open(f"{d}/{slot}.md", "w").write(clean(open(src[cfg]).read()))
    key = json.load(open(f"data/eval_keys/{n}.json"))
    json.dump({"comments": key["comments"], "review_bodies": key["review_bodies"]}, open(f"{d}/key.json", "w"), indent=1)
    os.makedirs(f"data/eval_maps", exist_ok=True)
    json.dump(dict(zip("AB", order)), open(f"data/eval_maps/{n}-{iter_skill}.json", "w"))
    print(n, "ok")
