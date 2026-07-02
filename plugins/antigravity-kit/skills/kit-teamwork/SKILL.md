---
name: kit-teamwork
description: Pre-flight preparation for Antigravity's /teamwork-preview. Use when the user says "kit-teamwork" or is about to launch a multi-agent teamwork run. Produces a complete brief file; never launches teamwork itself.
---

# kit-teamwork — prepare the brief before burning a week's quota

## Goal

Turn a vague intention into a teamwork-ready brief in `.agents/kit/teamwork-brief.md`. A single `/teamwork-preview` run can consume up to a week's quota, so the brief — not the run — is where quality is won.

## First: check that teamwork is the right tool

Advise **against** `/teamwork-preview` (and suggest `kit-plan` + `kit-work` instead) when:

- The task is a tightly coupled refactor — parallel agents overwrite each other and reportedly fail where the standard pipeline succeeds.
- Steps depend on each other sequentially — there is nothing to parallelize.
- The task fits in one focused session — the quota cost is not justified.

Teamwork fits: broad, parallelizable work with independent lanes (many isolated modules, mass migrations across unrelated files, greenfield scaffolding of separate components).

## Instructions

1. Interview the request (and the repo, selectively) until every section below can be filled concretely.
2. Write `.agents/kit/teamwork-brief.md`:

   ```markdown
   # Teamwork brief: <one-line goal>

   ## Goal
   <one sentence>

   ## Success criteria
   - <criterion> — verify with: `<command>`
   ...

   ## Scope
   In: ...
   Non-goals: <explicit list — what agents must NOT touch>

   ## Lanes
   - lane 1: <directories/files> — <subtask>
   - lane 2: ...
   (lanes must not overlap — parallel agents silently overwrite shared files)

   ## Constraints
   <stack, limits, forbidden actions, style rules>

   ## Verification plan
   <commands to run after the teamwork run completes>
   ```

3. Every success criterion must be verifiable by a command or an inspectable artifact — "improve X" does not qualify.
4. Check lanes for overlap: no two lanes may claim the same file or directory.
5. Show the finished brief to the user and stop.

## Definition of Done

- `.agents/kit/teamwork-brief.md` exists with all six sections filled.
- Each success criterion has a verification command.
- Lanes are pairwise disjoint.
- The user was reminded of the quota cost and given the brief for launch.

## Constraints

- Never invoke `/teamwork-preview` yourself — the launch decision and its quota cost belong to the user.
- Do not pad the brief with generic advice; every line must constrain the run.
