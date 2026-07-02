---
description: Prepare a complete brief for /teamwork-preview — success criteria, scope, non-overlapping lanes — before spending the quota
---

1. Load and follow the `kit-teamwork` skill playbook.
2. Check fit first: tightly coupled refactors and sequential tasks do NOT belong in teamwork — recommend `/kit-plan` + `/kit-work` instead and stop.
3. Gather what's missing (from the user and targeted repo checks) and write `.agents/kit/teamwork-brief.md` with: Goal, Success criteria (each with a verification command), Scope with explicit non-goals, non-overlapping Lanes, Constraints, Verification plan.
4. Verify lanes are pairwise disjoint — parallel agents silently overwrite shared files.
5. Show the brief to the user and stop. Launching `/teamwork-preview` (and paying its quota) is the user's call.
