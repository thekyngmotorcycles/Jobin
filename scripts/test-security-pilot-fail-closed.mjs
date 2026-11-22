import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const configure = require("../app.config.js");
const original = Object.fromEntries(
  ["JOBEEN_SECURITY_PILOT", "EXPO_PUBLIC_JOBEEN_SECURITY_PILOT", "EXPO_PUBLIC_SUPABASE_URL", "EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY"]
    .map((key) => [key, process.env[key]]),
);
const base = { name: "Jobin", android: { package: "com.thekyngmotorcycles.jobin" }, extra: {} };
const isolated = "https://abcdefghijklmnopqrst.supabase.co";
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
    EXPO_PUBLIC_SUPABASE_URL: isolated,
  }), /Refusing a security pilot/);
  assert.throws(() => configureWith({
    JOBEEN_SECURITY_PILOT: "1", EXPO_PUBLIC_JOBEEN_SECURITY_PILOT: "1",
    EXPO_PUBLIC_SUPABASE_URL: "http://abcdefghijklmnopqrst.supabase.co",
    EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: publishable,
  }), /Refusing a security pilot/);
  const pilot = configureWith({
    JOBEEN_SECURITY_PILOT: "1", EXPO_PUBLIC_JOBEEN_SECURITY_PILOT: "1",
    EXPO_PUBLIC_SUPABASE_URL: isolated, EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: publishable,
  });
  assert.equal(pilot.android.package, "com.thekyngmotorcycles.jobin.securitypilot");
  assert.equal(pilot.updates.enabled, false);
  assert.equal(pilot.extra.securityPilot, true);
  console.log("Security pilot rejects unsafe environments and preserves the default app identity.");
} finally {
  for (const [key, value] of Object.entries(original)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}
