---
name: kit-review
description: Reviewer stage of the kit workflow. Use when the user says "kit-review" or asks to inspect a diff before calling work done. Must run project checks (tests/lint) before giving a verdict.
---

# kit-review — final pass before shipping

## Goal

Review the pending change as a skeptical maintainer would: diff, tests, docs, and install/runtime behavior. A verdict without executed checks is invalid.

## Instructions

1. Collect the diff (`rtk git diff`, `rtk git status`). Review it hunk by hunk for:
   - Correctness bugs and unhandled edge cases.
   - Scope creep: changes not related to the stated task.
   - AI slop: dead code, redundant comments, duplicated docs (delegate cleanup to `kit-clean` / `kit-remove-ai-slops`).
2. **Mandatory:** run the project's own checks — test suite and linter — before any verdict. Use the `rtk` prefix. If checks cannot run, the verdict must say so and be marked incomplete.
3. Check the non-code surface: README/docs updated if behavior changed, install/config steps still accurate, no secrets or credentials in the diff.
4. Give a structured verdict:
   - **Blocking** — must fix before shipping.
   - **Recommended** — worth fixing, not blocking.
   - **Checks** — each command you ran and its result.

## Definition of Done

- Tests and lint were executed in this session and their results reported.
- Every blocking finding references a concrete file/line or command output.
- The verdict explicitly states ship / don't ship.

## Constraints

- Never approve based on reading the diff alone.
- Do not fix issues silently during review; report them (unless the user asked review-and-fix).
- Zero tolerance for a passing verdict with failing tests.
