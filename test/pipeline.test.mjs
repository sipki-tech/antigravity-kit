import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  existsSync,
  readFileSync,
  readdirSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  PHASES,
  PipelineError,
  init,
  registerArtifact,
  approve,
  inject,
  abandon,
  setTask,
  status,
  findProjectRoot,
  pipelineDir,
  activePipeline,
  lintArtifact,
} from "../plugins/antigravity-kit/scripts/lib/pipeline-core.mjs";

// Each test gets an isolated project dir marked with .git so root resolution
// is deterministic regardless of the real cwd.
function freshProject() {
  const dir = mkdtempSync(join(tmpdir(), "kit-pipe-"));
  mkdirSync(join(dir, ".git"), { recursive: true });
  return dir;
}

function writeArtifact(root, feature, rel, body = "content") {
  const abs = join(pipelineDir(root), feature, rel);
  mkdirSync(join(abs, ".."), { recursive: true });
  writeFileSync(abs, body);
  return rel;
}

test("state lands in the PROJECT, not next to the script", () => {
  const root = freshProject();
  init("demo", { root });
  assert.ok(existsSync(join(root, ".agents", "kit", "pipeline", "demo", "state.json")));
});

test("findProjectRoot walks up to .git / .agents", () => {
  const root = freshProject();
  const sub = join(root, "src", "deep");
  mkdirSync(sub, { recursive: true });
  assert.equal(findProjectRoot(sub), root);
});

test("full happy path advances through every phase to done", () => {
  const root = freshProject();
  init("feat", { root });
  for (const phase of PHASES) {
    assert.equal(status({ root }).phase, phase);
    writeArtifact(root, "feat", `${phase}.md`, "WHEN x, the system SHALL y. option A.");
    registerArtifact(`${phase}.md`, { root });
    approve({ root });
  }
  assert.equal(status({ feature: "feat", root }).phase, "done");
});

test("approve without a registered artifact is refused", () => {
  const root = freshProject();
  init("feat", { root });
  assert.throws(() => approve({ root }), PipelineError);
});

test("cannot inject backward; forward inject records intermediate phases", () => {
  const root = freshProject();
  init("feat", { root });
  // advance to design
  writeArtifact(root, "feat", "explore.md");
  registerArtifact("explore.md", { root });
  approve({ root });
  writeArtifact(root, "feat", "requirements.md");
  registerArtifact("requirements.md", { root });
  approve({ root }); // now at design
  assert.throws(() => inject("explore", "explore.md", { root }), PipelineError);

  writeArtifact(root, "feat", "impl.md");
  const s = inject("implementation", "impl.md", { root });
  assert.equal(s.phase, "implementation");
  assert.ok(s.history.some((h) => h.injected));
});

test("feature name validation and path-traversal guard", () => {
  const root = freshProject();
  assert.throws(() => init("Bad Name", { root }), PipelineError);
  assert.throws(() => init("../escape", { root }), PipelineError);
  init("ok-feature", { root });
  assert.throws(() => registerArtifact("../../etc/passwd", { root }), PipelineError);
  assert.throws(() => registerArtifact("/abs/path", { root }), PipelineError);
});

test("no-init operations throw; re-init of active pipeline throws", () => {
  const root = freshProject();
  assert.throws(() => status({ root }), PipelineError);
  init("feat", { root });
  assert.throws(() => init("feat", { root }), PipelineError);
});

test("abandon removes the pipeline", () => {
  const root = freshProject();
  init("feat", { root });
  abandon({ feature: "feat", root });
  assert.equal(existsSync(join(pipelineDir(root), "feat")), false);
});

test("tasks tracked; invalid id/status rejected", () => {
  const root = freshProject();
  init("feat", { root });
  setTask("T-1", "wip", { root });
  assert.equal(status({ root }).tasks["T-1"], "wip");
  assert.throws(() => setTask("1-bad", "wip", { root }), PipelineError);
  assert.throws(() => setTask("T-2", "nope", { root }), PipelineError);
});

test("artifact registration returns a non-fatal lint warning", () => {
  const root = freshProject();
  init("feat", { root }); // phase = explore
  writeArtifact(root, "feat", "explore.md", "just a plain investigation note");
  const { warning } = registerArtifact("explore.md", { root });
  assert.match(warning, /options/);
});

test("lintArtifact: requirements needs WHEN/SHALL", () => {
  assert.equal(lintArtifact("requirements", "WHEN a, the system SHALL b"), null);
  assert.match(lintArtifact("requirements", "just prose"), /WHEN\/SHALL/);
});

test("activePipeline returns the un-approved pipeline, null when done", () => {
  const root = freshProject();
  assert.equal(activePipeline(root), null);
  init("feat", { root });
  assert.equal(activePipeline(root)?.feature, "feat");
});

test("rapid successive writes leave state valid and no temp files behind", () => {
  const root = freshProject();
  init("feat", { root });
  for (let i = 1; i <= 20; i++) setTask(`T-${i}`, "wip", { root });
  const dir = join(pipelineDir(root), "feat");
  const state = JSON.parse(readFileSync(join(dir, "state.json"), "utf8"));
  assert.equal(Object.keys(state.tasks).length, 20);
  assert.deepEqual(
    readdirSync(dir).filter((f) => f.includes(".tmp-")),
    [],
  );
});

test("state stays valid JSON after each mutation (atomic)", () => {
  const root = freshProject();
  init("feat", { root });
  const file = join(pipelineDir(root), "feat", "state.json");
  JSON.parse(readFileSync(file, "utf8"));
  writeArtifact(root, "feat", "explore.md");
  registerArtifact("explore.md", { root });
  JSON.parse(readFileSync(file, "utf8"));
  approve({ root });
  JSON.parse(readFileSync(file, "utf8"));
});
