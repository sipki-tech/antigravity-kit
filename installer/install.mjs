import { existsSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { detectLayout, workflowsDirs, PLUGIN_NAME } from "./paths.mjs";
import {
  copyDir,
  createJournal,
  readJson,
  removeDir,
  writeJson,
} from "./fsutil.mjs";
import { applyPermissionProfile } from "./permissions.mjs";
import { binaryAvailable } from "./rtk.mjs";

const PACKAGE_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
export const PAYLOAD_DIR = join(PACKAGE_ROOT, "plugins", PLUGIN_NAME);

// The Antigravity plugin manager writes installed_version.json into every
// installed plugin; the loader uses it to recognize the plugin as installed.
// Our npx installer must write it too, or the plugin is silently ignored.
function pluginVersion() {
  return readJson(join(PAYLOAD_DIR, "plugin.json"), { version: "0.0.0" }).version;
}

function writeInstalledVersion(journal, pluginDir) {
  writeJson(journal, join(pluginDir, "installed_version.json"), {
    version: pluginVersion(),
  });
}

// A corrupt checkout (interrupted npx download, stripped payload) would
// otherwise surface as a raw readdirSync stack trace mid-install.
export function requirePayload(payloadDir = PAYLOAD_DIR) {
  for (const dir of [payloadDir, join(payloadDir, "skills"), join(payloadDir, "workflows")]) {
    if (!existsSync(dir)) {
      throw new Error(
        `antigravity-kit payload is incomplete (missing ${dir}). ` +
          "The checkout is corrupt — re-run via `npx github:sipki-tech/antigravity-kit install`.",
      );
    }
  }
}

export function install(opts = {}) {
  requirePayload();
  const layout = detectLayout(opts);
  const journal = createJournal(Boolean(opts.dryRun));

  // Clean re-install: cpSync copies over an existing dir without removing
  // files the payload no longer ships, so stale artifacts (e.g. the
  // pre-0.3.0 hooks/hooks.json) would survive updates and risk double hook
  // registration.
  removeDir(journal, layout.pluginDir);
  copyDir(journal, PAYLOAD_DIR, layout.pluginDir);
  writeInstalledVersion(journal, layout.pluginDir);
  for (const mirror of layout.mirrorPluginDirs) {
    removeDir(journal, mirror);
    copyDir(journal, PAYLOAD_DIR, mirror);
    writeInstalledVersion(journal, mirror);
  }

  mergeMcpConfig(journal, layout.mcpConfigFile, {
    headroomAvailable: opts.headroomAvailable ?? binaryAvailable("headroom"),
  });

  if (layout.scope === "workspace") {
    installWorkflowsInto(journal, opts.workspace);
  }

  if (layout.settingsFile && opts.permissionProfile) {
    applyPermissionProfile(journal, layout.settingsFile, opts.permissionProfile);
  }

  return { layout, actions: journal.actions };
}

export function uninstall(opts = {}) {
  requirePayload();
  const layout = detectLayout(opts);
  const journal = createJournal(Boolean(opts.dryRun));

  removeDir(journal, layout.pluginDir);
  for (const mirror of layout.mirrorPluginDirs) removeDir(journal, mirror);
  if (layout.scope === "workspace") {
    for (const dir of workflowsDirs(opts.workspace)) {
      for (const wf of listWorkflows()) removeDir(journal, join(dir, wf));
    }
  }
  pruneMcpConfig(journal, layout.mcpConfigFile);

  return { layout, actions: journal.actions };
}

export function verify(opts = {}) {
  const layout = detectLayout(opts);
  const checks = [];
  const ok = (name, pass, note = "") => checks.push({ name, pass, note });

  ok("plugin dir", existsSync(layout.pluginDir), layout.pluginDir);
  const manifest = readJson(join(layout.pluginDir, "plugin.json"));
  ok("plugin.json parses", manifest?.name === PLUGIN_NAME);
  // Match the schema of working plugins: author as an object.
  ok("plugin.json author is an object", typeof manifest?.author === "object");
  // The single thing every working plugin has and a raw copy lacks — the
  // loader uses it to recognize the plugin as installed.
  ok(
    "installed_version.json present",
    existsSync(join(layout.pluginDir, "installed_version.json")),
  );
  // Official location is the plugin root; `agy plugin validate` only looks there.
  const hooks = readJson(join(layout.pluginDir, "hooks.json"));
  ok("hooks.json parses", Boolean(hooks?.[PLUGIN_NAME]));
  for (const script of [
    "kit-wake-word.mjs",
    "danger-guard.mjs",
    "rtk-enforcer.mjs",
    "diagnostics-handoff.mjs",
    "goal-continuation.mjs",
  ]) {
    ok(
      `hook script ${script}`,
      existsSync(join(layout.pluginDir, "scripts", script)),
    );
  }
  // Integrity: every payload skill/workflow must exist in the installed copy.
  const missingSkills = listSkills().filter(
    (s) => !existsSync(join(layout.pluginDir, "skills", s, "SKILL.md")),
  );
  ok("all skills installed", missingSkills.length === 0, missingSkills.join(", "));
  const missingWorkflows = listWorkflows().filter(
    (wf) => !existsSync(join(layout.pluginDir, "workflows", wf)),
  );
  ok(
    "all workflows installed",
    missingWorkflows.length === 0,
    missingWorkflows.join(", "),
  );
  const installedVersion = readJson(
    join(layout.pluginDir, "installed_version.json"),
  )?.version;
  ok(
    "installed_version matches plugin.json",
    Boolean(installedVersion) && installedVersion === manifest?.version,
    `installed_version=${installedVersion} plugin.json=${manifest?.version}`,
  );
  const mcp = readJson(layout.mcpConfigFile);
  ok(
    "mcp: sequential-thinking registered",
    Boolean(mcp?.mcpServers?.["sequential-thinking"]),
    layout.mcpConfigFile,
  );
  // Health report for optional external tools — informative, never failing.
  for (const tool of ["rtk", "headroom"]) {
    ok(
      `optional tool: ${tool}`,
      true,
      binaryAvailable(tool) ? "installed" : "not installed (optional)",
    );
  }
  return { layout, checks, pass: checks.every((c) => c.pass) };
}

export function listSkills() {
  return readdirSync(join(PAYLOAD_DIR, "skills"));
}

export function listWorkflows() {
  return readdirSync(join(PAYLOAD_DIR, "workflows"));
}

function installWorkflowsInto(journal, projectRoot) {
  for (const dir of workflowsDirs(projectRoot)) {
    for (const wf of listWorkflows()) {
      copyDir(journal, join(PAYLOAD_DIR, "workflows", wf), join(dir, wf));
    }
  }
}

// Standalone command: drop the /kit-* workflows into the current project
// without a full workspace install (useful alongside a global install).
export function installWorkflows({ projectRoot = process.cwd(), dryRun = false } = {}) {
  requirePayload();
  const journal = createJournal(Boolean(dryRun));
  installWorkflowsInto(journal, projectRoot);
  return { targets: workflowsDirs(projectRoot), actions: journal.actions };
}

function mergeMcpConfig(journal, mcpConfigFile, { headroomAvailable = false } = {}) {
  const ours = readJson(join(PAYLOAD_DIR, "mcp_config.json"), { mcpServers: {} });
  const existing = readJson(mcpConfigFile, { mcpServers: {} });
  const merged = { ...existing, mcpServers: { ...(existing.mcpServers ?? {}) } };
  let changed = false;
  for (const [name, def] of Object.entries(ours.mcpServers)) {
    // Non-destructive: never touch a server the user already configured.
    if (merged.mcpServers[name]) continue;
    // headroom ships disabled so a missing binary can't break sessions;
    // when the CLI is already installed, enable it right away.
    if (name === "headroom" && headroomAvailable) {
      const { disabled, ...enabled } = def;
      merged.mcpServers[name] = enabled;
    } else {
      merged.mcpServers[name] = def;
    }
    changed = true;
  }
  if (changed) writeJson(journal, mcpConfigFile, merged);
}

function pruneMcpConfig(journal, mcpConfigFile) {
  const ours = readJson(join(PAYLOAD_DIR, "mcp_config.json"), { mcpServers: {} });
  const existing = readJson(mcpConfigFile);
  if (!existing?.mcpServers) return;
  let changed = false;
  for (const [name, def] of Object.entries(ours.mcpServers)) {
    const current = existing.mcpServers[name];
    if (!current) continue;
    // Only remove entries identical to what we installed (including the
    // auto-enabled headroom variant); anything the user edited stays.
    const { disabled, ...enabledVariant } = def;
    const installedForms = [JSON.stringify(def), JSON.stringify(enabledVariant)];
    if (installedForms.includes(JSON.stringify(current))) {
      delete existing.mcpServers[name];
      changed = true;
    }
  }
  if (changed) writeJson(journal, mcpConfigFile, existing);
}
