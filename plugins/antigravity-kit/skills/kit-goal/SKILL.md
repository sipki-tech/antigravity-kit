---
name: kit-goal
description: Long-running goal tracking with a completion checklist. Use when the user says "kit-goal" or hands over a brief that needs multiple sessions. Creates a checklist file that the Stop hook uses to continue unfinished work.
---

# kit-goal — turn a brief into evidence criteria and keep going

## Goal

Convert a long-form brief into a persistent checklist of verifiable completion criteria, so work can continue across turns and sessions until every item is checked.

## Instructions

1. Extract concrete, observable completion criteria from the brief. Each criterion must be checkable by a command or an inspectable artifact — not "improve X".
2. Write the checklist to `.agents/kit-goal.md` in the workspace root, using this exact format:

   ```markdown
   # kit-goal: <one-line goal>

   - [ ] <criterion 1 — how to verify it>
   - [ ] <criterion 2 — how to verify it>
   ```

3. Work the items in order (or by dependency). After completing an item, verify it and flip `- [ ]` to `- [x]` in the file.
4. The kit Stop hook reads this file: while unchecked items remain, it will prompt continuation. When all items are checked, the hook stays silent.
5. When the goal is done, summarize each criterion with its evidence, then either delete `.agents/kit-goal.md` or leave it fully checked.

## Definition of Done

- `.agents/kit-goal.md` exists with every item checked, or has been removed after completion.
- Each checked item has evidence (command output, file, test) reported in the conversation.

## Constraints

- Do not check an item without running its verification.
- Do not rewrite criteria mid-flight to make them easier; surface scope changes to the user.
