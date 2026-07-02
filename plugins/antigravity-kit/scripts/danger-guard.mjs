#!/usr/bin/env node
// PreToolUse (run_command): veto destructive commands and secret reads.
// Fail-open on parsing errors; deny only on confident matches.

import { isAbsolute, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { runHook, commandLineOf, cwdOf, ALLOW } from "./lib/io.mjs";

export function checkCommand(cmd, cwd) {
  if (!cmd || typeof cmd !== "string") return ALLOW;

  const rmVerdict = checkRm(cmd, cwd);
  if (rmVerdict) return rmVerdict;

  const pushVerdict = checkForcePush(cmd);
  if (pushVerdict) return pushVerdict;

  const secretVerdict = checkSecretRead(cmd);
  if (secretVerdict) return secretVerdict;

  return ALLOW;
}

function deny(reason) {
  return { allow_tool: false, deny_reason: `[antigravity-kit danger-guard] ${reason}` };
}

function checkRm(cmd, cwd) {
  const rm = /(^|[;&|]\s*)rm\s+((?:-{1,2}[\w-]+\s+)*)(.+)/.exec(cmd);
  if (!rm) return null;
  const flags = rm[2] || "";
  const recursive = /(^|\s)-{1,2}[\w]*r/i.test(flags) || /--recursive/.test(flags);
  const force = /(^|\s)-\w*f/.test(flags) || /--force/.test(flags);
  if (!(recursive && force)) return null;

  const targets = (rm[3] || "")
    .split(/\s+/)
    .filter((t) => t && !t.startsWith("-"));
  for (const t of targets) {
    const clean = t.replace(/^["']|["']$/g, "");
    if (clean === "/" || clean === "~" || clean === "$HOME" || clean === "*")
      return deny(`rm -rf on '${clean}' is blocked.`);
    if (clean.startsWith("~") || clean.startsWith("$HOME"))
      return deny(`rm -rf outside the workspace ('${clean}') is blocked.`);
    const abs = isAbsolute(clean) ? clean : resolve(cwd, clean);
    const root = resolve(cwd);
    if (!abs.startsWith(root + "/") && abs !== root)
      return deny(`rm -rf outside the workspace ('${clean}') is blocked.`);
    if (abs === root)
      return deny("rm -rf of the workspace root itself is blocked.");
  }
  return null;
}

function checkForcePush(cmd) {
  const push = /git\s+push\b([^;&|]*)/.exec(cmd);
  if (!push) return null;
  const rest = push[1] || "";
  const hasForce = /(^|\s)(--force|-f)(\s|$)/.test(rest);
  const hasLease = /--force-with-lease/.test(rest);
  if (!hasForce && !hasLease) return null;
  const mentionsMain = /\b(main|master)\b/.test(rest);
  if (hasForce && mentionsMain)
    return deny("Force-push to main/master is blocked.");
  if (hasForce && !/\s\S+\s+\S+/.test(rest.replace(/(--force|-f)/, "")))
    // No explicit remote+branch: could silently target main.
    return deny(
      "Force-push without an explicit remote and branch is blocked; name a non-main branch or use --force-with-lease.",
    );
  return null;
}

const SECRET_PATH =
  /(^|[\s/"'=])\.env(\.\w+)?(?![\w.])|id_rsa|id_ed25519|\.pem\b|\.p12\b|\.keychain|credentials(\.json)?\b|\.npmrc\b|\.netrc\b/;
const SECRET_ALLOWED = /\.env\.(example|sample|template|dist)\b/;
const READER =
  /(^|[;&|]\s*)(cat|less|more|head|tail|bat|strings|xxd|od|grep|rg|awk|sed|source|\.)\s/;

function checkSecretRead(cmd) {
  if (!READER.test(cmd)) return null;
  if (SECRET_ALLOWED.test(cmd)) return null;
  if (!SECRET_PATH.test(cmd)) return null;
  return deny(
    "Reading secret files (.env, private keys, credential stores) is blocked by the safety rule. Ask the user to share the specific value if it is genuinely needed.",
  );
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href)
  runHook((input) => checkCommand(commandLineOf(input), cwdOf(input)));
