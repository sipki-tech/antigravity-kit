<h1 align="center">Antigravity Kit</h1>

<table align="center">
<tr>
<td>
<pre><code>
██╗  ██╗██╗████████╗
██║ ██╔╝██║╚══██╔══╝
█████╔╝ ██║   ██║
██╔═██╗ ██║   ██║
██║  ██╗██║   ██║
╚═╝  ╚═╝╚═╝   ╚═╝
</code></pre>
</td>
</tr>
</table>

<p align="center">
  <img alt="Antigravity plugin" src="https://img.shields.io/badge/Antigravity-plugin-5B8DEF?style=for-the-badge&labelColor=111827" />
  <img alt="Kit v0.1.0" src="https://img.shields.io/badge/KIT-v0.1.0-8B5CF6?style=for-the-badge&labelColor=111827" />
  <img alt="skills hooks mcp workflows" src="https://img.shields.io/badge/skills%20%2B%20hooks%20%2B%20MCP-workflows-22C55E?style=for-the-badge&labelColor=111827" />
  <img alt="token optimization" src="https://img.shields.io/badge/tokens-−60–90%25-F59E0B?style=for-the-badge&labelColor=111827" />
  <img alt="MIT license" src="https://img.shields.io/badge/license-MIT-64748B?style=for-the-badge&labelColor=111827" />
</p>

<p align="center">
  English | <a href="README.ru.md">Русский</a>
  &nbsp;·&nbsp; <a href="docs/GUIDE.md">📖 User Guide</a>
</p>

**Antigravity Kit** turns a raw Antigravity agent into a disciplined pipeline: plan → work → loop → review, with protective hooks, structured reasoning, and a two-layer token-optimization stack that directly attacks Antigravity's #1 pain — quota burn.

```
your prompt ──► [wake words / slash commands] ──► plan ──► work ──► loop ──► review
                       │                                                      │
                       ▼                                                      ▼
              [hooks: danger guard,                              [mandatory executed
               rtk nudge, goal continuation]                      tests before verdict]

terminal output ──► [RTK]      ──► agent context      (−60–90% tokens)
big blobs/logs  ──► [Headroom] ──► LLM API            (−60–95% tokens)
```

## Why

| Antigravity pain | Kit answer |
| --- | --- |
| Quota burns out in 10–15 minutes of agent work | RTK compresses terminal output; Headroom compresses blobs; token-hygiene rules cut waste at the source |
| Context amnesia — the agent forgets files from 3 prompts ago | Plans live in files (`.agents/kit/plans/`), re-read before every step; goals survive via `.agents/kit-goal.md` |
| Hallucinated imports and stale API knowledge | context7 MCP (fresh library docs) enabled by default |
| `/teamwork-preview` can burn a week's quota on a vague brief | `kit-teamwork` pre-flight brief + automatic nudge when teamwork is mentioned |
| Destructive commands, secret leaks | `danger-guard` hook: blocks `rm -rf` outside the workspace, force-push to main, `.env`/key reads |

Design principle: the core (skills + MCP) is **portable Agent Skills format** — the same corpus installs into Claude Code or Codex with one flag. Only a thin adapter (manifest, hooks, installer) is Antigravity-specific.

## Install

```bash
# global — all workspaces, all surfaces (IDE, CLI, 2.0)
npx github:sipki-tech/antigravity-kit install

# per-project (committable: your whole team gets the kit;
# see "Team setup" in docs/GUIDE.md for the recommended .gitignore)
npx github:sipki-tech/antigravity-kit install --workspace

# preview without writing anything
npx github:sipki-tech/antigravity-kit install --dry-run

# + rtk binary and its native Antigravity rewrite hook
npx github:sipki-tech/antigravity-kit install --with-rtk

# + headroom CLI, with its MCP entry enabled
npx github:sipki-tech/antigravity-kit install --with-headroom

# everything at once (= --with-rtk --with-headroom)
npx github:sipki-tech/antigravity-kit install --full

# add /kit-* slash commands to the current project
npx github:sipki-tech/antigravity-kit workflows

# refresh an existing install (prints old -> new version; #main skips the npx cache)
npx github:sipki-tech/antigravity-kit#main update

# health check (files, hooks, MCP, skill/workflow integrity,
# version match, optional rtk/headroom status) / removal
npx github:sipki-tech/antigravity-kit verify
npx github:sipki-tech/antigravity-kit uninstall
```

