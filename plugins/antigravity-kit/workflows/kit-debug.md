---
description: Systematic debugging — reproduce first, hypothesize via sequential-thinking, apply the minimal fix
---

1. Load and follow the `kit-debug` skill playbook.
2. Reproduce the failure with a single command before anything else. No reproduction — no fix.
3. If the cause is not obvious, run hypotheses through sequential-thinking: hypothesis → falsifying evidence → check.
4. Demonstrate the causal mechanism, then apply the smallest change that removes it.
5. Show the reproduction failing before and passing after; run the full test suite; add a regression test where possible.
