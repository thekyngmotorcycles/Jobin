import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (name: string) => readFileSync(".github/workflows/" + name, "utf8");

test("Android build workflows require owner, manual dispatch and exact approved development SHA", () => {
  for (const name of ["android-development-apk.yml", "build-android.yml"]) {
    const source = read(name);
    assert.match(source, /^on:\s*\n\s+workflow_dispatch:/m);
    assert.doesNotMatch(source, /^  push:|^  pull_request:/m);
    assert.match(source, /github\.actor\s*==\s*'thekyngmotorcycles'/);
    assert.match(source, /github\.ref\s*==\s*'refs\/heads\/development'/);
    assert.match(source, /inputs\.approved_commit\s*==\s*github\.sha/);
    assert.match(source, /contents:\s*read/);
  }
});

test("development Expo workflow is now OTA-only; a build is never initiated through it", () => {
  const source = read("expo-development.yml");
  assert.match(source, /inputs\.confirm_ota\s*==\s*true/);
  assert.match(source, /inputs\.approved_commit\s*==\s*github\.sha/);
  assert.match(source, /test "\$\(git rev-parse HEAD\)" = "\$GITHUB_SHA"/);
  assert.doesNotMatch(source, /\beas\s+build\b|\bexpo:configure\b/);
  assert.doesNotMatch(source, /^  push:/m);
});
