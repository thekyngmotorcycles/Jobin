import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { test } from "node:test";

const folder = ".github/workflows";
function workflow(name: string): string {
  return readFileSync(`${folder}/${name}`, "utf8");
}
const all = readdirSync(folder).filter(name => /\.ya?ml$/.test(name));
const ownerGuard = /github\.actor\s*==\s*'thekyngmotorcycles'/;

test("manual development OTA accepts an Android-only scope and rejects other platform inputs", () => {
  const text = workflow("expo-development.yml");
  assert.match(text, /platform:\n[\s\S]*?type: choice\s+options:\s+- android\s+- all\s+default: all/);
  assert.match(text, /OTA_PLATFORM: \$\{\{ inputs\.platform \}\}/);
  assert.match(text, /case "\$OTA_PLATFORM" in\s+android\|all\) ;;\s+\*\).+exit 1 ;;\s+esac/);
  assert.match(text, /eas-cli@27\.1\.0 update --branch development --environment preview --platform "\$OTA_PLATFORM"/);
});

test("the November APK runtime is limited to Android and the reviewed native source", () => {
  const text = workflow("expo-development.yml");
  assert.match(text, /android_runtime:[\s\S]*?options:\s+- fingerprint\s+- jobeen-native-20261123\s+- jobeen-native-20261123-feed-4425bdf1\s+default: fingerprint/);
  assert.match(text, /inputs\.android_runtime == 'jobeen-native-20261123' && inputs\.platform == 'android'/);
  assert.match(text, /git ls-tree -r --full-tree HEAD -- app\.json app\.config\.js .*package-lock\.json modules android ios/);
  assert.match(text, /test "\$native_tree" = '[0-9a-f]{64}' &&\s+test "\$preview_profile" = '[0-9a-f]{64}'/);
  assert.match(text, /config\.expo\.android\.runtimeVersion = runtime/);
  assert.match(text, /if \(result\.runtimeVersion !== runtime\) throw Error/);
  assert.doesNotMatch(text, /config\.expo\.runtimeVersion = runtime/);
});

test("only the existing development publisher accepts automatic calls after owner integration", () => {
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
    assert.doesNotMatch(text, /^  push:|^  pull_request:|^  pull_request_target:|^  workflow_run:|^  schedule:/m);
    assert.match(text, /^  workflow_call:/m);
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

test("Consolidated Android APK OTA uses the same manual publisher and verifies native compatibility",()=>{
 const text=workflow("expo-development.yml");
 assert.match(text,/inputs\.android_runtime == 'jobeen-native-20261123-feed-4425bdf1' && inputs\.platform == 'android'/);
 assert.ok(text.includes("BASE=4425bdf1b39d3085033e77296dac2ec4a528f443"));
 assert.ok(text.includes('git diff --exit-code "$BASE" HEAD -- app.json app.config.js app.config.ts eas.json package.json package-lock.json modules android ios'));
 assert.ok(text.includes("4497923f-9f26-47ae-bfd9-92864b677028"));
 assert.ok(text.includes("build.status!=='FINISHED'"));
 assert.ok(text.includes("build.runtime?.version!==runtime"));
 assert.ok(text.includes("config.expo.android.runtimeVersion = runtime"));
 assert.ok(text.indexOf("Match the consolidated feed APK runtime")<text.indexOf("Publish only the explicitly approved OTA"));
});


test("Automatic OTA is owner-only, current development, Android compatible, and follows both CI checks",()=>{
 const ci=workflow("check.yml"), publisher=workflow("expo-development.yml");
 const job=ci.slice(ci.indexOf("\n  development-ota:"));
 for(const check of [
  "needs: [validate, database]",
  "github.repository == 'thekyngmotorcycles/Jobin'",
  "github.event_name == 'push'",
  "github.ref == 'refs/heads/development'",
  "github.actor == 'thekyngmotorcycles'",
  "github.triggering_actor == 'thekyngmotorcycles'",
  "github.run_attempt == '1'",
  "needs.validate.result == 'success'",
  "needs.database.result == 'success'",
  "needs.validate.outputs.ota_changed == 'true'",
  "uses: ./.github/workflows/expo-development.yml",
  "approved_commit: ${{ github.sha }}",
  "confirm_ota: true",
  "platform: android",
  "android_runtime: jobeen-native-20261123-feed-4425bdf1",
  "EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}",
 ]) assert.ok(job.includes(check),check);
 assert.doesNotMatch(job,/\balways\(\)|\bsecrets:\s*inherit\b|platform:\s*(?:all|ios)\b/);
 assert.ok(ci.includes('git merge-base --is-ancestor "$BEFORE_SHA" "$GITHUB_SHA"'));
 assert.ok(ci.includes('git diff --name-only "$BEFORE_SHA" "$GITHUB_SHA" -- src/ assets/'));
 assert.ok(ci.includes("ota_changed: ${{ steps.ota_scope.outputs.changed }}"));
 assert.ok(ci.includes('echo "changed=false" >> "$GITHUB_OUTPUT"'));
 for(const check of [
  "github.workflow_ref == 'thekyngmotorcycles/Jobin/.github/workflows/check.yml@refs/heads/development'",
  "github.repository == 'thekyngmotorcycles/Jobin'",
  "github.triggering_actor == 'thekyngmotorcycles'",
  "github.run_attempt == '1'",
  "inputs.platform == 'android'",
  "inputs.android_runtime == 'jobeen-native-20261123-feed-4425bdf1'",
  "if(ref.object?.sha!==process.env.GITHUB_SHA)throw Error",
  "git diff --exit-code",
  "build.runtime?.version!==runtime",
 ]) assert.ok(publisher.includes(check),check);
 assert.ok(publisher.indexOf("Verify the approved commit is still current development")<publisher.indexOf("Publish only the explicitly approved OTA"));
 assert.doesNotMatch(publisher,/--branch\s+production|--environment\s+production|\beas-cli@[^\s]+\s+build\b/);
});
