#!/usr/bin/env node
// Stop: if .agents/kit-goal.md still has unchecked items, ask the agent to
// continue instead of stopping. Silent when no goal file or all items done.

import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { runHook, cwdOf } from "./lib/io.mjs";
import { readTextSafe } from "./lib/detect.mjs";
import { activePipeline, findProjectRoot } from "./lib/pipeline-core.mjs";

export function continuation(goalText) {
  if (!goalText) return null;
  const unchecked = goalText
    .split("\n")
    .filter((line) => /^\s*-\s*\[\s\]/.test(line))
    .map((line) => line.replace(/^\s*-\s*\[\s\]\s*/, "").trim())
    .filter(Boolean);
  if (unchecked.length === 0) return null;
  const preview = unchecked.slice(0, 3).join("; ");
  const reason =
    `[antigravity-kit kit-goal] ${unchecked.length} checklist item(s) remain in .agents/kit-goal.md: ` +
    `${preview}${unchecked.length > 3 ? "; …" : ""}. Continue working the checklist or tell the user why it is blocked.`;
  return { decision: "continue", reason };
}

// Native integration SDD can't do: surface an unfinished spec pipeline on Stop.
export function pipelineContinuation(cwd) {
  try {
    const state = activePipeline(findProjectRoot(cwd));
    if (!state) return null;
    return {
      decision: "continue",
      reason:
        `[antigravity-kit kit-spec] Pipeline '${state.feature}' is at phase '${state.phase}'` +
        `${state.artifact ? " (artifact registered, awaiting approval)" : " (artifact not yet written)"}. ` +
        "Keep driving this phase to completion; do not stop until it is approved or the user pauses it.",
    };
  } catch {
    return null;
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href)
runHook((input) => {
  // Active background work outranks the goal file (asw-stop-check pattern).
  if (input?.fullyIdle === false) {
    return {
      decision: "continue",
      reason:
        "[antigravity-kit] Background work is still running. Continue until spawned work is idle, verified, and cleaned up.",
    };
  }
  const cwd = cwdOf(input);
  const goalFile = join(cwd, ".agents", "kit-goal.md");
  return (
    continuation(readTextSafe(goalFile)) ??
    pipelineContinuation(cwd) ??
    { decision: "" }
  );
}, { decision: "" });
