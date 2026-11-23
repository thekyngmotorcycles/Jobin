import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const app = JSON.parse(readFileSync(new URL("../app.json", import.meta.url), "utf8")).expo;
const eas = JSON.parse(readFileSync(new URL("../eas.json", import.meta.url), "utf8"));
const profile = eas.build?.["security-pilot"];
const pilotId = "de0b71bb-0646-48fa-a875-6b9662c3c2c7";
const pilotUrl = "https://mkvzkvkmrribcaecvphq.supabase.co";

function requirePilot(condition, message) {
  if (!condition) throw new Error("SEC-05 pilot build refused: " + message);
}

try {
  requirePilot(profile?.distribution === "internal" && profile.android?.buildType === "apk",
    "isolated Android APK build profile missing");
  requirePilot(profile.environment === "preview" && profile.channel === "security-pilot",
    "pilot environment or channel mismatch");
  for (const [name, value] of Object.entries({
    JOBEEN_SECURITY_PILOT: "1",
    EXPO_PUBLIC_JOBEEN_SECURITY_PILOT: "1",
    EXPO_PUBLIC_SUPABASE_URL: pilotUrl,
    JOBEEN_SECURITY_PILOT_EAS_PROJECT_ID: pilotId,
  })) {
    requirePilot(profile.env?.[name] === value && process.env[name] === value,
      "environment mismatch: " + name);
  }
  requirePilot(!Object.prototype.hasOwnProperty.call(profile.env, "EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
    "publishable key must not be committed in eas.json");
  const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
  requirePilot(/^sb_publishable_[A-Za-z0-9_-]{10,}$/.test(key) && key === key.trim(),
    "missing or invalid pilot publishable key in caller environment");
  requirePilot(!Object.prototype.hasOwnProperty.call(profile.env, "EXPO_PUBLIC_PRIVATE_VIDEO_UPLOAD_URL"),
    "pilot must not configure a video gateway in eas.json");
  requirePilot(!process.env.EXPO_PUBLIC_PRIVATE_VIDEO_UPLOAD_URL,
    "unverified video gateway must remain disabled");
  requirePilot(app.extra?.eas?.projectId !== pilotId,
    "pilot cannot reuse the normal app's Expo configuration");
  const config = require("../app.config.js")({ config: app });
  requirePilot(config.extra?.eas?.projectId === pilotId &&
    config.android?.package === "com.thekyngmotorcycles.jobin.securitypilot" &&
    config.ios?.bundleIdentifier === "com.thekyngmotorcycles.jobin.securitypilot" &&
    config.scheme === "jobeen-security-pilot" &&
    config.updates?.enabled === false &&
    config.extra?.securityPilot === true,
    "resolved native identity or OTA safety mismatch");
  console.log("SEC-05: isolated security pilot APK configuration verified; no EAS build started.");
} catch (error) {
  console.error(error instanceof Error ? error.message : "SEC-05 pilot build refused");
  process.exitCode = 1;
}
