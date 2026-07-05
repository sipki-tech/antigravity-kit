import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";

import {
  detectAlias,
  aliasFromTranscript,
  detectTeamwork,
} from "../plugins/antigravity-kit/scripts/kit-wake-word.mjs";
import { promptTextOf } from "../plugins/antigravity-kit/scripts/lib/io.mjs";
import { checkCommand as dangerCheck } from "../plugins/antigravity-kit/scripts/danger-guard.mjs";
import { checkCommand as rtkCheck } from "../plugins/antigravity-kit/scripts/rtk-enforcer.mjs";
import {
  reminderFor,
  isSensitivePath,
} from "../plugins/antigravity-kit/scripts/diagnostics-handoff.mjs";
import {
  continuation,
  pipelineContinuation,
} from "../plugins/antigravity-kit/scripts/goal-continuation.mjs";
import { init as pipelineInit } from "../plugins/antigravity-kit/scripts/lib/pipeline-core.mjs";
import { mkdirSync } from "node:fs";

const SCRIPTS = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "plugins",
  "antigravity-kit",
  "scripts",
);

function runScript(name, input) {
  const res = spawnSync(process.execPath, [join(SCRIPTS, name)], {
    input: JSON.stringify(input),
    encoding: "utf8",
    timeout: 10000,
  });
  assert.equal(res.status, 0, `${name} must exit 0; stderr: ${res.stderr}`);
  return JSON.parse(res.stdout);
}

// --- wake-word ---

test("wake-word: detects stage aliases", () => {
  assert.equal(detectAlias("kit-plan this migration"), "kit-plan");
  assert.equal(detectAlias("please kit-review the diff"), "kit-review");
  assert.equal(detectAlias("kit-remove-ai-slops now"), "kit-remove-ai-slops");
  assert.equal(detectAlias("kit-teamwork prep for the migration"), "kit-teamwork");
  assert.equal(detectAlias("kit-spec the billing feature"), "kit-spec");
});

test("kit-spec alias injects the pipeline directive", () => {
  const hit = runScript("kit-wake-word.mjs", { prompt: "kit-spec this feature" });
  assert.match(hit.injectSteps[0].userMessage, /spec pipeline/);
  assert.match(hit.injectSteps[0].userMessage, /STOP at the gate/);
});

test("kit-teamwork alias injects the brief directive", () => {
  const hit = runScript("kit-wake-word.mjs", { prompt: "kit-teamwork this epic" });
  assert.match(hit.injectSteps[0].userMessage, /teamwork-brief\.md/);
  assert.match(hit.injectSteps[0].userMessage, /Never launch/);
});

test("wake-word: bare kit only as leading token", () => {
  assert.equal(detectAlias("kit finish this change"), "kit");
  assert.equal(detectAlias("I bought a kit yesterday"), null);
});

test("wake-word: ignores identifier-like text", () => {
  assert.equal(detectAlias("open kit_helper.mjs please"), null);
  assert.equal(detectAlias("see src/kit-plan/index.ts"), null);
  assert.equal(detectAlias("fix kit-plan.spec.ts"), null);
});

test("wake-word e2e: injects via injectSteps, silent is {}", () => {
  const hit = runScript("kit-wake-word.mjs", { prompt: "kit-plan the refactor" });
  assert.match(hit.injectSteps[0].userMessage, /kit-plan stage/);
  const miss = runScript("kit-wake-word.mjs", { prompt: "hello world" });
  assert.deepEqual(miss, {});
});

test("wake-word e2e: reads prompt from steps[].userMessage", () => {
  const hit = runScript("kit-wake-word.mjs", {
    steps: [
      { userMessage: "earlier message" },
      { userMessage: "kit-review this diff" },
    ],
  });
  assert.match(hit.injectSteps[0].userMessage, /kit-review stage/);
});

