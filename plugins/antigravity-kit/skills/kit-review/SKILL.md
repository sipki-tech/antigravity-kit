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
3. **Traceability.** Take the completion criteria — from the plan (`.agents/kit/plans/`) or, if a spec pipeline is active, the requirement IDs in `.agents/kit/pipeline/<feature>/requirements.md`. For each one, confirm two things: a change in the diff implements it, AND a test exercises it. Any criterion/requirement without both is a **Blocking** finding.
4. Check the non-code surface: README/docs updated if behavior changed, install/config steps still accurate, no secrets or credentials in the diff.
5. **Hardened checklist** when the diff touches security-sensitive paths (auth, sessions, payments, secrets, crypto): input validation at trust boundaries, error paths that don't leak internal data, no hardcoded secrets, authorization checks on new entry points.
6. Give a structured verdict:
   - **Blocking** — must fix before shipping.
   - **Recommended** — worth fixing, not blocking.
   - **Checks** — each command you ran and its result.
7. Persist the verdict to `.agents/kit/reviews/<slug>.md` (slug from the plan file or the active pipeline feature; otherwise derive from the task): verdict, findings by severity, the executed check commands with their results, and the criteria traceability. Like plans, the file survives context trimming and is attachable to a PR as review evidence.

## Definition of Done

- Tests and lint were executed in this session and their results reported.
- Every completion criterion / requirement is traced to a change and a test.
- Every blocking finding references a concrete file/line or command output.
- The verdict explicitly states ship / don't ship.
- The verdict file exists under `.agents/kit/reviews/`.

## Constraints

- Never approve based on reading the diff alone.
- Do not fix issues silently during review; report them (unless the user asked review-and-fix).
- Zero tolerance for a passing verdict with failing tests.

## Rationalizations

- "The diff is small and clean, running tests is overkill." — Small diffs fail in prod precisely because nobody checks them; the check costs seconds, the rollback costs hours.
- "Tests were run earlier in the session." — Earlier is not this tree; the verdict covers the final state, so the checks must too.
- "It's just docs/config, nothing to verify." — Config typos take prod down more often than code; install steps rot exactly when nobody re-runs them.
