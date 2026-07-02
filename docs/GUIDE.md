# Antigravity Kit — User Guide

A hands-on walkthrough of the kit: how it thinks, how to run a full cycle, and how to get the most out of every stage. For the terse reference, see the [README](../README.md). Русская версия: [GUIDE.ru.md](GUIDE.ru.md).

---

## 1. The mental model

Out of the box, an AI agent is eager but undisciplined: it starts coding before it understands the task, claims tests pass without running them, and burns your context (and quota) on noise. The kit wraps that agent in a **contract-driven pipeline**:

```
kit-plan  →  kit-work  →  kit  →  kit-review
 (shape)     (execute)   (loop)   (verify)
```

Each stage has a **Definition of Done** it must satisfy before the next stage begins. Around the cycle sit three support systems:

- **Hooks** — a safety net that runs automatically (blocks `rm -rf /`, nudges you toward token-saving commands, keeps long tasks going).
- **MCP servers** — extra senses for the agent (structured reasoning, code structure without full-file reads, fresh library docs).
- **Token optimization** — RTK and Headroom, which cut how many tokens the same work costs.

You don't need to memorize all of it. Start with the four core commands; the rest activates when relevant.

---

## 2. Install in one minute

The kit is distributed from GitHub (not npm). Two ways to install:

```bash
# Global — applies to every project on this machine, all surfaces (IDE, CLI, 2.0)
npx github:sipki-tech/antigravity-kit#main install --full

# Per-project — lands in ./.agents/, commit it so your whole team shares the kit
cd your-project
npx github:sipki-tech/antigravity-kit#main install --full --workspace
```

