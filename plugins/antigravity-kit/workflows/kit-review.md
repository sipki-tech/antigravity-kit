---
description: Final review before shipping — diff inspection plus mandatory executed tests and lint
---

1. Load and follow the `kit-review` skill playbook.
2. Collect the diff (`rtk git diff`, `rtk git status`) and review hunk by hunk: correctness, scope creep, AI slop.
3. MANDATORY: run the project's tests and lint before any verdict. A verdict without executed checks is invalid.
4. Traceability: each completion criterion / requirement (from `.agents/kit/plans/` or an active pipeline's `requirements.md`) must trace to a change AND a test — an uncovered one is Blocking.
5. Check docs/install accuracy and that no secrets are in the diff.
5. Deliver the verdict: Blocking / Recommended / Checks, ending with ship or don't ship.
