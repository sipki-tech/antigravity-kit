import { readJson, writeJson } from "./fsutil.mjs";

export const PROFILES = ["safe", "balanced", "full", "none"];

// The preview settings.json schema for tool auto-approval is not stable, so
// we only record the chosen profile under our own namespace and preserve the
// rest of the file untouched. Profile semantics are enforced by the plugin's
// rules and hooks; see README "Permission profiles".
export function applyPermissionProfile(journal, settingsFile, profile) {
  if (!PROFILES.includes(profile)) {
    throw new Error(
      `Unknown permission profile '${profile}'. Expected one of: ${PROFILES.join(", ")}`,
    );
  }
  if (profile === "none") return;
  const settings = readJson(settingsFile, {}) ?? {};
  const current = settings.antigravityKit?.permissionProfile;
  if (current === profile) return;
  settings.antigravityKit = {
    ...(settings.antigravityKit ?? {}),
    permissionProfile: profile,
  };
  writeJson(journal, settingsFile, settings);
}
