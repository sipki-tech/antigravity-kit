#!/usr/bin/env node
// PreToolUse (run_command): nudge dev commands through the rtk prefix.
// Strictly best-effort: silent no-op when rtk is absent, already enforced by
// rtk's own hook, explicitly bypassed (KIT_RAW=1 prefix), or the command is
// too complex to rewrite safely.

import { pathToFileURL } from "node:url";
import { runHook, commandLineOf, ALLOW } from "./lib/io.mjs";
import { rtkAvailable, rtkHookAlreadyInstalled } from "./lib/detect.mjs";

const PREFIXES = [
  "git",
  "npm",
  "pnpm",
  "yarn",
  "bun",
  "cargo",
  "go",
  "pytest",
  "jest",
  "vitest",
  "tsc",
  "eslint",
  "ruff",
  "mypy",
  "docker",
  "kubectl",
  "make",
  "gradle",
  "mvn",
  "pip",
  "bundle",
];

export function checkCommand(cmd, env = process.env, probes = {}) {
  if (!cmd || typeof cmd !== "string") return ALLOW;
  const trimmed = cmd.trim();

  if (env.KIT_RTK_ENFORCE === "off") return ALLOW;
  if (trimmed.startsWith("rtk ") || trimmed === "rtk") return ALLOW;
  if (/^KIT_RAW=1\s/.test(trimmed)) return ALLOW; // documented bypass
  // Compound/redirected commands: rewriting is risky, stay out of the way.
  if (/[|;&><$`]/.test(trimmed)) return ALLOW;

  const first = trimmed.split(/\s+/)[0];
  if (!PREFIXES.includes(first)) return ALLOW;

  const available = probes.rtkAvailable ?? rtkAvailable;
  const alreadyHooked = probes.rtkHookAlreadyInstalled ?? rtkHookAlreadyInstalled;
  if (!available()) return ALLOW;
  if (alreadyHooked()) return ALLOW;

  return {
    allow_tool: false,
    deny_reason: `[antigravity-kit token-hygiene] Run this through rtk to compress the output: \`rtk ${trimmed}\`. To intentionally run raw, prefix with KIT_RAW=1.`,
  };
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href)
  runHook((input) => checkCommand(commandLineOf(input)));
