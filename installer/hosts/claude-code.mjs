import { join } from "node:path";
import { homedir } from "node:os";
import { copyDir, createJournal, removeDir } from "../fsutil.mjs";
import { hostSkillsDir } from "../paths.mjs";
import { listSkills, PAYLOAD_DIR } from "../install.mjs";

// The SKILL.md corpus is plain Agent Skills format, so porting to Claude Code
// is a straight copy into the personal skills directory.
export function installForHost(host, { home = homedir(), dryRun = false } = {}) {
  const target = hostSkillsDir(host, home);
  if (!target) throw new Error(`Unknown host '${host}'. Expected claude-code or codex.`);
  const journal = createJournal(dryRun);
  for (const skill of listSkills()) {
    copyDir(journal, join(PAYLOAD_DIR, "skills", skill), join(target, skill));
  }
  return { target, actions: journal.actions };
}

export function uninstallForHost(host, { home = homedir(), dryRun = false } = {}) {
  const target = hostSkillsDir(host, home);
  if (!target) throw new Error(`Unknown host '${host}'. Expected claude-code or codex.`);
  const journal = createJournal(dryRun);
  for (const skill of listSkills()) {
    removeDir(journal, join(target, skill));
  }
  return { target, actions: journal.actions };
}
