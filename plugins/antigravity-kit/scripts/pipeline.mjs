#!/usr/bin/env node
// CLI for the spec-pipeline state engine. State is resolved from the current
// project (cwd), so this works identically whether the plugin is installed
// globally (~/.gemini/config/plugins/...) or in a workspace (.agents/plugins/).
// Logic lives in lib/pipeline-core.mjs (imported by tests and the Stop hook).

import { pathToFileURL } from "node:url";
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
  doctor,
} from "./lib/pipeline-core.mjs";

const HELP = `kit spec pipeline — deterministic phase tracker with approval gates

Usage: node pipeline.mjs <command> [args]   (run from your project root)

Phases: ${PHASES.join(" -> ")} -> done

Commands:
  init <feature>          Start a pipeline (kebab-case name)
  status [feature]        Show current phase, artifact, tasks
  artifact <relpath>      Register the current phase's artifact (relative to
                          .agents/kit/pipeline/<feature>/)
  approve [feature]       Advance to the next phase (needs a registered artifact)
  inject <phase> <path>   Jump forward to a phase with a pre-written artifact
  abandon [feature]       Delete a pipeline
  task <id> <status>      Set task status (pending|wip|done|blocked)
  doctor                  Diagnose: project root, state dir, active features
  help                    Show this help

Feature arg is optional when exactly one pipeline is active.`;

function printState(s) {
  console.log(`feature:  ${s.feature}`);
  console.log(`phase:    ${s.phase}`);
  console.log(`artifact: ${s.artifact ?? "(none registered)"}`);
  const tasks = Object.entries(s.tasks ?? {});
  if (tasks.length) console.log(`tasks:    ${tasks.map(([k, v]) => `${k}=${v}`).join(", ")}`);
  console.log(`history:  ${s.history.length} approved phase(s)`);
}

function main(argv) {
  const [cmd, ...rest] = argv;
  switch (cmd) {
    case "init":
      printState(init(rest[0]));
      console.log(`\nNext: write the explore artifact, then \`artifact <path>\` and \`approve\`.`);
      return 0;
    case "status":
      printState(status({ feature: rest[0] }));
      return 0;
    case "artifact": {
      const { state, warning } = registerArtifact(rest[0], { feature: featureFlag(rest) });
      if (warning) console.log(`warning: ${warning}`);
      printState(state);
      return 0;
    }
    case "approve": {
      const s = approve({ feature: rest[0] });
      console.log(s.phase === "done" ? `pipeline complete: ${s.feature}` : `advanced to: ${s.phase}`);
      return 0;
    }
    case "inject":
      printState(inject(rest[0], rest[1]));
      return 0;
    case "abandon":
      console.log(`abandoned: ${abandon({ feature: rest[0] }).feature}`);
      return 0;
    case "task":
      printState(setTask(rest[0], rest[1]));
      return 0;
    case "doctor":
      console.log(JSON.stringify(doctor(), null, 2));
      return 0;
    case "help":
    case undefined:
    case "--help":
    case "-h":
      console.log(HELP);
      return 0;
    default:
      console.error(`unknown command '${cmd}'\n`);
      console.log(HELP);
      return 1;
  }
}

// `artifact` takes a bare relpath; feature (if any) is inferred from active
// state. Kept simple: only the two-active-pipelines case needs disambiguation,
// handled inside the core by throwing a clear error.
function featureFlag() {
  return undefined;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  try {
    process.exit(main(process.argv.slice(2)));
  } catch (err) {
    if (err instanceof PipelineError) {
      console.error(`pipeline: ${err.message}`);
      process.exit(1);
    }
    throw err;
  }
}
