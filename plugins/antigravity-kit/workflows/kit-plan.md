---
description: Plan non-trivial work before coding — numbered plan with scope, risks, and completion criteria; writes the plan to a file, no code
---

1. Load and follow the `kit-plan` skill playbook.
2. Restate the task: what changes, why, and what "done" means.
3. If the task has more than 3 steps or an architectural decision, decompose via the sequential-thinking tool (budget 5–9 thoughts); keep only the conclusion.
4. Write the plan to `.agents/kit/plans/<kebab-slug>.md` with sections: `## TL;DR`, `## Scope`, `## Steps` (as `- [ ]` checkboxes), `## Risks`, `## Completion criteria`.
5. Do not write or edit any source code in this stage.
6. Finish with: `Next: /kit-work <plan-slug>`.
