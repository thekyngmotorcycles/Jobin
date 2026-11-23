import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { test } from "node:test";

const folder = ".github/workflows";
function workflow(name: string): string {
  return readFileSync(`${folder}/${name}`, "utf8");
}
const all = readdirSync(folder).filter(name => /\.ya?ml$/.test(name));
const ownerGuard = /github\.actor\s*==\s*'thekyngmotorcycles'/;

test("no EAS OTA publisher automatically runs on push and every publisher checks exact owner approval", () => {
  const publishers = all.filter(name => /\b(?:eas|eas-cli@[^\s]+)\s+update\s+--branch\b/.test(workflow(name)));
  assert.deepEqual(publishers.sort(), ["approved-google-login-ota.yml", "expo-development.yml"]);
  for (const name of publishers) {
    const text = workflow(name);
    if (name === "approved-google-login-ota.yml") {
      assert.match(text, /^on:\s*\n\s+push:/m);
      assert.match(text, /APPROVED=470cafe5c6eaf3bda9e0f9b3b965ba9e4a53519b/);
      assert.match(text, /git diff --name-only "\$APPROVED" HEAD/);
      assert.match(text, /diff -u "\$RUNNER_TEMP\/expected.txt" "\$RUNNER_TEMP\/changed.txt"/);
      assert.match(text, /--platform android/);
      assert.match(text, /persist-credentials:\s*false/);
      assert.match(text, /contents:\s*read/);
      continue;
    }
    assert.match(text, /^on:\s*\n\s+workflow_dispatch:/m);
    assert.doesNotMatch(text, /^  push:|^  pull_request:|^  schedule:/m);
    assert.match(text, ownerGuard);
    assert.match(text, /inputs\.approved_commit\s*==\s*github\.sha/);
    assert.match(text, /inputs\.confirm_ota\s*==\s*true/);
    assert.match(text, /github\.ref\s*==\s*'refs\/heads\/development'/);
    assert.match(text, /persist-credentials:\s*false/);
    assert.match(text, /contents:\s*read/);
    assert.doesNotMatch(text, /\bgit\s+push\b|\beas\s+channel:(?:create|edit)\b|npm run expo:configure/);
  }
});

test("both Android build paths remain manual and require the owner and exact SHA", () => {
  for (const name of ["android-development-apk.yml", "build-android.yml"]) {
    const text = workflow(name);
    assert.match(text, /^on:\s*\n\s+workflow_dispatch:/m);
    assert.doesNotMatch(text, /^  push:|^  pull_request:/m);
    assert.match(text, ownerGuard);
    assert.match(text, /inputs\.approved_commit\s*==\s*github\.sha/);
    assert.match(text, /github\.ref\s*==\s*'refs\/heads\/development'/);
    assert.match(text, /contents:\s*read/);
  }
});

test("legacy release entrypoints cannot publish OTA or update protected branches", () => {
  for (const name of ["jobeen-phase1-ota.yml", "navigation-card-update.yml", "jobin-wordmark.yml"]) {
    const text = workflow(name);
    assert.match(text, /^on:\s*\n\s+workflow_dispatch:/m);
    assert.doesNotMatch(text, /^  push:|^  pull_request:/m);
    assert.doesNotMatch(text, /\b(?:eas|eas-cli@[^\s]+)\s+update\b|\bgh\s+workflow\s+run\b|\bgit\s+push\b/);
    assert.match(text, /contents:\s*read/);
  }
  assert.match(workflow("jobin-wordmark.yml"), /actions\/upload-artifact@v4/);
});

test("no GitHub workflow can silently push a commit into development", () => {
  for (const name of all) {
    const text = workflow(name);
    assert.doesNotMatch(text, /\bgit\s+push\s+origin\s+HEAD:development/);
    assert.doesNotMatch(text, /\bgh\s+workflow\s+run\s+expo-development\.yml/);
  }
});


test("security pilot APK is a distinct manual-only path, not an implicit production build", () => {
  const text = workflow("security-pilot-android.yml");
  assert.match(text, /^on:\s*\n\s+workflow_dispatch:/m);
  assert.doesNotMatch(text, /^  push:|^  pull_request:|^  schedule:|^  workflow_run:/m);
  assert.match(text, ownerGuard);
  assert.match(text, /github\.ref\s*==\s*'refs\/heads\/development'/);
  assert.match(text, /inputs\.approved_commit\s*==\s*github\.sha/);
  assert.match(text, /inputs\.confirm_pilot_build\s*==\s*true/);
  assert.match(text, /persist-credentials:\s*false/);
  assert.match(text, /contents:\s*read/);
  assert.match(text, /node scripts\/check-security-pilot-build-readiness\.mjs/);
  assert.match(text, /node scripts\/check-security-pilot-config\.mjs/);
  assert.match(text, /eas-cli@27\.1\.0 build --profile security-pilot --platform android/);
  assert.match(text, /secrets\.JOBEEN_SECURITY_PILOT_PUBLISHABLE_KEY/);
  assert.doesNotMatch(text, /eas\s+update|eas\s+channel:(?:create|edit)|git\s+push|expo:configure|--profile (?:preview|production|development)\b/);
});


test("EAS configuration never contains invalid empty profile env values and pilot keeps video gateway disabled", () => {
  const eas = JSON.parse(readFileSync("eas.json", "utf8"));
  for (const profile of Object.values(eas.build as Record<string, { env?: Record<string, string> }>)) {
    for (const value of Object.values(profile.env ?? {})) assert.notEqual(value, "");
  }
  assert.equal(Object.hasOwn(eas.build["security-pilot"].env, "EXPO_PUBLIC_PRIVATE_VIDEO_UPLOAD_URL"), false);
  assert.match(workflow("security-pilot-android.yml"), /EXPO_PUBLIC_PRIVATE_VIDEO_UPLOAD_URL: ""/);
});
