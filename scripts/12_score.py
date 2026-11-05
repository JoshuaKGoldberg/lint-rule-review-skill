#!/usr/bin/env python3
"""Unblind grades and print recall, extras, and voice per configuration."""
import collections, glob, json, os, sys
it = sys.argv[1]
tot = {c: collections.Counter() for c in ("skill", "plain")}
bykind = {c: collections.Counter() for c in ("skill", "plain")}
kinds = collections.Counter()
for f in sorted(glob.glob(f"eval/*/grading/{it}/grade.json")):
    n = f.split("/")[1]
    m = json.load(open(f"data/eval_maps/{n}-{it}.json"))
    g = json.load(open(f))
    row = {}
    for slot, cfg in m.items():
        c = collections.Counter(k[slot] for k in g["key"])
        e = g["extras"][slot]
        row[cfg] = f"{c['found']}F {c['partial']}P {c['missed']}M | +{e['verified']}v {e['plausible']}p {e['noise']}n | voice {g['voice'][slot]}"
        t = tot[cfg]; t.update(c); t["n"] += len(g["key"]); t["voice"] += g["voice"][slot]; t["prs"] += 1
        for x in ("verified", "plausible", "noise"): t[x] += e[x]
        for k in g["key"]:
            bykind[cfg][(k["kind"], k[slot])] += 1
    for k in g["key"]: kinds[k["kind"]] += 1
    print(f"{n:26s} skill {row['skill']}\n{'':26s} plain {row['plain']}")
for c, t in tot.items():
    if t["n"]:
        print(f"{c}: found {t['found']}/{t['n']} ({t['found']/t['n']:.0%}), found+partial {(t['found']+t['partial'])/t['n']:.0%}, extras {t['verified']}v {t['plausible']}p {t['noise']}n, voice {t['voice']/t['prs']:.1f}")
for k in kinds:
    print(k, kinds[k], {c: f"{bykind[c][(k,'found')]}F/{bykind[c][(k,'partial')]}P" for c in tot})
