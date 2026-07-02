import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export function rtkAvailable() {
  try {
    execFileSync(process.platform === "win32" ? "where" : "which", ["rtk"], {
      stdio: "ignore",
      timeout: 2000,
    });
    return true;
  } catch {
    return false;
  }
}

// rtk init --agent antigravity installs its own auto-rewrite hook; when that
// is present our enforcer must stay silent to avoid double-prefixing.
export function rtkHookAlreadyInstalled() {
  const home = homedir();
  const candidates = [
    join(home, ".gemini", "antigravity-cli", "hooks.json"),
    join(home, ".gemini", "config", "hooks.json"),
  ];
  for (const file of candidates) {
    const text = readTextSafe(file);
    if (text && /\brtk\b/.test(text)) return true;
  }
  return false;
}

export function readTextSafe(file) {
  try {
    if (!existsSync(file)) return "";
    return readFileSync(file, "utf8");
  } catch {
    return "";
  }
}
