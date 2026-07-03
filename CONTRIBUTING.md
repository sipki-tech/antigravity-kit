# Contributing

## Setup

```bash
git clone https://github.com/sipki-tech/antigravity-kit
cd antigravity-kit
npm test          # node --test — no install step needed
```

Node 18+ is the only requirement. There is no build step.

## Ground rules

- **Zero runtime dependencies.** The installer and all hook scripts use Node built-ins only. PRs adding a dependency (runtime or dev) need a very strong reason.
- **Hooks are fail-open.** Any error inside a hook must resolve to "allow" and never break the session (`scripts/lib/io.mjs` enforces this contract — route new hooks through `runHook`). Deny only on confident matches.
- **State lives in the project.** Plans, goals, and pipeline state go under `.agents/` of the *user's project*, never next to the plugin scripts.
- **Docs are bilingual.** Any change to `README.md` or `docs/GUIDE.md` must land in `README.ru.md` / `docs/GUIDE.ru.md` in the same PR, section for section.
- **Tests accompany behavior changes.** Hook logic is importable precisely so it can be unit-tested; e2e wire-format tests spawn the scripts. Guard fixes need regression tests for the exact bypass.

## Layout

- `plugins/antigravity-kit/` — the payload Antigravity loads: `skills/`, `workflows/`, `rules/`, `hooks/hooks.json` (thin wire adapter), `scripts/` (hook logic + pipeline engine), `agents/`, `mcp_config.json`.
- `installer/` + `bin/cli.mjs` — the npx installer.
- `test/` — `node --test` suites: hooks, pipeline engine, installer.

## Adding things

- **Skill**: directory under `plugins/antigravity-kit/skills/<name>/SKILL.md` with `name` + `description` frontmatter (description must include the trigger phrase). Add it to the corpus test in `test/installer.test.mjs`.
- **Workflow**: `plugins/antigravity-kit/workflows/<name>.md` with a `description` frontmatter — keep it a thin alias that points at the skill.
- **Hook**: importable logic in `scripts/<name>.mjs`, wire it in `hooks/hooks.json`, run it through `runHook`, keep it fail-open, add unit + e2e tests.

## Commits

Conventional-commit style, as in the existing history: `feat:`, `fix:`, `docs:`, `chore:`, `rules:`. Update `CHANGELOG.md` (`Unreleased` section) for anything user-visible.