Requires Node 18+. Restart Antigravity after install. The kit is distributed from GitHub only (not published to npm). npx caches GitHub installs, so to force the latest commit add `#main`:

```bash
npx github:sipki-tech/antigravity-kit#main install --full
```

## The kit cycle

Every stage works two ways: a **wake word** in the prompt (`kit-plan this migration`) or a **slash command** (`/kit-plan`) once workflows are installed. Slash commands are the reliable path; wake words are the lazy one.

| Command | Role | Contract |
| --- | --- | --- |
| `kit-plan` | planner | Plan written to `.agents/kit/plans/<slug>.md`: TL;DR, scope, checkbox steps, risks, completion criteria. **No code.** |
| `kit-work` | executor | Re-reads the plan file before each step (survives context trimming); checks off steps only after verification; deviations recorded explicitly. |
| `kit` / `kit-loop` | loop | Test-first cycles: failing test → minimal change → visible passing evidence. |
| `kit-review` | reviewer | Reviews the diff hunk by hunk, then **must run** project tests and lint before any verdict. Verdict: Blocking / Recommended / Checks. |
| `kit-clean` | cleanup | Removes AI slop (dead code, narrating comments, duplicate docs) from the diff. Zero behavior change, proven by tests. |
| `kit-debug` | debugger | Reproduce → hypotheses via sequential-thinking → verified cause → minimal fix. |
| `kit-goal` | long-runner | Checklist in `.agents/kit-goal.md`; the Stop hook keeps work going until every item is checked. |
| `kit-teamwork` | teamwork prep | Pre-flight brief for `/teamwork-preview` in `.agents/kit/teamwork-brief.md`: verifiable criteria, explicit non-goals, disjoint lanes. Never launches the run itself. |
| `kit-spec` | spec pipeline | Heavy mode for complex features: explore → requirements (WHEN/SHALL) → design → task-plan → implementation → review, with a state engine enforcing approval gates. See the [guide](docs/GUIDE.md). |

Two supporting skills load on demand: **kit-seq-thinking** (when and how to use the sequential-thinking tool, thought budget 5–9) and **kit-token-hygiene** (rtk prefix, selective reading, no raw logs).

Identifier-like text (`kit_helper.mjs`, `src/kit-plan/`) never triggers wake words; bare `kit` fires only as the first word of a prompt.

## Token optimization

Two independent layers whose savings multiply — details in [docs/headroom.md](docs/headroom.md), measurement protocol in [docs/token-benchmark.md](docs/token-benchmark.md):

1. **RTK** (terminal): `--with-rtk` installs the binary and runs `rtk init --agent antigravity`, registering rtk's native rewrite hook. The kit's own `rtk-enforcer` is a polite fallback — silent when rtk's hook is active, rtk is missing, or the command is compound. Bypass: prefix with `KIT_RAW=1`, or set `KIT_RTK_ENFORCE=off`.
2. **Headroom** (everything else): registered as an MCP server (`headroom_compress` / `headroom_retrieve` / `headroom_stats`). Auto-enabled at install when the `headroom` CLI is detected; `--with-headroom` installs it for you. `headroom wrap` does not support Antigravity — MCP mode is the supported path.

A third, cheaper trick: **tree_sitter MCP** gives the agent AST queries so it fetches symbols instead of reading whole files — waste that never enters the context doesn't need compressing.

## Hooks

| Hook | Event | Behavior |
| --- | --- | --- |
| kit-wake-word | PreInvocation | Injects stage directives for `kit*` aliases via `injectSteps`; reads the prompt from `prompt`/`steps[]` with a transcript-file fallback; nudges brief preparation when `/teamwork-preview` is mentioned. Never executes shell from the prompt. |
| danger-guard | PreToolUse (run_command) | Vetoes `rm -rf` outside the workspace, force-push to main/master, secret-file reads (`.env*`, keys, credential stores). |
| rtk-enforcer | PreToolUse (run_command) | Nudges listed dev commands through the `rtk` prefix; silent when redundant or risky to rewrite. |
| diagnostics-handoff | PostToolUse (edits) | Reminds to run the project's own checks on changed files. Guidance only — executes nothing. |
| goal-continuation | Stop | `{"decision": "continue"}` while background work runs (`fullyIdle: false`) or `.agents/kit-goal.md` has unchecked items. |

All hooks are **fail-open**: any internal error resolves to "allow" and never breaks the session. Wire formats follow the ones proven in production by antigravity-swarm (`injectSteps` for injection, `decision: "continue" | ""` for Stop).

## MCP servers

