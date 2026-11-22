import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const configure = require("../app.config.js");
const original = Object.fromEntries(
  ["JOBEEN_SECURITY_PILOT", "EXPO_PUBLIC_JOBEEN_SECURITY_PILOT", "EXPO_PUBLIC_SUPABASE_URL", "EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "JOBEEN_SECURITY_PILOT_EAS_PROJECT_ID"]
    .map((key) => [key, process.env[key]]),
);
const eas = JSON.parse(readFileSync(new URL("../eas.json", import.meta.url), "utf8"));
assert.equal(eas.build["security-pilot"]?.environment, "preview", "Expo Free uses preview only in a distinct EAS project");
assert.equal(eas.build["security-pilot"]?.env?.EXPO_PUBLIC_SUPABASE_URL, "https://mkvzkvkmrribcaecvphq.supabase.co");
assert.equal(eas.build["security-pilot"]?.android?.buildType, "apk");
assert.equal(eas.build["security-pilot"]?.channel, "security-pilot");
const originalExpoId = "a6befb1a-dc03-45a8-a18c-294643e99434";
const pilotExpoId = "de0b71bb-0646-48fa-a875-6b9662c3c2c7";
const unrelatedExpoId = "11111111-2222-4333-8444-555555555555";
const base = { name: "Jobin", android: { package: "com.thekyngmotorcycles.jobin" }, extra: { eas: {projectId:originalExpoId} } };
const isolated = "https://mkvzkvkmrribcaecvphq.supabase.co";
const unrelated = "https://abcdefghijklmnopqrst.supabase.co";
const existing = "https://nwiimdmtddjquwxtjxmw.supabase.co";
const publishable = "sb_publishable_synthetic-never-used";

function configureWith(values) {
  for (const key of Object.keys(original)) delete process.env[key];
  for (const [key, value] of Object.entries(values)) process.env[key] = value;
  return configure({ config: base });
}

try {
  // Without an explicit pilot request, the current application's identity stays unchanged.
  assert.equal(configureWith({}), base);
  assert.throws(() => configureWith({ EXPO_PUBLIC_JOBEEN_SECURITY_PILOT: "1" }), /both build and client flags/);
  assert.throws(() => configureWith({
    JOBEEN_SECURITY_PILOT: "1",
    EXPO_PUBLIC_SUPABASE_URL: isolated,
    EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: publishable,
  }), /flag missing/);
  assert.throws(() => configureWith({
    JOBEEN_SECURITY_PILOT: "1", EXPO_PUBLIC_JOBEEN_SECURITY_PILOT: "1",
    EXPO_PUBLIC_SUPABASE_URL: existing, EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: publishable,
  }), /Refusing a security pilot/);
  assert.throws(() => configureWith({
    JOBEEN_SECURITY_PILOT: "1", EXPO_PUBLIC_JOBEEN_SECURITY_PILOT: "1",
    EXPO_PUBLIC_SUPABASE_URL: unrelated, EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: publishable,
  }), /Refusing a security pilot/);
  assert.throws(() => configureWith({
    JOBEEN_SECURITY_PILOT: "1", EXPO_PUBLIC_JOBEEN_SECURITY_PILOT: "1",
    EXPO_PUBLIC_SUPABASE_URL: isolated,
  }), /Refusing a security pilot/);
  assert.throws(() => configureWith({
    JOBEEN_SECURITY_PILOT: "1", EXPO_PUBLIC_JOBEEN_SECURITY_PILOT: "1",
    EXPO_PUBLIC_SUPABASE_URL: "http://mkvzkvkmrribcaecvphq.supabase.co",
    EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: publishable,
  }), /Refusing a security pilot/);
  assert.throws(() => configureWith({
    JOBEEN_SECURITY_PILOT: "1", EXPO_PUBLIC_JOBEEN_SECURITY_PILOT: "1",
    EXPO_PUBLIC_SUPABASE_URL: isolated, EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: publishable,
  }), /separate Expo EAS project ID/);
  assert.throws(() => configureWith({
    JOBEEN_SECURITY_PILOT: "1", EXPO_PUBLIC_JOBEEN_SECURITY_PILOT: "1",
    EXPO_PUBLIC_SUPABASE_URL: isolated, EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: publishable,
    JOBEEN_SECURITY_PILOT_EAS_PROJECT_ID: originalExpoId,
  }), /separate Expo EAS project ID/);
  assert.throws(() => configureWith({
    JOBEEN_SECURITY_PILOT: "1", EXPO_PUBLIC_JOBEEN_SECURITY_PILOT: "1",
    EXPO_PUBLIC_SUPABASE_URL: isolated, EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: publishable,
    JOBEEN_SECURITY_PILOT_EAS_PROJECT_ID: unrelatedExpoId,
  }), /separate Expo EAS project ID/);
  assert.equal(eas.build["security-pilot"].env.JOBEEN_SECURITY_PILOT_EAS_PROJECT_ID,pilotExpoId);
  const pilot = configureWith({
    JOBEEN_SECURITY_PILOT: "1", EXPO_PUBLIC_JOBEEN_SECURITY_PILOT: "1",
    EXPO_PUBLIC_SUPABASE_URL: isolated, EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: publishable,
    JOBEEN_SECURITY_PILOT_EAS_PROJECT_ID: pilotExpoId,
  });
  assert.equal(pilot.android.package, "com.thekyngmotorcycles.jobin.securitypilot");
  assert.equal(pilot.slug, "jobeen-security-pilot");
  assert.equal(pilot.extra.eas.projectId, pilotExpoId);
  assert.equal(pilot.updates.enabled, false);
  assert.equal(pilot.extra.securityPilot, true);
  console.log("Security pilot rejects unsafe environments and preserves the default app identity.");
} finally {
  for (const [key, value] of Object.entries(original)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}
