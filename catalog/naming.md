# Naming and consistency

## Treat option names as public API: precise, consistent, lenient when enabled

*19 comments*

**Check:** Review each option name for brevity and accuracy, and rule names against the family's prefix convention. Allow time for maintainers to suggest alternatives before merge.

**Why:** Naming alone is enough to request changes even when the logic is done, and PRs are held open so other maintainers can weigh in on an API name.

**Verify:** Compare the new option against the rule's other options and neighboring rules' schemas for plurality and casing.

**From your reviews:**

- ["Just requesting changes on the name, since `onlyTrue` is a lot cleaner IMO."](https://github.com/typescript-eslint/typescript-eslint/pull/10639#pullrequestreview-2561099367)
- ["This is a little imprecise - the option is directed towards superfluous/unnecessary defaults on already-exhaustive switches"](https://github.com/typescript-eslint/typescript-eslint/pull/7539#discussion_r1417891329)
- ["This option name reads to me like it's allowlisting `if` statements. As in, turning this on tells the rule to ignore them. The opposite of what it does!"](https://github.com/typescript-eslint/typescript-eslint/pull/10137#discussion_r1854370102)
- ["IME it's confusing for folks to have the default value for something be truthy."](https://github.com/typescript-eslint/typescript-eslint/pull/5728#discussion_r985669323)

## Name functions and helpers for exactly what they do

*15 comments*

**Check:** Compare each helper's name with its body. Flag vague `isExpected*` names, `try*` names on functions that never throw, `find*` names that hide the direction of the search, names claiming a property the code cannot know (`isPure`), and names that omit a side effect such as reporting.

**Why:** Mismatched names confused the reviewer on first read and cost a re-read. Names should say explicitly what the code does without needing the full intent first.

**From your reviews:**

- ["my instinct for things named _"try*"_ is that they literally use a `try`/`catch` and/or may throw an error. This doesn't."](https://github.com/typescript-eslint/typescript-eslint/pull/6881#discussion_r1163226929)
- ["Nit: a more precise name..."](https://github.com/typescript-eslint/typescript-eslint/pull/4965#discussion_r894992383)
- ["I'm finding hard to read the code with the naming convention of `isExpected*`. It's a little vague - what does _'expected'_ mean?"](https://github.com/typescript-eslint/typescript-eslint/pull/6411#discussion_r1267188522)
- ["Nit: this name is a little non-specific."](https://github.com/typescript-eslint/typescript-eslint/pull/4965#discussion_r894992327)

## Match the names and constructs already in the file or project

*12 comments*

**Check:** Compare new code with neighboring rules: import aliases (`tsutils`, not `tsUtils` or `tsApiUtils`), loop style in the same file, comment capitalization, and whether any other rule does the same thing.

**Why:** Switching styles in a file makes it hard to mentally map between the two. "No other rule does this" is itself a reason to change.

**Verify:** Search the repo for the construct, for example grep -rn "from 'ts-api-utils'" on the rules folder, and compare with the new code.

**From your reviews:**

- ["If not, please stick with the existing style in a file/project. It's hard to mentally map between two."](https://github.com/typescript-eslint/typescript-eslint/pull/8282#discussion_r1476301824)
- ["We generally try to stay away from acronyms when possible."](https://github.com/typescript-eslint/typescript-eslint/pull/4924#discussion_r872746386)
- ["Everywhere else lowercases this:"](https://github.com/typescript-eslint/typescript-eslint/pull/8383#discussion_r1500063147)
- ["Request: type out the word explicitly in the name, so it's clear."](https://github.com/typescript-eslint/typescript-eslint/pull/6211#discussion_r1083381981)

## Replace placeholder and abbreviated names

*10 comments · automatable*

**Check:** Flag names that carry no meaning in already-complex logic: `iterator`, `key`/`value`, `result`, numbered suffixes like `comments1`/`comments2`, generic `node`, or `fn`/`rec`. A reader should not have to scan other code to learn what the value is.

**Why:** Rule logic is already complex, so vague names force the reader to scan back and forth or deduce a role from scratch each time.

**Verify:** Search the changed rule for short identifiers: grep -nE '\b(fn|decl|num|uniq|prev|ctor)[A-Z]?' on the rule file.

**From your reviews:**

- ["This code is already kind of complex, let's stick with informative names."](https://github.com/typescript-eslint/typescript-eslint/pull/8282#discussion_r1474803261)
- ["I'm not a fan of abbreviating names in code. It makes it harder to read & understand because you have to memorize all sorts of common abbreviations"](https://github.com/typescript-eslint/typescript-eslint/pull/5728#discussion_r1146351123)
- ["`fn` and `rec` aren't super informative names. I had a hard time figuring out what this does without scanning back and forth through other code."](https://github.com/typescript-eslint/typescript-eslint/pull/8389#discussion_r1500166234)
- ["I find abbreviations hard to keep track of in my head, and have heard from non-native English speakers that it's harder for them in particular."](https://github.com/typescript-eslint/typescript-eslint/pull/8173#discussion_r1477515319)

## Drop words already implied by context

*7 comments*

**Check:** Remove name segments the surrounding context already states: `Sorting` in an option of a sort rule, a `Map` suffix on a map, `check*` before `should*`, `utils` in a file inside a utils folder, or a property repeating its parent's name.

**Why:** Implied words add length without information, and repeated terms like two nested things both called the same are confusing to new readers.

**From your reviews:**

- ["I think _"Sorting"_ is implied by the rule. IMO it'd be a little cleaner to drop it:"](https://github.com/typescript-eslint/typescript-eslint/pull/8760#discussion_r1556186685)
- ["this is already in a utils folder. Every file here is some kind of utils."](https://github.com/flint-fyi/flint/pull/1758#discussion_r2696582117)
- ["I think it's implied by the `should` & the functions being used in a logical location."](https://github.com/typescript-eslint/typescript-eslint/pull/8383#discussion_r1483296319)
- ["this nesting of two things both called "Vue services" is odd. I think it'll be confusing to people trying to read & understand them."](https://github.com/flint-fyi/flint/pull/2316#discussion_r2915124007)

## Insert into sorted lists in sorted order

*5 comments · automatable*

**Check:** When a change adds to a union, map, rule list, `messages` object, or docs list, check whether the entries were alphabetical and keep them so.

**Why:** Alphabetical lists are easier to scan through. The reviewer notices breakage and explicitly praises authors who preserve the order.

**Verify:** Diff the list against a sorted copy of itself.

**From your reviews:**

- ["Super nitpicky, but - these _were_ in alphabetical order. Up for alphabetizing?"](https://github.com/typescript-eslint/typescript-eslint/pull/9297#discussion_r1653878852)
- ["The list is in alphabetical order to make it easier to scan through. Let's move this to the top."](https://github.com/typescript-eslint/typescript-eslint/pull/8084#discussion_r1497757246)
- ["and it even respects the existing alphabetical order of rules!!"](https://github.com/typescript-eslint/typescript-eslint/pull/7484#discussion_r1297392991)
- ["I appreciate the alphabetization"](https://github.com/typescript-eslint/typescript-eslint/pull/8765#discussion_r1623448006)

## Proofread identifiers for typos and bad word splits

*4 comments · automatable*

**Check:** Read new function and variable names letter by letter for misspellings, wrong casing inside a word, and extra letters.

**Why:** These slip through in new helpers and the reviewer fixes them with a one-line suggestion, often labeled simply as a typo.

**Verify:** Run a spell checker over the changed identifiers, for example cspell on the rule file.

**From your reviews:**

- ["Typo:"](https://github.com/typescript-eslint/typescript-eslint/pull/8903#discussion_r1623484934)
- ["Typo: no 'e' 🙂"](https://github.com/typescript-eslint/typescript-eslint/pull/8502#discussion_r1575346394)
- ["The _S_ isn't the start of a new word:"](https://github.com/typescript-eslint/typescript-eslint/pull/10744#discussion_r2399150543)

## Use the canonical `ts` namespace for TypeScript imports

*4 comments · automatable*

**Check:** Prefer `import * as ts from "typescript"` and `ts.SyntaxKind` over named imports, local aliases, or a second import form in the same file.

**Why:** The `ts` namespace is the standard across TS static analysis projects and docs, and the `typescript` package isn't tree-shakeable, so granular imports don't help. A contributor disagreed, so this remains a stated preference.

**Verify:** Search for `} from "typescript"` and `const SyntaxKind = ts.SyntaxKind`.

**From your reviews:**

- ["In every other TS static analysis project I've worked on, including typescript-eslint, we do the `ts` namespace."](https://github.com/flint-fyi/flint/pull/1300#discussion_r2670684610)
- ["It's the canonical/standard way to import from TS"](https://github.com/flint-fyi/flint/pull/3015#discussion_r3463253315)
- ["We generally use `ts.SyntaxKind` everywhere."](https://github.com/typescript-eslint/typescript-eslint/pull/5840#discussion_r997253849)
- ["Nit: we already `import * as tsutils` in this file, any particular reason to add a second import form?"](https://github.com/typescript-eslint/typescript-eslint/pull/6487#discussion_r1111118952)

## Name rules for precisely what they check

*3 comments*

**Check:** Ask whether a rule's name conveys what it checks and could not be mistaken for something else, while staying reasonably short.

**Why:** A name can be accurate but not precise. Misconceptions are easy, for example `no-partial-destructuring` sounds like it is about runtime rather than types.

**From your reviews:**

- ["It's accurate, but not precise..."](https://github.com/michaelfaith/eslint-plugin-package-json/pull/11#discussion_r1323871171)
- ["`no-partial-destructuring` makes it sound not specific to types. I think we'll want to avoid misconceptions like that."](https://github.com/typescript-eslint/typescript-eslint/pull/10344#discussion_r1854639570)
- ["This rule name is a mouthful."](https://github.com/typescript-eslint/typescript-eslint/pull/6394#discussion_r1092410785)
