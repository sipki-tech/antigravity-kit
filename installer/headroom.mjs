import { execSync } from "node:child_process";
import { binaryAvailable } from "./rtk.mjs";

const PACKAGE = '"headroom-ai[all]"';

// --with-headroom: install the headroom CLI (Python 3.10+) via whichever
// tool manager is present, preferring isolated installs. Returns true when
// the binary is available afterwards so the caller can enable the MCP entry.
export function installHeadroom({ dryRun = false, log = console.log } = {}) {
  if (binaryAvailable("headroom")) {
    log("headroom: already installed");
    return true;
  }
  const installer = binaryAvailable("uv")
    ? `uv tool install ${PACKAGE}`
    : binaryAvailable("pipx")
      ? `pipx install ${PACKAGE}`
      : binaryAvailable("pip3")
        ? `pip3 install --user ${PACKAGE}`
        : null;

  if (!installer) {
    log(
      "headroom: no Python installer found (uv/pipx/pip3). Install Python 3.10+ and run: pip install \"headroom-ai[all]\"",
    );
    return false;
  }
  if (dryRun) {
    log(`headroom: would install via \`${installer}\``);
    return false;
  }
  log(`headroom: installing via \`${installer}\`…`);
  try {
    execSync(installer, { stdio: "inherit" });
  } catch {
    log("headroom: install failed — the MCP entry stays disabled; install manually and remove \"disabled\": true");
    return false;
  }
  const ok = binaryAvailable("headroom");
  if (!ok)
    log("headroom: installed but not on PATH yet — restart the shell, then remove \"disabled\": true from the headroom MCP entry");
  return ok;
}
