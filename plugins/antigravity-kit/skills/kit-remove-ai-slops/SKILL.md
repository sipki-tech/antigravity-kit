---
name: kit-remove-ai-slops
description: Cleanup stage. Use when the user says "kit-clean" or "kit-remove-ai-slops", or asks to strip AI-generated noise from a diff — redundant comments, duplicate docs, dead code — without changing behavior.
---

# kit-remove-ai-slops — delete the noise, keep the behavior

## Goal

Remove AI-generated clutter from the working diff while provably changing zero behavior.

## What counts as slop

- Comments that narrate the next line ("// increment counter"), restate the diff, or address a reviewer.
- Docstrings/README sections duplicating what another doc or the code already says.
- Dead code: unused imports, unreachable branches, commented-out blocks, helper functions with no callers.
- Defensive boilerplate with no reachable failure mode (try/catch that only rethrows, redundant null checks).
- Inconsistent naming or formatting introduced by generation, diverging from the surrounding file.

## Instructions

1. Scope: work only on the current diff (`rtk git diff`) unless the user names files. Never sweep the whole repo uninvited.
2. For each candidate deletion, confirm it is not load-bearing: check callers/references before removing a symbol.
3. Keep comments that state real constraints the code cannot express (invariants, external quirks, security notes).
4. After cleanup, run the project's tests and lint (`rtk` prefix) to prove behavior is unchanged.
5. Report: list of removals by category, plus the passing check output.

## Definition of Done

- Diff contains only deletions/renames of noise; no logic changes.
- Tests and lint pass after cleanup.

## Constraints

- Zero behavior changes — if a "cleanup" alters behavior, it belongs to a separate task.
- When unsure whether a comment is load-bearing, keep it and flag it.
