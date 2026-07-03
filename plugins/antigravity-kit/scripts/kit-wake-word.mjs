#!/usr/bin/env node
// PreInvocation: detect kit* wake words in the user prompt and inject a short
// stage directive. Never executes shell content from the prompt; ignores
// identifier-like occurrences (kit_helper.mjs, path/kit-plan/, `kit` in code).

import { pathToFileURL } from "node:url";
import {
  runHook,
  promptTextOf,
  transcriptPathOf,
  injectResponse,
  SILENT,
} from "./lib/io.mjs";
import { readTextSafe } from "./lib/detect.mjs";

const DIRECTIVES = {
  "kit-plan":
    "kit-plan stage: produce a plan with TL;DR, scope, checkbox steps, risks, and completion criteria, written to .agents/kit/plans/<slug>.md. No code edits. Use the sequential-thinking tool for decomposition when the task has >3 steps.",
  "kit-work":
    "kit-work stage: execute the plan file under .agents/kit/plans/ strictly, re-reading it before each step and checking off steps only after verification. Record deviations explicitly; scope changes go back to the user.",
  "kit-loop":
    "kit-loop stage: test-first cycles — failing test, minimal change, visible passing check. Run project commands with the rtk prefix and show only the relevant output lines.",
  kit:
    "kit-loop stage: test-first cycles — failing test, minimal change, visible passing check. Run project commands with the rtk prefix and show only the relevant output lines.",
  "kit-review":
    "kit-review stage: review the diff hunk by hunk, then MANDATORY run the project's tests and lint before any verdict. Verdict format: Blocking / Recommended / Checks.",
  "kit-clean":
    "kit-clean stage: remove AI slop (redundant comments, dead code, duplicate docs) from the current diff only, with zero behavior changes. Prove it by running tests and lint after.",
  "kit-remove-ai-slops":
    "kit-clean stage: remove AI slop (redundant comments, dead code, duplicate docs) from the current diff only, with zero behavior changes. Prove it by running tests and lint after.",
  "kit-debug":
    "kit-debug stage: reproduce the failure first, then hypothesize via sequential-thinking, verify the causal mechanism, apply the minimal fix, and show the reproduction passing.",
  "kit-goal":
    "kit-goal stage: convert the brief into verifiable criteria in .agents/kit-goal.md (markdown checklist). Check items only after running their verification.",
  "kit-teamwork":
    "kit-teamwork stage: prepare a /teamwork-preview brief in .agents/kit/teamwork-brief.md — success criteria with verification commands, scope with explicit non-goals, non-overlapping lanes. Advise against teamwork for coupled refactors (suggest kit-plan + kit-work). Never launch /teamwork-preview yourself.",
  "kit-spec":
    "kit-spec stage: drive the spec pipeline via pipeline.mjs (explore → requirements(WHEN/SHALL) → design → task-plan → implementation → review). Read templates/<phase>.md, write the artifact, register it, then STOP at the gate for the user's approval — never advance a phase yourself. Keep working the current phase until it is COMPLETELY resolved; on an engine error run doctor and retry. For small work use the light cycle (kit-plan) instead.",
};

// /teamwork-preview (Ultra plan) can burn a week's quota in one run and its
// brief is free-form — nudge preparation before an impulsive launch.
const TEAMWORK_DIRECTIVE =
  "The user mentioned /teamwork-preview. Before invoking it, prepare a complete brief via the kit-teamwork skill (/kit-teamwork): success criteria with verification commands, scope with explicit non-goals, non-overlapping work lanes — a single run can consume a week's quota, so a vague brief is expensive. For tightly coupled refactors prefer kit-plan + kit-work instead; teamwork runs handle those poorly.";

// Leading "/" is how the command is actually typed, so allow it explicitly.
const TEAMWORK_RE = /(^|[\s"'(])\/?teamwork-preview(?=$|[\s"'.,:!?)])/;

export function detectTeamwork(text) {
  return TEAMWORK_RE.test(text ?? "");
}

// Longest aliases first so kit-remove-ai-slops wins over kit.
const ALIASES = Object.keys(DIRECTIVES).sort((a, b) => b.length - a.length);

export function detectAlias(text) {
  if (!text) return null;
  for (const alias of ALIASES) {
    // Bare "kit" is too common a word: only honor it as the leading token.
    const pattern =
      alias === "kit"
        ? /^\s*kit(?=$|[\s.,:!?])/
        : new RegExp(
            `(^|[\\s"'(])${alias.replace(/[-]/g, "\\-")}(?=$|[\\s"'.,:!?)])`,
          );
    const m = pattern.exec(text);
    if (!m) continue;
    const idx = m.index + (m[1] ? m[1].length : 0);
    if (looksLikeIdentifier(text, idx, alias)) continue;
    return alias;
  }
  return null;
}

function looksLikeIdentifier(text, idx, alias) {
  const before = text.slice(Math.max(0, idx - 2), idx);
  const after = text.slice(idx + alias.length, idx + alias.length + 2);
  if (/[\w./\\`-]$/.test(before)) return true;
  if (/^[_./\\`]/.test(after)) return true;
  return false;
}

// Some payload shapes carry no prompt directly, only a path to the session
// transcript (JSONL). Scan the recent tail for a user record with an alias,
// skipping assistant/system/tool records (asw-hook pattern).
export function aliasFromTranscript(transcriptText) {
  if (!transcriptText) return null;
  const lines = transcriptText.trim().split(/\r?\n/).slice(-200);
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i];
    if (!line) continue;
    let text = line;
    try {
      const record = JSON.parse(line);
      const role = record.role ?? record.type ?? record.kind ?? "";
      if (typeof role === "string" && /assistant|system|tool/i.test(role))
        continue;
      text = collectStrings(record).join("\n");
    } catch {
      // Not JSON: match against the raw line.
    }
    const alias = detectAlias(text);
    if (alias) return alias;
  }
  return null;
}

function collectStrings(value, out = []) {
  if (typeof value === "string") {
    out.push(value);
  } else if (Array.isArray(value)) {
    for (const item of value) collectStrings(item, out);
  } else if (value && typeof value === "object") {
    for (const item of Object.values(value)) collectStrings(item, out);
  }
  return out;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href)
runHook((input) => {
  const prompt = promptTextOf(input);
  let alias = detectAlias(prompt);
  if (!alias) {
    const transcriptPath = transcriptPathOf(input);
    if (transcriptPath) alias = aliasFromTranscript(readTextSafe(transcriptPath));
  }
  if (alias) return injectResponse(DIRECTIVES[alias]);
  if (detectTeamwork(prompt)) return injectResponse(TEAMWORK_DIRECTIVE);
  return SILENT;
}, SILENT);
