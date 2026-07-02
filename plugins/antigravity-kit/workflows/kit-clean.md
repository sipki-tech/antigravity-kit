---
description: Remove AI slop from the current diff — dead code, narrating comments, duplicate docs — with zero behavior change
---

1. Load and follow the `kit-remove-ai-slops` skill playbook.
2. Scope strictly to the current diff (`rtk git diff`) unless files are named.
3. Before deleting a symbol, confirm it has no callers. Keep comments that state real constraints.
4. Run tests and lint after cleanup to prove behavior is unchanged.
5. Report removals by category with the passing check output.