`--full` also installs [RTK](https://github.com/rtk-ai/rtk) (terminal compression) and [Headroom](https://github.com/chopratejas/headroom) (blob compression). Drop it if you want the plugin only.

Then:

```bash
# add the /kit-* slash commands to the current project
npx github:sipki-tech/antigravity-kit#main workflows

# confirm everything landed
npx github:sipki-tech/antigravity-kit#main verify            # global install
npx github:sipki-tech/antigravity-kit#main verify --workspace # workspace install
```

Restart Antigravity so it picks up the plugin. (`#main` forces npx to fetch the latest commit instead of a cached copy.)

---

## 3. Your first cycle — a worked example

Say the task is **"add rate limiting to the `/login` endpoint."** Here's the full loop.

### Step 1 — Plan

Type either the slash command or the wake word:

```
/kit-plan add rate limiting to the /login endpoint
```

The agent produces a plan **file** at `.agents/kit/plans/rate-limit-login.md` — not just chat text — with:

- **TL;DR** — one-sentence summary.
- **Scope** — in: the login handler and its middleware; out: other endpoints.
- **Steps** — as checkboxes (`- [ ] add a token-bucket middleware`, `- [ ] wire it into /login`, …).
- **Risks** — e.g. "shared state across instances needs a store, not memory."
- **Completion criteria** — "429 returned after N attempts, verified by `npm test rate-limit`."

No code is written yet. Why a file? Because Antigravity trims context on long tasks — a plan that lives only in the conversation gets forgotten three prompts later. A file survives.

### Step 2 — Work

```
/kit-work
```

The executor finds the plan, **re-reads it before every step**, and does exactly what it says — nothing more. It ticks each `- [ ]` to `- [x]` only after the step is verified. If reality diverges from the plan (say, there's no rate-limit store configured), it records the deviation explicitly instead of silently improvising.

### Step 3 — Loop

```
/kit-loop
```

Test-first: write a test that fails for the right reason, make the minimal change to pass it, show the passing run. Every "it works" is backed by command output you can see. Commands run through `rtk` so the output doesn't flood your context.

### Step 4 — Review

```
/kit-review
```

The reviewer reads the diff hunk by hunk **and must actually run** the project's tests and lint before giving a verdict — approval from reading the diff alone is forbidden. You get a structured verdict: Blocking issues, Recommended fixes, and the Checks that were run.

That's the cycle. For a small change you might skip straight to `/kit-loop`; for anything with more than a couple of moving parts, start at `/kit-plan`.

---

## 4. The stages in depth

| When you… | Use | It gives you |
| --- | --- | --- |
| face a non-trivial task | `kit-plan` | a file-based plan; no code until you approve |
| have an approved plan | `kit-work` | disciplined execution, deviations logged |
| are implementing | `kit` / `kit-loop` | test-first cycles with visible evidence |
| are about to ship | `kit-review` | a verdict backed by executed tests |
| see AI clutter in the diff | `kit-clean` | dead code / noise removed, behavior unchanged |
| hit a bug | `kit-debug` | reproduce → hypothesize → minimal fix |
| have a multi-session goal | `kit-goal` | a checklist that survives restarts |
| plan a `/teamwork-preview` run | `kit-teamwork` | a complete brief before you spend the quota |

Two more skills load automatically when relevant and never need to be called by name:

- **kit-seq-thinking** — teaches the agent when to reach for the sequential-thinking tool (multi-step planning, non-obvious bugs) and to keep a tight thought budget so it doesn't over-reason trivial changes.
- **kit-token-hygiene** — the habits that save tokens: prefix commands with `rtk`, read file ranges instead of whole files, never paste raw logs.

### Two ways to invoke every stage

- **Slash command** — `/kit-plan`. Reliable, autocompletes, composable. Requires workflows installed in the project (`… workflows`).
- **Wake word** — just write `kit-plan …` in your prompt. Convenient, but a heuristic. The hook ignores identifier-like text (`kit_helper.mjs`, `src/kit-plan/`), and bare `kit` only triggers as the first word.

---

## 5. Debugging with kit-debug

`kit-debug` exists because agents love to shotgun-fix. The contract forces discipline:

1. **Reproduce first** with a single command. No reproduction → gathering information *is* the task; don't guess-fix.
2. **Hypothesize** through the sequential-thinking tool when the cause isn't obvious — one hypothesis at a time, each with a falsifying check.
3. **Verify the mechanism** — show the exact line/state that causes the failure before touching code.
4. **Minimal fix** — change the least code that removes the cause; note unrelated cleanups for a separate task.
5. **Prove it** — the reproduction fails before and passes after; run the full suite.

---

## 6. Long-running goals with kit-goal

For work that spans sessions, `kit-goal` turns a brief into a checklist at `.agents/kit-goal.md`:

```markdown
# kit-goal: migrate auth to JWT

- [ ] access tokens issued on login — verify: `npm test auth/login`
- [ ] refresh flow works — verify: `npm test auth/refresh`
- [ ] old session code removed — verify: `grep -r session src/ | wc -l` == 0
```

The **goal-continuation hook** reads this file on every Stop event. While unchecked items remain, it asks the agent to keep going instead of stopping early. When every box is checked, it goes quiet. Items are checked only after their verification command runs.

---

## 7. Token optimization

Antigravity's #1 pain is quota that burns out in 10–15 minutes. The kit attacks it on three fronts:

1. **RTK** (terminal output). With `--with-rtk`, the kit installs the binary and runs `rtk init --agent antigravity`, which registers rtk's own rewrite hook — every `git status`, `npm test`, etc. gets compressed 60–90% automatically. The kit's `rtk-enforcer` hook is a gentle fallback that nudges you to prefix commands, and stays silent once rtk's native hook is active.
2. **Headroom** (everything else — logs, files, RAG). Registered as an MCP server; the agent calls `headroom_compress` on oversized blobs. Auto-enabled when the `headroom` CLI is present (`--with-headroom` installs it).
3. **tree_sitter** (avoiding reads entirely). The agent queries the AST for the symbol it needs instead of reading a 2000-line file — waste that never enters context needs no compressing.

**Escape hatches** for when you need raw output:

- `KIT_RAW=1 <command>` — run one command without the rtk nudge.
- `KIT_RTK_ENFORCE=off` — disable the nudge for the session.

To measure the savings on your own repo, follow [docs/token-benchmark.md](token-benchmark.md).

---

## 8. Preparing a /teamwork-preview run

`/teamwork-preview` (Antigravity 2.0, Ultra plan) spins up a multi-agent team but **a single run can burn a week's quota**, and it fails on vague briefs. So the kit makes you prepare:

```
/kit-teamwork build the analytics dashboard
```

This first checks fit — tightly coupled refactors and sequential tasks are steered back to `kit-plan` + `kit-work`, where they're cheaper and more reliable. If teamwork genuinely fits (broad, parallelizable work), it writes `.agents/kit/teamwork-brief.md` with success criteria (each with a verification command), explicit non-goals, and **non-overlapping lanes** — because parallel agents silently overwrite the same file if two of them touch it.

The skill never launches the run itself; the quota decision stays yours. Even if you just mention `/teamwork-preview` in passing, the wake-word hook reminds you to prepare a brief first.

---

## 9. Team setup

To give your whole team the same disciplined agent with zero per-person setup:

```bash
cd your-repo
npx github:sipki-tech/antigravity-kit#main install --full --workspace
npx github:sipki-tech/antigravity-kit#main workflows
git add .agents && git commit -m "add antigravity-kit"
```

Now `.agents/plugins/antigravity-kit/` and `.agents/workflows/` are in the repo. Anyone who opens the project in Antigravity gets the plugin, the hooks, the skills, and the `/kit-*` commands automatically — same rules, same review gates, same token discipline across the team.

What to commit vs. ignore: commit the plugin and workflows; plan files (`.agents/kit/plans/`) make useful PR artifacts if you want them, while `.agents/kit-goal.md` is usually transient. The default `.gitignore` treats `.agents/` as ignored — adjust per your team's preference.

---

## 10. Safety & escape hatches

The kit is designed to never break your session:

- **All hooks are fail-open.** Any internal error resolves to "allow" — a bug in a hook can't block your work.
- **danger-guard** blocks only high-confidence dangers: `rm -rf` outside the workspace, force-push to main/master, reading `.env*`/keys. Everything else passes.
- **Missing tools degrade gracefully.** No rtk binary? Commands run plain. No headroom? That MCP entry stays disabled.
- **`KIT_SAFE_MODE`** is reserved as a global kill-switch for future hook features.

Permission profiles (`--permission-profile safe|balanced|full|none`, default `safe`) tune how much the agent may auto-approve; enforcement currently comes from the rules and hooks while Antigravity's settings schema stabilizes.

---

## 11. Troubleshooting

**`npx antigravity-kit` installs the wrong thing.** The unscoped name on npm is an unrelated package. Always use the GitHub form: `npx github:sipki-tech/antigravity-kit#main`.

**My changes aren't picked up.** npx caches GitHub installs. Add `#main` to force the latest commit, or run `npm cache clean --force`.

**`verify` fails after a workspace install.** Use `verify --workspace` — plain `verify` checks the global `~/.gemini` location.

**The plugin folder is empty / not where I expected.** `--workspace` installs into `<project>/.agents/plugins/`, not the global `~/.gemini/config/plugins/`. Skills live *inside* the plugin directory, not in a separate skills folder. And check you didn't run with `--dry-run`, which writes nothing.

**Wake words don't trigger.** Prefer the slash commands (`/kit-plan`) — they're reliable. Wake words are a heuristic and deliberately ignore code-like context.

**Subagents (`kit-planner`, `kit-reviewer`) don't appear.** Custom subagents may require a paid Antigravity plan. The rest of the kit works regardless.

---

## 12. FAQ

**Do I have to use the whole cycle every time?** No. Trivial edits can go straight to `/kit-loop`; small fixes need no plan. The cycle is for work where discipline pays off.

**Does it work outside Antigravity?** The skills are portable Agent Skills format. `install --host claude-code` or `--host codex` copies the skill corpus there. Hooks and the manifest are Antigravity-specific — details in [docs/portability.md](portability.md).

**Will it slow me down?** The hooks add milliseconds and are fail-open. The token savings and the "no rework because the plan was clear" effect more than pay for the structure.

**Can I customize the rules?** Yes — edit `rules/*.md` in the plugin (output style, safety policy, workflow conventions). On a workspace install they live in `.agents/plugins/antigravity-kit/rules/`.
