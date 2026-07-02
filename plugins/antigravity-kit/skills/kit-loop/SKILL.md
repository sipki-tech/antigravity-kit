---
name: kit-loop
description: Test-first implementation loop. Use when the user says "kit" or "kit-loop", or asks to finish a change with visible evidence. Alternates failing test -> minimal implementation -> visible check until done.
---

# kit-loop — test-first loop with visible evidence

## Goal

Drive a change to completion through short cycles where every claim is backed by a command you actually ran and its (compressed) output.

## Instructions

1. Identify the target behavior and how the project verifies it (test runner, lint, build). Use the project's own commands; do not invent new tooling.
2. Loop until the completion criteria hold:
   a. Write or extend a test that fails for the right reason. Show the failure.
   b. Make the minimal change that passes it.
   c. Re-run the check and show it passing.
3. Run all verification commands with the `rtk` prefix when available; paste only the relevant lines of output, not full logs (see `kit-token-hygiene`).
4. When the loop converges, run the project's full check suite once (tests + lint) and report the result.
5. Suggest `kit-review` as the next step before shipping.

## Definition of Done

- Each implemented behavior has a test that was seen failing and then passing.
- The full project check suite passed in the final iteration.
- All evidence (commands and key output lines) is visible in the conversation.

## Constraints

- Never claim "tests pass" without having run them in this session.
- Do not batch many behaviors into one giant cycle; keep iterations small.
- If a test cannot be written (no harness, external dependency), say so explicitly and propose the closest verifiable check instead.