test("promptTextOf: prefers direct fields, falls back to last steps entry", () => {
  assert.equal(promptTextOf({ prompt: "a", steps: [{ userMessage: "b" }] }), "a");
  assert.equal(
    promptTextOf({ steps: [{ userMessage: "b" }, { userMessage: "c" }] }),
    "c",
  );
  assert.equal(promptTextOf({}), "");
});

test("wake-word: transcript fallback matches user records only", () => {
  const lines = [
    JSON.stringify({ role: "user", content: "hello there" }),
    JSON.stringify({ role: "assistant", content: "run kit-review now" }),
    JSON.stringify({ role: "user", content: "kit-debug this failure" }),
    JSON.stringify({ role: "tool", output: "kit-plan mentioned in tool output" }),
  ].join("\n");
  assert.equal(aliasFromTranscript(lines), "kit-debug");
  assert.equal(
    aliasFromTranscript(JSON.stringify({ role: "assistant", content: "kit-plan x" })),
    null,
  );
  assert.equal(aliasFromTranscript(""), null);
});

test("wake-word e2e: transcriptPath fallback end-to-end", () => {
  const dir = mkdtempSync(join(tmpdir(), "kit-transcript-"));
  const transcript = join(dir, "session.jsonl");
  writeFileSync(
    transcript,
    JSON.stringify({ role: "user", content: "kit-goal turn this brief into criteria" }) + "\n",
  );
  const hit = runScript("kit-wake-word.mjs", { transcriptPath: transcript });
  assert.match(hit.injectSteps[0].userMessage, /kit-goal stage/);
});