Defaults are local stdio servers with **zero credentials** — install and go. Servers with keys ship disabled with placeholders; no real secrets ever live in the config.

| Server | Purpose | Key | Default |
| --- | --- | --- | --- |
| sequential-thinking | structured reasoning for plan/debug | none | enabled |
| tree_sitter | AST queries instead of full-file reads | none | enabled |
| context7 | fresh library docs (anti-hallucination) | optional key raises rate limits | enabled |
| headroom | on-demand blob compression | none (needs the `headroom` CLI) | auto: enabled when the CLI is detected |

Known preview limitations: MCP OAuth is unsupported (prefer API-key auth for remote servers); `env` passing fails on some builds — put keys in `args` if a server ignores its `env`.

## Subagents

Three TOML presets ship in `agents/` (installed with the plugin tree):

| Agent | Role |
| --- | --- |
| `kit-planner` | Plan-only specialist: numbered plan with scope, risks, completion criteria. Never edits files. |
| `kit-reviewer` | Strict verifier: demands executed test/lint evidence, findings by severity, verdict `KIT APPROVED` / `KIT REJECTED`. Missing evidence is a blocking issue. |
| `kit-architect` | Design-document reviewer for kit-spec's design gate (opt-in): ADR-to-requirement traceability, failure-mode coverage, verdict `DESIGN SOUND` / `DESIGN GAPS`. |

The `model` field defaults to `gemini-3.5-flash` — edit the TOML to pin another. Custom subagents may require a paid plan; if your build doesn't list them, the rest of the kit is unaffected.

## Paths

| Surface | Plugins | MCP config | Hooks |
| --- | --- | --- | --- |
| Shared (IDE + CLI + 2.0) | `~/.gemini/config/plugins/` | `~/.gemini/config/mcp_config.json` | via plugin |
| CLI-specific | `~/.gemini/antigravity-cli/plugins/` | — | `~/.gemini/antigravity-cli/hooks.json` |
| Workspace | `.agents/plugins/` | `.agents/mcp_config.json` | `.agents/hooks.json` |

Skills, rules, hooks, and subagents all live **inside the plugin directory** and are discovered from there — no separate skills directory is needed. Antigravity 2.0 shares the `~/.gemini/config/` root with the IDE and CLI, so one global install covers all three surfaces. Plugins are backward compatible with Gemini CLI extensions. The installer detects the actual layout and mirrors into the CLI path when it exists; the MCP-config merge is non-destructive (your existing servers are never touched), and uninstall removes only entries you didn't edit.

## Porting to other hosts

The skill corpus is plain Agent Skills format:

```bash
npx github:sipki-tech/antigravity-kit install --host claude-code   # → ~/.claude/skills/
npx github:sipki-tech/antigravity-kit install --host codex          # → ~/.codex/skills/
```

What ports and what doesn't: [docs/portability.md](docs/portability.md).

## Safety

- `rules/safety.md`: forbidden commands, secrets policy (never read `.env*`/keys, placeholders only) — enforced as a backstop by `danger-guard`.
- `--permission-profile safe|balanced|full|none` (default `safe`): recorded under the kit's own settings namespace; enforcement comes from rules + hooks while the preview settings schema stabilizes.

## Development

```bash
npm test                        # node --test: full suite, zero dependencies
node bin/cli.mjs install --dry-run
```

Contributor guide: [CONTRIBUTING.md](CONTRIBUTING.md). Version history: [CHANGELOG.md](CHANGELOG.md). CI runs the test suite plus an installer smoke on ubuntu/macos × Node 20/22.

Layout: `plugins/antigravity-kit/` is the payload (skills, rules, hooks, scripts, workflows, agents, mcp_config); `installer/` + `bin/cli.mjs` is the npx installer. Hook logic lives in importable `.mjs` modules; `hooks/hooks.json` is a thin adapter — when the preview hook format changes, only the adapter needs updating. Design reference for future host-command directives: [docs/command-directives.md](docs/command-directives.md).

## Acknowledgments

- [antigravity-swarm](https://github.com/wjgoarxiv/antigravity-swarm) — the workflow-layer pattern and battle-tested hook wire formats.
- [sdd](https://github.com/sipki-tech/sdd) — the spec-driven pipeline design behind kit's spec mode (kit reimplements it Antigravity-native; the two are complementary siblings).
- [rtk](https://github.com/rtk-ai/rtk) — terminal output compression.
- [headroom](https://github.com/chopratejas/headroom) — context compression for everything else.

## License

MIT
