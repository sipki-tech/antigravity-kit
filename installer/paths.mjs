import { homedir } from "node:os";
import { join } from "node:path";
import { existsSync } from "node:fs";

export const PLUGIN_NAME = "antigravity-kit";

// Preview builds disagree on where plugins live:
//   ~/.gemini/config/plugins/          — shared across IDE/CLI surfaces (primary)
//   ~/.gemini/antigravity-cli/plugins/ — what `agy plugin install` writes (mirror)
// We install to the primary and mirror into the CLI path when it exists.
export function detectLayout({ home = homedir(), workspace = null } = {}) {
  if (workspace) {
    const agents = join(workspace, ".agents");
    return {
      scope: "workspace",
      pluginDir: join(agents, "plugins", PLUGIN_NAME),
      mirrorPluginDirs: [],
      mcpConfigFile: join(agents, "mcp_config.json"),
      settingsFile: null,
    };
  }
  const gemini = join(home, ".gemini");
  const cliDir = join(gemini, "antigravity-cli");
  const mirrors = [];
  if (existsSync(join(cliDir, "plugins"))) {
    mirrors.push(join(cliDir, "plugins", PLUGIN_NAME));
  }
  return {
    scope: "global",
    pluginDir: join(gemini, "config", "plugins", PLUGIN_NAME),
    mirrorPluginDirs: mirrors,
    mcpConfigFile: join(gemini, "config", "mcp_config.json"),
    settingsFile: join(cliDir, "settings.json"),
  };
}

// Workspace workflow targets: .agents/workflows is the primary (consistent
// with .agents/skills); some builds document .agent/workflows — mirror there
// only when that directory already exists in the project.
export function workflowsDirs(projectRoot) {
  const dirs = [join(projectRoot, ".agents", "workflows")];
  if (existsSync(join(projectRoot, ".agent"))) {
    dirs.push(join(projectRoot, ".agent", "workflows"));
  }
  return dirs;
}

export function hostSkillsDir(host, home = homedir()) {
  switch (host) {
    case "claude-code":
      return join(home, ".claude", "skills");
    case "codex":
      return join(home, ".codex", "skills");
    default:
      return null;
  }
}
