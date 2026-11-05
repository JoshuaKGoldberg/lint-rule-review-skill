# Lint rule review pattern catalog (draft)

178 patterns distilled from 3,092 review comments on ESLint, typescript-eslint, and Flint rule PRs.
Every pattern cites real comments. Counts are hand-assigned by the clustering agents and can overlap, so treat them as rough weight.

| File | Patterns |
| --- | ---: |
| [bugs.md](bugs.md) | 20 |
| [fixes.md](fixes.md) | 7 |
| [test-method.md](test-method.md) | 19 |
| [test-cases.md](test-cases.md) | 31 |
| [simplification.md](simplification.md) | 27 |
| [performance.md](performance.md) | 3 |
| [design.md](design.md) | 24 |
| [messages.md](messages.md) | 5 |
| [docs.md](docs.md) | 25 |
| [naming.md](naming.md) | 9 |
| [praise.md](praise.md) | 8 |

[review-voice.md](review-voice.md) covers how the output should read.

## Decisions for the curator

- **Widen the rule or send it to a followup:** both appear. The usual test is whether the gap is the same concept as the rule and whether a real user asked for it.
- **Add an option or drop it:** same split, and same usual test.
- **Contested positions:** the `in` guidance, `esquery` use, schema shape, and `import ts` all drew pushback from other maintainers.
- **Project-specific advice:** rule description verbs differ by project, and much API advice is typescript-eslint-specific even where tagged `any`.
- **Possibly stale:** 3 patterns are flagged, including the advice on assignability checks, which a later comment on PR 11918 dates.
- **Thin support:** patterns under 5 comments deserve a harder look. "Resolve TODOs for unhandled syntax before merging" is the weakest one spot-checked.
- **Tooling candidates:** 42 patterns are marked automatable and may belong in a lint rule instead of the skill.
