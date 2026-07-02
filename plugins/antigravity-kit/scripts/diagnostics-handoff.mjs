#!/usr/bin/env node
// PostToolUse (file edits): guidance-only reminder to run the project's own
// checks on changed files. Does not run any tooling itself (asw-lsp pattern).

import { extname } from "node:path";
import { pathToFileURL } from "node:url";
import { runHook, editedFileOf, injectResponse } from "./lib/io.mjs";

const CHECKS = {
  ".ts": "tsc / eslint / project test suite",
  ".tsx": "tsc / eslint / project test suite",
  ".js": "eslint / project test suite",
  ".jsx": "eslint / project test suite",
  ".mjs": "eslint / node --test",
  ".py": "ruff / mypy / pytest",
  ".go": "go vet / go test",
  ".rs": "cargo check / cargo test",
  ".dart": "dart analyze / flutter test",
  ".rb": "rubocop / rspec",
  ".java": "project build / tests",
  ".kt": "project build / tests",
};

export function reminderFor(file) {
  if (!file) return null;
  const checks = CHECKS[extname(file).toLowerCase()];
  if (!checks) return null;
  return `[antigravity-kit] ${file} changed — before moving on, run the project's own checks (${checks}) with the rtk prefix. Guidance only; nothing was executed.`;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href)
runHook((input) => {
  const note = reminderFor(editedFileOf(input));
  if (!note) return { allow_tool: true };
  // Injection on PostToolUse is unverified in Antigravity (ASW no-ops here);
  // unknown keys are ignored, so this degrades to a plain allow.
  return { allow_tool: true, ...injectResponse(note) };
});
