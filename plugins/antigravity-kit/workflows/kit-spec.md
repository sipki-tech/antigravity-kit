---
description: Start or continue the spec-driven pipeline (explore → requirements → design → task-plan → implementation → review) with approval gates, for complex/high-stakes features
---

1. Load and follow the `kit-spec` skill playbook.
2. Decide fit first: small edits and bug fixes belong in the light cycle (`/kit-plan`), not here. Spec mode is for complex/high-stakes features.
3. Resolve the engine once and reuse it:
   ```sh
   KIT_PIPELINE="$([ -f .agents/plugins/antigravity-kit/scripts/pipeline.mjs ] \
     && echo .agents/plugins/antigravity-kit/scripts/pipeline.mjs \
     || echo "$HOME/.gemini/config/plugins/antigravity-kit/scripts/pipeline.mjs")"
   ```
4. Run `node "$KIT_PIPELINE" status` (or `init <feature-slug>` to start). Work the current phase using `templates/<phase>.md`; write the artifact to `.agents/kit/pipeline/<feature>/<phase>.md`; register it with `node "$KIT_PIPELINE" artifact <phase>.md`.
5. Stop at the gate — present the artifact and wait for the user's approval. On approval run `node "$KIT_PIPELINE" approve`. Never advance on your own.
6. task-plan → `/kit-plan`; implementation → `/kit-work` + `/kit-loop`; review → `/kit-review`.
