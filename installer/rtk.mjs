import { execFileSync, execSync } from "node:child_process";

export function binaryAvailable(binary) {
  try {
    execFileSync(process.platform === "win32" ? "where" : "which", [binary], {
      stdio: "ignore",
      timeout: 3000,
    });
    return true;
  } catch {
    return false;
  }
}

const has = binaryAvailable;

// --with-rtk: install the rtk binary and register its native Antigravity
// auto-rewrite hook. rtk's own installer owns the hook wiring; we do not
// duplicate it (our rtk-enforcer detects it and goes silent).
export function installRtk({ dryRun = false, log = console.log } = {}) {
  if (has("rtk")) {
    log("rtk: already installed, skipping binary install");
  } else if (dryRun) {
    log("rtk: would install via `brew install rtk` (or the official curl script)");
  } else if (has("brew")) {
    log("rtk: installing via Homebrew…");
    execSync("brew install rtk", { stdio: "inherit" });
  } else {
    log("rtk: installing via official script…");
    execSync(
      "curl -fsSL https://raw.githubusercontent.com/rtk-ai/rtk/refs/heads/master/install.sh | sh",
      { stdio: "inherit" },
    );
  }

  if (dryRun) {
    log("rtk: would run `rtk init --agent antigravity` to register the rewrite hook");
    return;
  }
  if (!has("rtk")) {
    log("rtk: binary still not on PATH — skipping `rtk init` (install it manually, then run `rtk init --agent antigravity`)");
    return;
  }
  log("rtk: registering the Antigravity rewrite hook…");
  execSync("rtk init --agent antigravity", { stdio: "inherit" });
}
