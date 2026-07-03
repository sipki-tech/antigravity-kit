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

// Path segments that mark a file as security-sensitive. Matched as whole
// tokens (split on /._- etc.) so `tokenizer.ts` or `author.ts` don't trigger.
const SENSITIVE_TOKENS = new Set([
  "auth", "oauth", "jwt", "acl", "sso",
  "session", "sessions", "login", "signin", "signup",
  "password", "passwords", "secret", "secrets", "token", "tokens",
  "payment", "payments", "billing", "checkout",
  "crypto", "credential", "credentials",
]);

export function isSensitivePath(file) {
  return file
    .toLowerCase()
    .split(/[\\/._\-\s]+/)
    .some((t) => SENSITIVE_TOKENS.has(t));
}

export function reminderFor(file) {
  if (!file) return null;
  const checks = CHECKS[extname(file).toLowerCase()];
  const sensitive = isSensitivePath(file);
  if (!checks && !sensitive) return null;
  let note = `[antigravity-kit] ${file} changed —`;
  if (checks)
    note += ` before moving on, run the project's own checks (${checks}) with the rtk prefix.`;
  if (sensitive)
    note += ` this path looks security-sensitive (auth/payments/secrets): review with kit-review's hardened checklist — input validation at boundaries, error paths that don't leak data, no hardcoded secrets.`;
  return note + " Guidance only; nothing was executed.";
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href)
runHook((input) => {
  const note = reminderFor(editedFileOf(input));
  if (!note) return { allow_tool: true };
  // Injection on PostToolUse is unverified in Antigravity (ASW no-ops here);
  // unknown keys are ignored, so this degrades to a plain allow.
  return { allow_tool: true, ...injectResponse(note) };
});
