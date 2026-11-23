import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { test } from "node:test";

const script = new URL("../scripts/check-security-pilot-build-readiness.mjs", import.meta.url);
const valid = {
  JOBEEN_SECURITY_PILOT: "1",
  EXPO_PUBLIC_JOBEEN_SECURITY_PILOT: "1",
  EXPO_PUBLIC_SUPABASE_URL: "https://mkvzkvkmrribcaecvphq.supabase.co",
  JOBEEN_SECURITY_PILOT_EAS_PROJECT_ID: "de0b71bb-0646-48fa-a875-6b9662c3c2c7",
  EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_synthetic-never-used",
};

function check(changes: Record<string, string | undefined> = {}) {
  const env = { ...process.env, ...valid };
  delete env.EXPO_PUBLIC_PRIVATE_VIDEO_UPLOAD_URL;
  for (const [key, value] of Object.entries(changes)) {
    if (value === undefined) delete env[key];
    else env[key] = value;
  }
  return spawnSync(process.execPath, [script.pathname], { encoding: "utf8", env });
}

test("pilot build preflight accepts isolated synthetic config without creating an APK", () => {
  const result = check();
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /no EAS build started/);
  assert.doesNotMatch(result.stdout + result.stderr, /sb_publishable_synthetic-never-used/);
});

test("pilot build preflight refuses absent, non-publishable or malformed keys", () => {
  for (const key of [undefined, "", "sb_secret_wrong-purpose", "sb_publishable_not valid"]) {
    const result = check({ EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: key });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /publishable key/);
  }
});

test("pilot build preflight rejects a normal backend, wrong Expo project or missing flags", () => {
  for (const diff of [
    { EXPO_PUBLIC_SUPABASE_URL: "https://nwiimdmtddjquwxtjxmw.supabase.co" },
    { JOBEEN_SECURITY_PILOT_EAS_PROJECT_ID: "a6befb1a-dc03-45a8-a18c-294643e99434" },
    { JOBEEN_SECURITY_PILOT: undefined },
    { EXPO_PUBLIC_JOBEEN_SECURITY_PILOT: undefined },
  ]) {
    assert.notEqual(check(diff).status, 0);
  }
});

test("pilot build preflight refuses an unverified video gateway", () => {
  const result = check({ EXPO_PUBLIC_PRIVATE_VIDEO_UPLOAD_URL: "https://example.invalid/upload" });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /video gateway/);
});
