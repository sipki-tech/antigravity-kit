#!/usr/bin/env node
import { parseArgs } from "node:util";
import {
  install,
  uninstall,
  verify,
  installWorkflows,
} from "../installer/install.mjs";
import { installRtk } from "../installer/rtk.mjs";
import { installHeadroom } from "../installer/headroom.mjs";
import { PROFILES } from "../installer/permissions.mjs";
import {
  installForHost,
  uninstallForHost,
} from "../installer/hosts/claude-code.mjs";

const HELP = `antigravity-kit — Antigravity workflow plugin installer

Usage:
  npx @sipki-tech/antigravity-kit install [options]
  npx @sipki-tech/antigravity-kit verify [options]
  npx @sipki-tech/antigravity-kit uninstall [options]
  npx @sipki-tech/antigravity-kit workflows [--dry-run]
                           # add /kit-* slash commands to the current project
  (from GitHub, without npm: npx github:sipki-tech/antigravity-kit <command>)

Options:
  --workspace              Install into ./.agents/ of the current project
                           instead of ~/.gemini (global).
  --dry-run                Print the plan without changing anything.
  --with-rtk               Also install the rtk binary and run
                           'rtk init --agent antigravity'.
  --with-headroom          Also install the headroom CLI (via uv/pipx/pip)
                           and enable its MCP entry.
  --full                   Everything at once: shorthand for
                           --with-rtk --with-headroom.
  --permission-profile <p> One of: ${PROFILES.join(", ")} (default: safe).
  --host <h>               Port the skill corpus to another host:
                           claude-code | codex.
  -h, --help               Show this help.
`;

function main() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      workspace: { type: "boolean", default: false },
      "dry-run": { type: "boolean", default: false },
      "with-rtk": { type: "boolean", default: false },
      "with-headroom": { type: "boolean", default: false },
      full: { type: "boolean", default: false },
      "permission-profile": { type: "string", default: "safe" },
      host: { type: "string" },
      help: { type: "boolean", short: "h", default: false },
    },
  });

  const command = positionals[0] ?? "install";
  if (values.help) {
    console.log(HELP);
    return 0;
  }
  if (values.full) {
    values["with-rtk"] = true;
    values["with-headroom"] = true;
  }

  const opts = {
    workspace: values.workspace ? process.cwd() : null,
    dryRun: values["dry-run"],
    permissionProfile: values["permission-profile"],
  };
  const mode = opts.dryRun ? "[dry-run] " : "";

  switch (command) {
    case "install": {
      if (values.host) {
        const { target, actions } = installForHost(values.host, {
          dryRun: opts.dryRun,
        });
        printActions(mode, actions);
        console.log(`${mode}skills ported to ${values.host}: ${target}`);
        return 0;
      }
      // Install headroom first so the MCP merge sees the binary and
      // enables the entry in the same pass.
      if (values["with-headroom"]) {
        const ok = installHeadroom({ dryRun: opts.dryRun });
        if (ok) opts.headroomAvailable = true;
      }
      const { layout, actions } = install(opts);
      printActions(mode, actions);
      if (values["with-rtk"]) installRtk({ dryRun: opts.dryRun });
      console.log(`${mode}installed (${layout.scope}): ${layout.pluginDir}`);
      const verifyFlags = values.workspace ? " --workspace" : "";
      console.log(
        `Restart Antigravity to pick up the plugin. Run \`npx @sipki-tech/antigravity-kit verify${verifyFlags}\` to check the install.`,
      );
      if (layout.scope === "global") {
        console.log(
          "Tip: run `npx @sipki-tech/antigravity-kit workflows` inside a project to add the /kit-* slash commands there.",
        );
      }
      return 0;
    }
    case "uninstall": {
      if (values.host) {
        const { target, actions } = uninstallForHost(values.host, {
          dryRun: opts.dryRun,
        });
        printActions(mode, actions);
        console.log(`${mode}skills removed from ${values.host}: ${target}`);
        return 0;
      }
      const { layout, actions } = uninstall(opts);
      printActions(mode, actions);
      console.log(`${mode}uninstalled (${layout.scope})`);
      console.log(
        "Note: MCP servers you edited after install were left in place; rtk (if installed) is not removed.",
      );
      return 0;
    }
    case "workflows": {
      const { targets, actions } = installWorkflows({ dryRun: opts.dryRun });
      printActions(mode, actions);
      console.log(`${mode}workflows installed: ${targets.join(", ")}`);
      console.log("Invoke them in the agent as /kit-plan, /kit-work, /kit-loop, /kit-review, /kit-clean, /kit-debug, /kit-goal, /kit-teamwork.");
      return 0;
    }
    case "verify": {
      const { checks, pass } = verify(opts);
      for (const c of checks) {
        console.log(`${c.pass ? "ok " : "FAIL"}  ${c.name}${c.note ? `  (${c.note})` : ""}`);
      }
      console.log(pass ? "verify: all checks passed" : "verify: some checks failed");
      return pass ? 0 : 1;
    }
    default:
      console.error(`Unknown command '${command}'.\n`);
      console.log(HELP);
      return 1;
  }
}

function printActions(mode, actions) {
  for (const a of actions) console.log(`${mode}${a.type}  ${a.target}`);
  if (actions.length === 0) console.log(`${mode}nothing to do`);
}

try {
  process.exit(main());
} catch (err) {
  console.error(`antigravity-kit: ${err.message}`);
  process.exit(1);
}
