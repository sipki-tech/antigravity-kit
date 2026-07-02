# Command directive map (design reference, not implemented)

Design for extending the wake-word hook with companion directives for host slash commands. Status: deferred by decision (2026-07-03). `/teamwork-preview` is the only implemented entry.

## Constraint

UI-level commands (`/model`, `/config`, `/clear`, `/rewind`, panel commands…) are handled by the host before any model invocation — PreInvocation hooks never see them. Only agentic commands that reach the model can carry a directive. Second principle: no directives on harmless commands (`/explain`, `/btw`) — noise trains the agent to ignore injections.

## Map

| Command | Pain | Directive sketch |
| --- | --- | --- |
| `/fast` | skips planning entirely | fast mode is for trivial changes; >3 steps → suggest kit-plan; tests stay mandatory |
| `/planning` | native plan lives in conversation (context amnesia) | apply the kit-plan contract: plan file in `.agents/kit/plans/`, checkbox steps, criteria |
| `/goal` | free-form criteria, no continuation | mirror criteria into `.agents/kit-goal.md` so the Stop hook continues interrupted work |
| `/refactor` | refactor without a baseline | green test run first, structural edits second (workflow.md rule) |
| `/fix-errors` | batch fixing = shotgun debugging | kit-debug contract: reproduce → cause → minimal fix |
| `/generate-unit-tests` | always-green stub tests | every test must be able to fail; run after generation; follow project conventions |
| `/document` | comment generation = slop factory | kit-remove-ai-slops rules: only constraints code can't express |
| `/deploy` | irreversible action | tests executed this session, target env named explicitly, user confirmation |
| `/teamwork-preview` | week-quota burn, free-form brief | ✅ implemented in `kit-wake-word.mjs` |

Skipped deliberately: `/explain`, `/btw` (harmless), `/browser`, `/task`, `/artifacts` (no meaningful guardrail), `/schedule` (behavior under-documented).

## Implementation notes (when picked up)

- Same mechanism as the teamwork nudge in `scripts/kit-wake-word.mjs`: a `HOST_COMMANDS` map of `regex → directive`, matched only with the leading slash (`/(^|\s)\/refactor\b/`), checked after kit aliases (aliases win).
- One test per command + a precedence test.
- Directives ≤3 sentences each; reference kit skills instead of duplicating their content.
