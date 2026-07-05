# Portability: one skill corpus, many hosts

The kit's core is deliberately host-agnostic: skills are plain Agent Skills (`SKILL.md` + `name`/`description` frontmatter) and MCP servers are standard. Only the thin adapter layer (plugin.json, hooks.json, installer paths) is Antigravity-specific.

## Claude Code

```bash
npx github:sipki-tech/antigravity-kit install --host claude-code
```

Copies the nine `kit-*` skills into `~/.claude/skills/`. They are picked up as personal skills; invoke by describing the task or naming the skill. Notes:

- The wake-word/danger/rtk hooks are **not** ported — Claude Code has its own hooks system (`~/.claude/settings.json`); rtk supports it directly via `rtk init -g`.
- MCP servers: add `sequential-thinking` etc. with `claude mcp add`.

## Codex

```bash
npx github:sipki-tech/antigravity-kit install --host codex
```

Copies the skills into `~/.codex/skills/`. Check your Codex version's skills support; older versions only read `AGENTS.md`, in which case paste the relevant playbooks there instead.

## What does not port

- Root-level `hooks.json` and `scripts/*.mjs` — Antigravity hook API only (the scripts' logic is reusable; the wire format is not).
- `plugin.json` — Antigravity manifest.
- `rules/` — copy the content into the host's equivalent (CLAUDE.md / AGENTS.md) manually if wanted.
