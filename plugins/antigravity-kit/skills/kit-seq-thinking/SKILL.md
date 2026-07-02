---
name: kit-seq-thinking
description: How and when to use the sequential-thinking MCP tool for structured reasoning. Use for multi-step planning, architectural decisions, and debugging with non-obvious causes. Includes a thought budget to avoid burning tokens.
---

# kit-seq-thinking — structured reasoning without token waste

## Goal

Use the `sequential-thinking` MCP tool where structured decomposition genuinely helps, with an explicit thought budget, and keep intermediate thoughts out of the final context.

## When to use

- Tasks with more than 3 interdependent steps.
- Architectural decisions with real trade-offs.
- Debugging where the cause is not obvious after the first reproduction.
- Decomposition inside `kit-plan`.

## When NOT to use

- Trivial edits, renames, formatting.
- Tasks where the next action is already obvious.
- Re-deriving something already decided in the conversation.

## How to structure the run

1. Start with an explicit budget: **5–9 thoughts** (`totalThoughts`). Extend only when a genuinely new unknown appears mid-run — not to polish wording.
2. Shape each pass as hypothesis -> check -> revision:
   - State a hypothesis or decomposition step.
   - Identify what evidence would confirm or kill it.
   - Revise (`isRevision`) instead of appending contradictory thoughts.
3. Stop early (`nextThoughtNeeded: false`) as soon as the conclusion is stable.

## Output discipline

- Carry **only the conclusion** into the plan or answer: the decision, the ordered steps, the rejected alternatives in one line each.
- Never paste the full thought chain into the conversation or a file.

## Constraints

- No budget extensions "just in case".
- If sequential-thinking is unavailable, reason inline in a compact numbered list — do not fail the task.
