---
name: kit-plan
description: Planner stage of the kit workflow. Use when the user says "kit-plan" or asks to scope, plan, or shape non-trivial work before coding. Produces a numbered plan with risks and completion criteria — never code.
---

# kit-plan — shape the work before touching code

## Goal

Turn a request into a numbered, executable plan with explicit scope, risks, and completion criteria. This stage produces **no code and no file edits**.

## Instructions

1. Restate the task in one or two sentences: what changes, why, and what "done" means.
2. If the task has more than 3 steps, an architectural decision, or unknown root causes, run the decomposition through the `sequential-thinking` MCP tool (see the `kit-seq-thinking` skill for budget and structure). Record only the conclusion in the plan, not the intermediate thoughts.
3. Explore just enough of the codebase to ground the plan: prefer targeted searches and selective reads over whole-file dumps (see `kit-token-hygiene`).
4. Write the plan to a file — `.agents/kit/plans/<kebab-slug>.md` in the workspace root (slug derived from the task, e.g. `add-oauth-login.md`) — with these sections:
   - **TL;DR** — the change in two sentences.
   - **Scope** — what is in and explicitly out.
   - **Steps** — as markdown checkboxes (`- [ ] …`), each independently checkable.
   - **Risks** — what can break, what is uncertain, what needs a spike.
   - **Completion criteria** — observable checks (tests pass, command output, behavior) that define done.
   The file is the source of truth: it survives context trimming, so long tasks resume from it, not from conversation memory.
5. **Spec-pipeline mode:** if a `kit-spec` pipeline is active (`.agents/kit/pipeline/<feature>/requirements.md` exists), this plan IS the task-plan phase — tag each step with the requirement IDs it serves (e.g. `- [ ] add token-bucket middleware (R1, R2)`) so review can trace them. Save the plan as the phase artifact and register it with `pipeline.mjs artifact`.
6. End with: `Next: kit-work <plan-slug>`.

## Definition of Done

- The plan file exists under `.agents/kit/plans/` with TL;DR, scope, checkbox steps, risks, and completion criteria.
- No source files were modified.
- Every step is small enough that `kit-work` can execute it without re-planning.

## Constraints

- Do not write or edit code at this stage.
- Do not start executing the plan; wait for the user to invoke `kit-work` or approve explicitly.
- Do not pad the plan with alternatives you are not recommending.

## Rationalizations

- "The change is tiny, no plan needed." — Tiny diffs break prod precisely because nobody scopes them; a three-line plan costs a minute.
- "I'll keep the plan in my head as I go." — In-head plans don't survive context trimming; the file does.
- "The user is in a hurry, skip the file." — Skipping the plan trades one minute now for a redo later; hurry is the argument *for* the file.
