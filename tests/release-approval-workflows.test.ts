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
  assert.deepEqual(publishers, ["expo-development.yml"]);
  for (const name of publishers) {
    const text = workflow(name);
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


test("original Expo preview APK can run from a single owner-applied PR label without bypassing existing manual release controls", () => {
  const text = workflow("preview-apk-owner-label.yml");
  assert.match(text, /^on:\s*\n\s+pull_request:\s*\n\s+types:\s*\[labeled\]/m);
  assert.doesNotMatch(text, /^  push:|^  schedule:|^  workflow_run:|^  workflow_dispatch:/m);
  assert.match(text, /github\.event\.label\.name == 'approve-preview-native-apk'/);
  assert.match(text, /github\.event\.pull_request\.head\.repo\.full_name == github\.repository/);
  assert.match(text, /github\.event\.pull_request\.head\.ref == 'release\/preview-native-one-apk-20261123'/);
  assert.match(text, /github\.event\.pull_request\.base\.ref == 'development'/);
  assert.match(text, /github\.actor == 'thekyngmotorcycles'/);
  assert.match(text, /github\.triggering_actor == 'thekyngmotorcycles'/);
  assert.match(text, /github\.event\.sender\.login == 'thekyngmotorcycles'/);
  assert.match(text, /ref: \$\{\{ github\.event\.pull_request\.head\.sha \}\}/);
  assert.match(text, /test "\$\(git rev-parse HEAD\)" = "\$APPROVED_SHA"/);
  assert.match(text, /persist-credentials: false/);
  assert.match(text, /contents: read/);
  assert.match(text, /eas-cli@27\.1\.0 build --profile preview --platform android --non-interactive/);
  assert.match(text, /a6befb1a-dc03-45a8-a18c-294643e99434/);
  assert.match(text, /com\.thekyngmotorcycles\.jobin'/);
  assert.doesNotMatch(text, /eas\s+update|eas\s+channel:|git\s+push|--profile (?:security-pilot|production|development)\b/);
});


test("preview bridge excludes only the invalid unused pilot profile in its ephemeral runner copy", () => {
  const text = workflow("preview-apk-owner-label.yml");
  const source = JSON.parse(readFileSync("eas.json", "utf8"));
  assert.equal(source.build.preview.android.buildType, "apk");
  assert.equal(source.build["security-pilot"].env.EXPO_PUBLIC_PRIVATE_VIDEO_UPLOAD_URL, "");
  assert.match(text, /delete config\.build\['security-pilot'\]/);
  assert.match(text, /writeFileSync\(file,JSON\.stringify\(config,null,2\)\)/);
  assert.match(text, /build --profile preview --platform android/);
  assert.doesNotMatch(text, /writeFileSync\(['"]app\.json/);
});


test("read-only failure diagnostic cannot re-trigger native APK compilation", () => {
  const text = workflow("preview-apk-owner-label.yml");
  const diagnostic = text.split("  diagnose-preview-apk:")[1];
  assert.ok(diagnostic);
  assert.match(diagnostic, /github\.event\.label\.name == 'diagnose-preview-native-apk'/);
  assert.match(diagnostic, /github\.actor == 'thekyngmotorcycles'/);
  assert.match(diagnostic, /github\.event\.pull_request\.head\.ref == 'release\/preview-native-one-apk-20261123'/);
  assert.match(diagnostic, /EXPO_BUILD_DIAG/);
  assert.doesNotMatch(diagnostic, /(?:eas-cli@[0-9.]+\s+build|eas\s+update|git\s+push|npm ci|writeFileSync)/);
});


test("isolated fixed runtime prevents cross-build fingerprint drift without changing the repository configuration", () => {
  const text = workflow("preview-apk-owner-label.yml");
  const config = JSON.parse(readFileSync("app.json", "utf8"));
  assert.deepEqual(config.expo.runtimeVersion, { policy: "fingerprint" });
  assert.match(text, /config\.expo\.runtimeVersion='jobeen-native-20261123'/);
  assert.match(text, /config\.expo\?\.extra\?\.eas\?\.projectId!=='a6befb1a-dc03-45a8-a18c-294643e99434'/);
  assert.match(text, /One APK runtime is jobeen-native-20261123/);
});
