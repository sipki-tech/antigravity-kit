---
description: Approve the current spec-pipeline phase and advance to the next one
---

1. Resolve the engine:
   ```sh
   KIT_PIPELINE="$([ -f .agents/plugins/antigravity-kit/scripts/pipeline.mjs ] \
     && echo .agents/plugins/antigravity-kit/scripts/pipeline.mjs \
     || echo "$HOME/.gemini/config/plugins/antigravity-kit/scripts/pipeline.mjs")"
   ```
2. Confirm the current phase's artifact is written and registered: `node "$KIT_PIPELINE" status`.
3. Advance: `node "$KIT_PIPELINE" approve`. The engine refuses if no artifact is registered — write and register it first.
4. Report the new phase and start it via the `kit-spec` skill.
