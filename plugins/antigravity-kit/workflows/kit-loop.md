---
description: Test-first implementation loop — failing test, minimal change, visible passing evidence
---

1. Load and follow the `kit-loop` skill playbook.
2. Identify the target behavior and the project's own verification commands.
3. Loop: write a test that fails for the right reason → minimal change → show it passing. Use the `rtk` prefix; paste only the relevant output lines.
4. When converged, run the full check suite (tests + lint) once and report.
5. Suggest `/kit-review` before shipping.
