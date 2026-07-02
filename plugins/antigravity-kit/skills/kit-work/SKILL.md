---
name: kit-work
description: Executor stage of the kit workflow. Use when the user says "kit-work" or asks to execute an approved plan. Implements strictly what the plan says; deviations are recorded explicitly.
---

# kit-work — execute the approved plan, nothing more

## Goal

Implement the current plan step by step, staying inside its scope. The contract: only what the plan says gets built.

## Instructions

1. Locate the active plan: the slug the user named under `.agents/kit/plans/`, or the only plan there with unchecked steps, or a plan from the conversation. If no plan exists, stop and suggest `kit-plan` first.
2. **Re-read the plan file before each step** — do not rely on conversation memory of it; context gets trimmed on long tasks. Execute the first unchecked `- [ ]` step, and flip it to `- [x]` in the file only after its verification passes.
3. Run terminal commands with the `rtk` prefix when available (see `kit-token-hygiene`).
4. If reality diverges from the plan (missing file, wrong assumption, new dependency):
   - Record the deviation explicitly: what the plan said, what you found, what you did instead.
   - If the deviation changes scope or approach, pause and surface it to the user instead of improvising.
5. After the last step, verify against the plan's completion criteria and report each criterion as met or not met.

## Definition of Done

- Every checkbox in the plan file is either checked (verified) or has a recorded deviation next to it.
- Completion criteria from the plan are checked and reported one by one.
- No changes exist outside the plan's scope.

## Constraints

- Do not add features, refactors, or "improvements" the plan does not mention.
- Do not silently skip a step; skipped steps must be reported with a reason.
- Do not mark work done while any completion criterion fails.
