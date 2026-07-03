// Spec-pipeline state engine — importable core (CLI wrapper: ../pipeline.mjs).
// Deterministic phase tracker with approval gates. State lives in the PROJECT
// (resolved from cwd), never next to this script, so global and workspace
// installs behave identically. Inspired by sipki-tech/sdd's pipeline.sh.

import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, isAbsolute, join, resolve } from "node:path";

export const PHASES = [
  "explore",
  "requirements",
  "design",
  "task-plan",
  "implementation",
  "review",
];
export const DONE = "done";

const FEATURE_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export class PipelineError extends Error {}

// --- location resolution -------------------------------------------------

// Walk up from `start` to the nearest project root (a dir containing .git or
// .agents); fall back to `start` itself (SDD's "fallback to pwd" behavior).
export function findProjectRoot(start = process.cwd()) {
  let dir = resolve(start);
  for (;;) {
    if (existsSync(join(dir, ".git")) || existsSync(join(dir, ".agents"))) {
      return dir;
    }
    const parent = dirname(dir);
    if (parent === dir) return resolve(start);
    dir = parent;
  }
}

export function pipelineDir(root = findProjectRoot()) {
  return join(root, ".agents", "kit", "pipeline");
}

function featureDir(feature, root) {
  return join(pipelineDir(root), feature);
}

function statePath(feature, root) {
  return join(featureDir(feature, root), "state.json");
}

// --- atomic io -----------------------------------------------------------

function writeAtomic(file, text) {
  mkdirSync(dirname(file), { recursive: true });
  const tmp = `${file}.tmp-${process.pid}`;
  writeFileSync(tmp, text);
  renameSync(tmp, file);
}

function readState(feature, root) {
  const file = statePath(feature, root);
  if (!existsSync(file)) return null;
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch {
    throw new PipelineError(`corrupt state for '${feature}': ${file}`);
  }
}

function saveState(state, root) {
  writeAtomic(statePath(state.feature, root), JSON.stringify(state, null, 2) + "\n");
}

// --- validation ----------------------------------------------------------

function assertFeatureName(feature) {
  if (!feature || !FEATURE_RE.test(feature) || feature.length > 64) {
    throw new PipelineError(
      `invalid feature name '${feature}' (kebab-case, 1–64 chars)`,
    );
  }
}

function assertSafeRelPath(p) {
  if (!p || typeof p !== "string") throw new PipelineError("artifact path required");
  if (isAbsolute(p) || p.split(/[\\/]/).includes("..")) {
    throw new PipelineError(`unsafe artifact path '${p}' (must be relative, no ..)`);
  }
}

// Non-fatal per-phase content hints (ported from SDD).
const PHASE_LINT = {
  requirements: (t) =>
    /\bWHEN\b/.test(t) && /\bSHALL\b/.test(t)
      ? null
      : "requirements should use WHEN/SHALL grammar",
  explore: (t) => (/option/i.test(t) ? null : "explore should list options"),
  design: (t) => (t.trim().length > 0 ? null : "design artifact is empty"),
};

export function lintArtifact(phase, text) {
  return PHASE_LINT[phase]?.(text ?? "") ?? null;
}

// --- state helpers -------------------------------------------------------

function newState(feature) {
  return {
    feature,
    phase: PHASES[0],
    artifact: null,
    history: [],
    tasks: {},
  };
}

export function activeFeatures(root = findProjectRoot()) {
  const dir = pipelineDir(root);
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => existsSync(statePath(f, root)));
}

function resolveFeature(feature, root) {
  if (feature) return feature;
  const active = activeFeatures(root)
    .map((f) => readState(f, root))
    .filter((s) => s && s.phase !== DONE);
  if (active.length === 1) return active[0].feature;
  if (active.length === 0) throw new PipelineError("no active pipeline; run `init <feature>`");
  throw new PipelineError(
    `multiple active pipelines (${active.map((s) => s.feature).join(", ")}); pass a feature name`,
  );
}

