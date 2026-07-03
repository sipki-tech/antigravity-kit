# Workflow

- Non-trivial work (more than ~3 steps, or touching more than a couple of files) starts with `kit-plan`. Do not begin large implementation without a plan the user has seen.
- Tests come before refactoring: establish a passing baseline, then change structure.
- Execution follows the plan (`kit-work` contract): deviations are recorded explicitly, scope changes go back to the user.
- Before declaring work done, `kit-review` standards apply: project tests and lint must have actually run in this session.
- For genuinely multi-step, architectural, or non-obvious-cause problems, reason with the `sequential-thinking` tool (see `kit-seq-thinking` for budget and structure). Skip it for trivial or already-obvious work — do not over-reason.
- Prefix dev terminal commands with `rtk` when the binary is available (see `kit-token-hygiene`); run without the prefix only with a stated reason.
