import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, existsSync, readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  install,
  uninstall,
  verify,
  listSkills,
  installWorkflows,
} from "../installer/install.mjs";
import { detectLayout } from "../installer/paths.mjs";

function freshHome() {
  return mkdtempSync(join(tmpdir(), "agy-kit-test-"));
}

test("detectLayout: global vs workspace, CLI mirror only when present", () => {
  const home = freshHome();
  const g = detectLayout({ home });
  assert.match(g.pluginDir, /\.gemini\/config\/plugins\/antigravity-kit$/);
  assert.deepEqual(g.mirrorPluginDirs, []);

  mkdirSync(join(home, ".gemini", "antigravity-cli", "plugins"), {
    recursive: true,
  });
  const g2 = detectLayout({ home });
  assert.equal(g2.mirrorPluginDirs.length, 1);

  const w = detectLayout({ workspace: "/proj" });
  assert.equal(w.pluginDir, "/proj/.agents/plugins/antigravity-kit");
  assert.equal(w.mcpConfigFile, "/proj/.agents/mcp_config.json");
});

test("dry-run plans actions without writing", () => {
  const home = freshHome();
  const { actions } = install({ home, dryRun: true });
  assert.ok(actions.length > 0);
  assert.equal(existsSync(join(home, ".gemini")), false);
});

test("install copies payload, merges mcp config, verify passes", () => {
  const home = freshHome();
  const { layout } = install({ home, headroomAvailable: false });
  assert.ok(existsSync(join(layout.pluginDir, "plugin.json")));
  assert.ok(existsSync(join(layout.pluginDir, "skills", "kit-plan", "SKILL.md")));
  assert.ok(existsSync(join(layout.pluginDir, "scripts", "danger-guard.mjs")));

  const mcp = JSON.parse(readFileSync(layout.mcpConfigFile, "utf8"));
  assert.ok(mcp.mcpServers["sequential-thinking"]);
  assert.equal(mcp.mcpServers["context7"].disabled, undefined, "context7 enabled by default");
  assert.equal(mcp.mcpServers["headroom"].disabled, true);

  const result = verify({ home });
  assert.equal(result.pass, true, JSON.stringify(result.checks));
});

test("headroom auto-enables when the binary is present, uninstall prunes it", () => {
  const home = freshHome();
  const { layout } = install({ home, headroomAvailable: true });
  const mcp = JSON.parse(readFileSync(layout.mcpConfigFile, "utf8"));
  assert.equal(mcp.mcpServers.headroom.disabled, undefined);
  assert.equal(mcp.mcpServers.headroom.command, "headroom");

  uninstall({ home });
  const after = JSON.parse(readFileSync(layout.mcpConfigFile, "utf8"));
  assert.equal(after.mcpServers.headroom, undefined, "auto-enabled variant must prune");
});

test("install is idempotent and preserves user MCP servers", () => {
  const home = freshHome();
  const mcpFile = join(home, ".gemini", "config", "mcp_config.json");
  mkdirSync(join(home, ".gemini", "config"), { recursive: true });
  writeFileSync(
    mcpFile,
    JSON.stringify({
      mcpServers: {
        "sequential-thinking": { command: "custom", args: ["user-tuned"] },
        mine: { command: "my-server" },
      },
    }),
  );
  install({ home });
  install({ home });
  const mcp = JSON.parse(readFileSync(mcpFile, "utf8"));
  assert.equal(mcp.mcpServers["sequential-thinking"].command, "custom");
  assert.ok(mcp.mcpServers.mine);
  assert.ok(mcp.mcpServers.tree_sitter);
});

test("uninstall removes plugin and only untouched MCP entries", () => {
  const home = freshHome();
  const { layout } = install({ home });
  const mcpBefore = JSON.parse(readFileSync(layout.mcpConfigFile, "utf8"));
  mcpBefore.mcpServers["tree_sitter"].args.push("--user-edit");
  writeFileSync(layout.mcpConfigFile, JSON.stringify(mcpBefore));

  uninstall({ home });
  assert.equal(existsSync(layout.pluginDir), false);
  const mcpAfter = JSON.parse(readFileSync(layout.mcpConfigFile, "utf8"));
  assert.equal(mcpAfter.mcpServers["sequential-thinking"], undefined);
  assert.ok(mcpAfter.mcpServers["tree_sitter"], "edited entry must survive");
});

test("workspace install lands in .agents and includes workflows", () => {
  const ws = freshHome();
  const { layout } = install({ workspace: ws, headroomAvailable: false });
  assert.ok(existsSync(join(ws, ".agents", "plugins", "antigravity-kit", "plugin.json")));
  assert.ok(existsSync(join(ws, ".agents", "mcp_config.json")));
  assert.ok(existsSync(join(ws, ".agents", "workflows", "kit-plan.md")));
  assert.ok(existsSync(join(ws, ".agents", "workflows", "kit-teamwork.md")));
  assert.ok(existsSync(join(ws, ".agents", "workflows", "kit-spec.md")));
  assert.equal(layout.scope, "workspace");
});

test("spec pipeline ships: engine, orchestrator skill, XML templates", () => {
  const home = freshHome();
  const { layout } = install({ home });
  assert.ok(existsSync(join(layout.pluginDir, "scripts", "pipeline.mjs")));
  assert.ok(existsSync(join(layout.pluginDir, "scripts", "lib", "pipeline-core.mjs")));
  assert.ok(existsSync(join(layout.pluginDir, "skills", "kit-spec", "SKILL.md")));
  for (const t of ["explore.md", "requirements.md", "design.md"]) {
    const tpl = join(layout.pluginDir, "skills", "kit-spec", "templates", t);
    assert.ok(existsSync(tpl), `missing template ${t}`);
    assert.match(readFileSync(tpl, "utf8"), /^<role>/m, `${t} should be XML-structured`);
  }
});

test("workflows command targets .agents and mirrors .agent when present", () => {
  const proj = freshHome();
  const { targets } = installWorkflows({ projectRoot: proj });
  assert.deepEqual(targets, [join(proj, ".agents", "workflows")]);
  assert.ok(existsSync(join(proj, ".agents", "workflows", "kit-review.md")));

  const proj2 = freshHome();
  mkdirSync(join(proj2, ".agent"), { recursive: true });
  const res2 = installWorkflows({ projectRoot: proj2 });
  assert.equal(res2.targets.length, 2);
  assert.ok(existsSync(join(proj2, ".agent", "workflows", "kit-review.md")));

  const dry = installWorkflows({ projectRoot: freshHome(), dryRun: true });
  assert.ok(dry.actions.length > 0);
});

test("subagent presets ship with the payload", () => {
  const home = freshHome();
  const { layout } = install({ home });
  for (const agent of ["kit-planner.toml", "kit-reviewer.toml"]) {
    const file = join(layout.pluginDir, "agents", agent);
    assert.ok(existsSync(file), `missing ${agent}`);
    const text = readFileSync(file, "utf8");
    assert.match(text, /^name = "kit-/m);
    assert.match(text, /^developer_instructions = """/m);
    assert.match(text, /^model = /m);
  }
});

test("skill corpus is complete", () => {
  const skills = listSkills();
  for (const s of [
    "kit-plan",
    "kit-work",
    "kit-loop",
    "kit-review",
    "kit-seq-thinking",
    "kit-token-hygiene",
    "kit-remove-ai-slops",
    "kit-debug",
    "kit-goal",
    "kit-teamwork",
    "kit-spec",
  ]) {
    assert.ok(skills.includes(s), `missing skill ${s}`);
  }
});