function loadOrThrow(feature, root) {
  const state = readState(feature, root);
  if (!state) throw new PipelineError(`no pipeline '${feature}'`);
  return state;
}

// --- commands ------------------------------------------------------------

export function init(feature, { root = findProjectRoot() } = {}) {
  assertFeatureName(feature);
  const existing = readState(feature, root);
  if (existing && existing.phase !== DONE) {
    throw new PipelineError(`pipeline '${feature}' already active at phase '${existing.phase}'`);
  }
  const state = newState(feature);
  saveState(state, root);
  return state;
}

export function registerArtifact(relPath, { feature, root = findProjectRoot() } = {}) {
  const f = resolveFeature(feature, root);
  const state = loadOrThrow(f, root);
  if (state.phase === DONE) throw new PipelineError(`pipeline '${f}' is done`);
  assertSafeRelPath(relPath);
  state.artifact = relPath;
  saveState(state, root);
  const abs = join(featureDir(f, root), relPath);
  const warn = existsSync(abs)
    ? lintArtifact(state.phase, readFileSync(abs, "utf8"))
    : null;
  return { state, warning: warn };
}

export function approve({ feature, root = findProjectRoot() } = {}) {
  const f = resolveFeature(feature, root);
  const state = loadOrThrow(f, root);
  if (state.phase === DONE) throw new PipelineError(`pipeline '${f}' is already done`);
  if (!state.artifact) {
    throw new PipelineError(`register an artifact before approving phase '${state.phase}'`);
  }
  state.history.push({ phase: state.phase, artifact: state.artifact });
  const idx = PHASES.indexOf(state.phase);
  state.phase = idx + 1 < PHASES.length ? PHASES[idx + 1] : DONE;
  state.artifact = null;
  saveState(state, root);
  return state;
}

export function inject(phase, relPath, { feature, root = findProjectRoot() } = {}) {
  const target = PHASES.indexOf(phase);
  if (target < 0) throw new PipelineError(`unknown phase '${phase}'`);
  const f = resolveFeature(feature, root);
  const state = loadOrThrow(f, root);
  const current = PHASES.indexOf(state.phase);
  if (state.phase !== DONE && target < current) {
    throw new PipelineError(`cannot inject backward (at '${state.phase}', target '${phase}')`);
  }
  assertSafeRelPath(relPath);
  for (let i = current; i < target; i++) {
    state.history.push({ phase: PHASES[i], injected: true });
  }
  state.phase = phase;
  state.artifact = relPath;
  saveState(state, root);
  return state;
}

export function abandon({ feature, root = findProjectRoot() } = {}) {
  const f = resolveFeature(feature, root);
  loadOrThrow(f, root);
  rmSync(featureDir(f, root), { recursive: true, force: true });
  return { feature: f, abandoned: true };
}

export function setTask(id, status, { feature, root = findProjectRoot() } = {}) {
  if (!/^[A-Za-z]/.test(id)) throw new PipelineError(`task id must start with a letter: '${id}'`);
  const allowed = ["pending", "wip", "done", "blocked"];
  if (!allowed.includes(status)) {
    throw new PipelineError(`task status must be one of ${allowed.join("/")}`);
  }
  const f = resolveFeature(feature, root);
  const state = loadOrThrow(f, root);
  state.tasks[id] = status;
  saveState(state, root);
  return state;
}

export function status({ feature, root = findProjectRoot() } = {}) {
  const f = resolveFeature(feature, root);
  return loadOrThrow(f, root);
}

export function doctor({ root = findProjectRoot() } = {}) {
  return {
    projectRoot: root,
    stateDir: pipelineDir(root),
    cwd: process.cwd(),
    activeFeatures: activeFeatures(root),
  };
}

// Read-only accessor for hooks: the active un-approved pipeline, or null.
// Fail-open — never throws.
export function activePipeline(root = findProjectRoot()) {
  try {
    const states = activeFeatures(root)
      .map((f) => readState(f, root))
      .filter((s) => s && s.phase !== DONE);
    return states[0] ?? null;
  } catch {
    return null;
  }
}
