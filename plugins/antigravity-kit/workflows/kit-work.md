---
description: Execute an approved kit plan strictly, step by step, recording any deviation
---

1. Load and follow the `kit-work` skill playbook.
2. Locate the plan: the named slug under `.agents/kit/plans/`, or the only plan with unchecked steps when none is named. If no plan exists, stop and suggest `/kit-plan`.
3. Re-read the plan file before each step; execute the first unchecked `- [ ]` step.
4. Run dev commands with the `rtk` prefix.
5. After verifying a step, flip its checkbox to `- [x]` in the plan file. Record deviations explicitly next to the step.
6. When all steps are checked, verify every completion criterion and report each as met or not met.
