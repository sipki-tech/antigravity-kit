---
description: Turn a long-form brief into a verifiable completion checklist that survives sessions
---

1. Load and follow the `kit-goal` skill playbook.
2. Extract concrete, verifiable completion criteria from the brief.
3. Write them to `.agents/kit-goal.md` as a markdown checklist (`- [ ] criterion — how to verify`).
4. Work the items in order; flip to `- [x]` only after running the item's verification.
5. The kit Stop hook keeps the session going while unchecked items remain; when done, summarize each criterion with its evidence.
