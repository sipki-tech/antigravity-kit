---
description: Show the current spec-pipeline phase, registered artifact, and tasks
---

1. Resolve the engine:
   ```sh
   KIT_PIPELINE="$([ -f .agents/plugins/antigravity-kit/scripts/pipeline.mjs ] \
     && echo .agents/plugins/antigravity-kit/scripts/pipeline.mjs \
     || echo "$HOME/.gemini/config/plugins/antigravity-kit/scripts/pipeline.mjs")"
   ```
2. Run `node "$KIT_PIPELINE" status`. If it reports no active pipeline, offer to start one with `/kit-spec`.
3. If the engine can't be located, run `node "$KIT_PIPELINE" doctor` to diagnose project root and state directory.