test("teamwork-preview mention triggers the quota-guard directive", () => {
  assert.equal(detectTeamwork("run /teamwork-preview on this"), true);
  assert.equal(detectTeamwork("/teamwork-preview"), true);
  assert.equal(detectTeamwork("what is teamwork-preview?"), true);
  assert.equal(detectTeamwork("we value teamwork here"), false);
  assert.equal(detectTeamwork(""), false);

  const hit = runScript("kit-wake-word.mjs", { prompt: "let's /teamwork-preview the rewrite" });
  assert.match(hit.injectSteps[0].userMessage, /week's quota/);
  // kit aliases take precedence over the teamwork nudge.
  const both = runScript("kit-wake-word.mjs", { prompt: "kit-plan before /teamwork-preview" });
  assert.match(both.injectSteps[0].userMessage, /kit-plan stage/);
});

// --- danger-guard ---

const CWD = "/tmp/work/project";

test("danger-guard: blocks rm -rf outside workspace", () => {
  assert.equal(dangerCheck("rm -rf /", CWD).allow_tool, false);
  assert.equal(dangerCheck("rm -rf ~/stuff", CWD).allow_tool, false);
  assert.equal(dangerCheck("rm -rf /etc/foo", CWD).allow_tool, false);
  assert.equal(dangerCheck("rm -rf ../other", CWD).allow_tool, false);
  assert.equal(dangerCheck(`rm -rf ${CWD}`, CWD).allow_tool, false);
});

test("danger-guard: denies speak both response dialects (official + legacy)", () => {
  const denied = dangerCheck("rm -rf /", CWD);
  assert.equal(denied.decision, "deny");
  assert.equal(denied.reason, denied.deny_reason);
  const allowed = dangerCheck("ls -la", CWD);
  assert.equal(allowed.decision, "allow");
  assert.equal(allowed.allow_tool, true);
});

test("danger-guard: normalizes path variants of the workspace root", () => {
  // Regression: trailing slash / dot variants must not bypass the root check.
  assert.equal(dangerCheck(`rm -rf ${CWD}/`, CWD).allow_tool, false);
  assert.equal(dangerCheck(`rm -rf ${CWD}/.`, CWD).allow_tool, false);
  assert.equal(dangerCheck("rm -rf .", CWD).allow_tool, false);
  assert.equal(dangerCheck("rm -rf ./", CWD).allow_tool, false);
  assert.equal(dangerCheck("rm -rf subdir/..", CWD).allow_tool, false);
});

test("danger-guard: catches rm behind sudo/env/assignment wrappers", () => {
  assert.equal(dangerCheck("sudo rm -rf /", CWD).allow_tool, false);
  assert.equal(dangerCheck("env rm -rf ~", CWD).allow_tool, false);
  assert.equal(dangerCheck("FOO=1 rm -rf /etc/foo", CWD).allow_tool, false);
  assert.equal(dangerCheck("cd /tmp && sudo rm -rf /etc/foo", CWD).allow_tool, false);
  assert.equal(dangerCheck('rm -rf "/etc/foo"', CWD).allow_tool, false);
  // One in-workspace target plus one outside: still denied.
  assert.equal(dangerCheck("rm -rf ./dist /etc/foo", CWD).allow_tool, false);
});

test("danger-guard: allows rm -rf inside workspace and non-recursive rm", () => {
  assert.equal(dangerCheck("rm -rf node_modules", CWD).allow_tool, true);
  assert.equal(dangerCheck("rm -rf ./dist build", CWD).allow_tool, true);
  assert.equal(dangerCheck("rm file.txt", CWD).allow_tool, true);
});

test("danger-guard: blocks force push to main, allows lease to feature", () => {
  assert.equal(
    dangerCheck("git push --force origin main", CWD).allow_tool,
    false,
  );
  assert.equal(dangerCheck("git push -f origin master", CWD).allow_tool, false);
  assert.equal(dangerCheck("git push --force", CWD).allow_tool, false);
  assert.equal(
    dangerCheck("git push --force-with-lease origin feature-x", CWD).allow_tool,
    true,
  );
  assert.equal(dangerCheck("git push origin main", CWD).allow_tool, true);
});

test("danger-guard: blocks +main refspec force push, allows +feature", () => {
  assert.equal(dangerCheck("git push origin +main", CWD).allow_tool, false);
  assert.equal(dangerCheck("git push origin +master", CWD).allow_tool, false);
  assert.equal(dangerCheck("git push origin +feature-x", CWD).allow_tool, true);
});

test("danger-guard: blocks secret reads behind wrappers", () => {
  assert.equal(dangerCheck("sudo cat .env", CWD).allow_tool, false);
  assert.equal(dangerCheck("FOO=1 head ~/.ssh/id_rsa", CWD).allow_tool, false);
});

test("danger-guard: blocks secret reads, allows templates", () => {
  assert.equal(dangerCheck("cat .env", CWD).allow_tool, false);
  assert.equal(dangerCheck("cat .env.production", CWD).allow_tool, false);
  assert.equal(dangerCheck("head ~/.ssh/id_rsa", CWD).allow_tool, false);
  assert.equal(dangerCheck("grep key credentials.json", CWD).allow_tool, false);
  assert.equal(dangerCheck("cat .env.example", CWD).allow_tool, true);
  assert.equal(dangerCheck("cat README.md", CWD).allow_tool, true);
});

test("danger-guard e2e: deny ships a reason, junk input allows", () => {
  const denied = runScript("danger-guard.mjs", {
    toolCall: { args: { CommandLine: "rm -rf /" } },
    cwd: CWD,
  });
  assert.equal(denied.allow_tool, false);
  assert.match(denied.deny_reason, /danger-guard/);
  const junk = runScript("danger-guard.mjs", { totally: "unexpected" });
  assert.equal(junk.allow_tool, true);
});

// --- rtk-enforcer (probes injected so tests don't depend on the machine) ---

const rtkOn = { rtkAvailable: () => true, rtkHookAlreadyInstalled: () => false };

test("rtk-enforcer: nudges listed commands when rtk present and unhooked", () => {
  const res = rtkCheck("git status", {}, rtkOn);
  assert.equal(res.allow_tool, false);
  assert.match(res.deny_reason, /rtk git status/);
});

test("rtk-enforcer: sees through env-assignment prefixes", () => {
  const res = rtkCheck("NODE_ENV=test npm run build", {}, rtkOn);
  assert.equal(res.allow_tool, false);
  assert.match(res.deny_reason, /NODE_ENV=test rtk npm run build/);
  // KIT_RAW=1 stays a bypass even though it is an env assignment.
  assert.equal(rtkCheck("KIT_RAW=1 npm run build", {}, rtkOn).allow_tool, true);
});

test("rtk-enforcer: silent when prefixed, bypassed, complex, or unlisted", () => {
  assert.equal(rtkCheck("rtk git status", {}, rtkOn).allow_tool, true);
  assert.equal(rtkCheck("KIT_RAW=1 git status", {}, rtkOn).allow_tool, true);
  assert.equal(rtkCheck("git log | head -5", {}, rtkOn).allow_tool, true);
  assert.equal(rtkCheck("echo hello", {}, rtkOn).allow_tool, true);
  assert.equal(
    rtkCheck("git status", { KIT_RTK_ENFORCE: "off" }, rtkOn).allow_tool,
    true,
  );
});

test("rtk-enforcer: silent when rtk missing or its own hook installed", () => {
  assert.equal(
    rtkCheck("git status", {}, { ...rtkOn, rtkAvailable: () => false })
      .allow_tool,
    true,
  );
  assert.equal(
    rtkCheck("git status", {}, { ...rtkOn, rtkHookAlreadyInstalled: () => true })
      .allow_tool,
    true,
  );
});

// --- diagnostics-handoff ---

test("diagnostics-handoff: reminds for known extensions only", () => {
  assert.match(reminderFor("src/app.ts"), /tsc/);
  assert.match(reminderFor("main.py"), /pytest/);
  assert.equal(reminderFor("notes.txt"), null);
  assert.equal(reminderFor(""), null);
});

test("diagnostics-handoff: security nudge on sensitive paths, token-exact", () => {
  assert.match(reminderFor("src/auth/login.ts"), /security-sensitive/);
  assert.match(reminderFor("payments/charge.py"), /security-sensitive/);
  // Sensitive path fires even without a known-extension checks entry.
  assert.match(reminderFor("config/secrets.yaml"), /security-sensitive/);
  // Whole-token matching: tokenizer/author must not trigger.
  assert.equal(isSensitivePath("lib/tokenizer.ts"), false);
  assert.equal(isSensitivePath("src/author.ts"), false);
  assert.doesNotMatch(reminderFor("lib/tokenizer.ts"), /security-sensitive/);
  assert.equal(reminderFor("README.md"), null);
});

// --- goal-continuation ---

test("goal-continuation: continues on unchecked items, silent when done", () => {
  const active = continuation("# kit-goal: x\n\n- [ ] run tests\n- [x] done one\n");
  assert.equal(active.decision, "continue");
  assert.match(active.reason, /1 checklist item/);
  assert.equal(continuation("- [x] all\n- [x] done\n"), null);
  assert.equal(continuation(""), null);
});

test("goal-continuation e2e: Stop wire format", () => {
  const idle = runScript("goal-continuation.mjs", { cwd: tmpdir() });
  assert.deepEqual(idle, { decision: "" });
  const busy = runScript("goal-continuation.mjs", { fullyIdle: false });
  assert.equal(busy.decision, "continue");
  assert.match(busy.reason, /Background work/);
});

test("goal-continuation surfaces an unfinished spec pipeline on Stop", () => {
  const proj = mkdtempSync(join(tmpdir(), "kit-stop-pipe-"));
  mkdirSync(join(proj, ".git"), { recursive: true });
  assert.equal(pipelineContinuation(proj), null); // no pipeline yet
  pipelineInit("checkout-flow", { root: proj });
  const cont = pipelineContinuation(proj);
  assert.equal(cont.decision, "continue");
  assert.match(cont.reason, /checkout-flow/);
  assert.match(cont.reason, /explore/);
});
