---
name: kit-debug
description: Systematic debugging playbook. Use when the user says "kit-debug" or reports a failure with a non-obvious cause. Flow - reproduce first, hypothesize via sequential-thinking, apply the minimal fix.
---

# kit-debug — reproduce, hypothesize, fix minimally

## Goal

Find and fix the actual cause of a failure with the smallest possible change, backed by a reproduction seen failing before and passing after.

## Instructions

1. **Reproduce first.** Get the failure to happen locally with a single command (`rtk` prefix). If it cannot be reproduced, gathering more information IS the task — do not guess-fix.
2. **Hypothesize.** If the cause is not obvious from the first reproduction, run hypotheses through the `sequential-thinking` MCP tool (budget per `kit-seq-thinking`): hypothesis -> what evidence would falsify it -> check. One hypothesis at a time.
3. **Verify the cause, not just the symptom.** Before writing the fix, demonstrate the mechanism: the specific line/state/interaction that produces the failure.
4. **Minimal fix.** Change the least code that removes the cause. Resist drive-by refactoring — note it for a separate task instead.
5. **Prove it.** Re-run the reproduction (fails before, passes after) and the project's test suite. Add a regression test where the harness allows.

## Definition of Done

- Reproduction command exists and was seen failing before the fix and passing after.
- The causal mechanism is stated in one or two sentences.
- The fix diff is minimal; unrelated cleanups excluded.
- Full test suite passes.

## Constraints

- No shotgun fixes ("changed three things, one of them helped").
- A signal that pattern-matches a known failure may still have a different cause — verify before acting on the pattern.

## Rationalizations

- "I can see the bug, fix it right away." — The first plausible cause is wrong often enough to pay for the reproduction every time.
- "Can't reproduce it, but the fix looks right." — An unreproduced fix is a guess with a commit message; gathering information IS the task.
- "While I'm here, let me clean this up." — Mixed diffs hide which change actually fixed the failure — and which one broke something else.
