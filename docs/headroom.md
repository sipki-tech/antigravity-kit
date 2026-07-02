# Headroom integration

Headroom compresses everything the agent reads (tool outputs, logs, files, RAG chunks) before it reaches the LLM: 60–95% fewer tokens, reversible (originals cached for retrieval). Repo: https://github.com/chopratejas/headroom

It complements RTK — they work on different token streams and the savings multiply:

```
terminal command output --> [RTK: CLI proxy]            --> agent context
agent context / files   --> [Headroom: wire compression] --> LLM API
```

## Supported mode: MCP server (v1)

`headroom wrap` does **not** support Antigravity (supported: Claude Code, Codex, Cursor, Aider, Cline, Continue, Goose, OpenHands and others). For Antigravity use the MCP mode — on-demand compression, no traffic interception:

1. Install the CLI: `pip install "headroom-ai[all]"` (Python 3.10+).
2. Enable the pre-registered server: in `~/.gemini/config/mcp_config.json` remove `"disabled": true` from the `headroom` entry (the antigravity-kit installer registers it disabled by default).
3. Restart Antigravity. Three tools become available:
   - `headroom_compress` — compress a large blob before it enters the context;
   - `headroom_retrieve` — fetch the original of a compressed block (reversible, cached with a TTL);
   - `headroom_stats` — compression metrics.

The `kit-token-hygiene` skill instructs the agent to route oversized logs/files through `headroom_compress` when the server is configured.

## Experimental mode: proxy (v2 spike)

`headroom proxy --port 8787` starts an OpenAI/Anthropic-compatible HTTP proxy that compresses transparently. For Antigravity this remains **unverified**: there is no documented way to point Antigravity's model traffic at a local proxy, and the preview may not expose a base-URL override.

If you want to spike it:

1. `headroom proxy --port 8787`
2. Look for a model endpoint override in Antigravity settings (`~/.gemini/antigravity-cli/settings.json`) or environment (`*_BASE_URL`). If none exists in your build, the proxy mode is not usable — stay on MCP mode.
3. If an override exists, point it at `http://127.0.0.1:8787` and compare token usage per docs/token-benchmark.md.

Treat any success here as build-specific until Antigravity documents endpoint overrides.
