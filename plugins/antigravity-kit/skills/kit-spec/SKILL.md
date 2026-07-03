---
name: kit-spec
description: Spec-driven pipeline for complex/high-stakes features — explore, requirements (WHEN/SHALL), and design phases with human approval gates before implementation. Use when the user says "kit-spec" or a feature is risky enough to warrant a spec before code. For small work, use the light cycle (kit-plan) instead.
---

# kit-spec — spec-driven pipeline with real gates

## Goal

Drive a complex feature through phased development with approval gates, so requirements and design are pinned down before code. A deterministic state engine (`pipeline.mjs`) tracks the phase — gates are enforced, not suggested.

## When to use vs. not

- **Use** for high-stakes or complex features: unclear requirements, architectural decisions, anything where misunderstanding is expensive.
- **Do NOT use** for small edits, bug fixes, or work that fits one focused session — that is the light cycle (`kit-plan` → `kit-work` → `kit-loop` → `kit-review`). Spec mode is heavier on purpose.

## The pipeline

```
explore → requirements → design → task-plan → implementation → review → done
          [approve]      [approve] [approve]  [approve]       [approve] [approve]
```

The first three phases are spec mode's own (templates in `templates/`). The last three reuse the kit skills you already have: **task-plan = kit-plan**, **implementation = kit-work + kit-loop**, **review = kit-review**. Nothing is duplicated.

## Running the engine

The engine script location depends on the install; resolve it once, then reuse `$KIT_PIPELINE`:

```sh
KIT_PIPELINE="$([ -f .agents/plugins/antigravity-kit/scripts/pipeline.mjs ] \
  && echo .agents/plugins/antigravity-kit/scripts/pipeline.mjs \
  || echo "$HOME/.gemini/config/plugins/antigravity-kit/scripts/pipeline.mjs")"
node "$KIT_PIPELINE" status        # or: init / artifact / approve / doctor
```

Run all engine commands with the `rtk` prefix when available. If `pipeline.mjs` isn't found, run `node "$KIT_PIPELINE" doctor` to diagnose, or fall back to `npx github:sipki-tech/antigravity-kit#main pipeline <cmd>`.

## Instructions

1. **Start:** `pipeline.mjs init <feature-slug>` (kebab-case). State lives in `.agents/kit/pipeline/<feature>/`.
2. **Each phase:**
   a. Read the phase's template in `templates/<phase>.md` before writing anything.
   b. Write the artifact to `.agents/kit/pipeline/<feature>/<phase>.md`.
   c. Register it: `pipeline.mjs artifact <phase>.md`.
   d. **Stop at the gate.** Present the artifact and ask the user to approve. Do NOT advance on your own.
   e. On approval: `pipeline.mjs approve` → the engine moves to the next phase.
3. **Front phases** (explore/requirements/design) use this skill's templates. When the engine reaches **task-plan**, hand off to `kit-plan`; **implementation** → `kit-work` + `kit-loop`; **review** → `kit-review`.
4. **Persistence:** keep working the pipeline until the current phase is COMPLETELY resolved. If an engine command fails, run `doctor`, analyze the error, and try a corrected command — do not silently drop the pipeline.

## Definition of Done

- Every phase produced an artifact that the user explicitly approved.
- `pipeline.mjs status` shows phase `done`.
- Requirements are traceable through to review (kit-review checks this).

## Constraints

- Never advance a phase without the user's approval — the human is the gate.
- Never skip a phase to "save time"; use `inject` only with a genuinely pre-written artifact.
- Keep artifacts compact (token hygiene): selective reads, no raw logs, `headroom` for large blobs.
