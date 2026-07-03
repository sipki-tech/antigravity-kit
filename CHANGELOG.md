# Changelog

All notable changes to this project are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions follow [SemVer](https://semver.org/).

## [Unreleased]

## [0.2.0] — 2026-07-03

### Added

- **`update` command** — `npx github:sipki-tech/antigravity-kit#main update` refreshes an existing install and prints the old → new version (or "already up to date"); points at this CHANGELOG.
- **Sensitive-path security nudge** — editing a file whose path mentions auth/sessions/payments/secrets/crypto now triggers a reminder to apply kit-review's hardened checklist (input validation, non-leaking error paths, no hardcoded secrets). Whole-token path matching, so `tokenizer.ts` doesn't trigger.
- **Review artifacts** — kit-review persists its verdict, findings, and executed-check evidence to `.agents/kit/reviews/<slug>.md`, symmetric with plans; attachable to PRs as review evidence.
- **`kit-architect` subagent** — optional architecture pass at kit-spec's design gate: ADR-to-requirement traceability, failure-mode coverage, verdict `DESIGN SOUND` / `DESIGN GAPS`. Opt-in (costs quota); the human gate stays.
- **Rationalization notes** — kit-plan/work/loop/review/spec/debug skills now name the typical corner-cutting excuses ("diff is tiny, skip tests") with counterarguments, making shortcuts explicit instead of silent.

### Fixed

- **danger-guard**: path variants of the workspace root (`/path/to/root/`, `/path/to/root/.`) no longer bypass the `rm -rf` block — all targets are normalized with `resolve()` before comparison.
- **danger-guard**: `rm`/secret-read commands behind `sudo`, `command`, `env`, or `VAR=value` wrappers are now caught.
- **danger-guard**: `git push origin +main` (force-push via refspec, no `--force` flag) is now blocked.
- **installer**: a corrupt payload (missing `skills/` or `workflows/`) now fails with a clear reinstall hint instead of a raw stack trace.
- **cli**: dry-run final messages say `would install` / `would uninstall` instead of claiming the action happened.
- README (EN/RU) no longer hardcodes a test count that goes stale.

### Added

- `verify` now checks that every payload skill and workflow is present in the installed copy, that `installed_version.json` matches `plugin.json`, and reports (without failing) whether the optional `rtk`/`headroom` binaries are installed.
- **rtk-enforcer** recognizes env-assignment prefixes (`NODE_ENV=test npm run build`) and suggests the correctly placed `rtk` prefix; `KIT_RAW=1` remains a bypass.
- GitHub Actions CI: unit tests plus installer smoke (dry-run and real workspace install + verify) on ubuntu/macos × Node 20/22.
- CONTRIBUTING.md with the zero-dependency policy, fail-open hook contract, and EN/RU doc-sync rule.
- Team-setup docs: recommended consumer-project `.gitignore` (commit `.agents/plugins/` + `.agents/workflows/` + `.agents/mcp_config.json`, ignore `.agents/kit/` and `.agents/kit-goal.md`).

### Changed

- Pipeline state temp files use a unique `pid-timestamp-random` suffix instead of PID only.

### Backlog (recorded, not implemented)

- Host-command directives beyond `/teamwork-preview` — deferred, see `docs/command-directives.md`.
- npm publication, signed releases, and pipeline file-locking — out of scope while distribution is GitHub-only and the agent is single-instance.

## [0.1.0] — 2026-07-03

Initial release.

- Workflow cycle: `kit-plan` → `kit-work` → `kit-loop` → `kit-review`, plus `kit-debug`, `kit-clean`, `kit-goal`, `kit-teamwork`.
- Spec mode: `kit-spec` with a deterministic pipeline state engine (`pipeline.mjs`) — phases, approval gates, artifact registration, inject/abandon/doctor.
- Hooks (all fail-open): `kit-wake-word`, `danger-guard`, `rtk-enforcer`, `diagnostics-handoff`, `goal-continuation`.
- Token optimization: rtk terminal compression + headroom MCP, `kit-token-hygiene` rules.
- MCP defaults: sequential-thinking, tree_sitter, context7, headroom (auto-enabled when the CLI is present).
- npx installer (GitHub-only distribution): global and `--workspace` layouts, MCP config merge, permission profiles, `--with-rtk` / `--with-headroom` / `--full`, `verify`, `uninstall`, host ports (`--host claude-code|codex`).
- Subagent presets: `kit-planner`, `kit-reviewer`.
- Bilingual docs: README + User Guide (EN/RU).
