import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const script = resolve(dirname(fileURLToPath(import.meta.url)), "../scripts/check-security-change-coverage.mjs");

function check(paths: string[], base = "development", head = "security/test-case") {
  return spawnSync(process.execPath, [script, "--paths-json", JSON.stringify(paths)], {
    encoding: "utf8",
    env: { ...process.env, GITHUB_BASE_REF: base, GITHUB_HEAD_REF: head },
  });
}

test("security gate allows docs-only changes without requiring new tests", () => {
  const result = check(["docs/ENGINEERING_BRANCHES_SECURITY.md", "AGENTS.md"]);
  assert.equal(result.status, 0, result.stderr);
});

test("security gate rejects Auth changes without regression coverage", () => {
  const result = check(["src/lib/auth-entry.ts"]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /regresi[oó]n/i);
});

test("security gate accepts Auth changes accompanied by a regression test", () => {
  const result = check(["src/lib/auth-entry.ts", "tests/auth-entry.test.ts"]);
  assert.equal(result.status, 0, result.stderr);
});

test("security gate covers SQL RLS migrations, requiring SQL tests", () => {
  const failed = check(["supabase/migrations/20261122_security.sql"]);
  const passed = check(["supabase/migrations/20261122_security.sql", "tests/security-integration.test.sql"]);
  assert.equal(failed.status, 1);
  assert.equal(passed.status, 0, passed.stderr);
});

test("security gate covers config and workflow changes", () => {
  const failed = check(["app.config.js", ".github/workflows/check.yml"]);
  const passed = check(["app.config.js", "tests/security-pilot-config.test.ts"]);
  assert.equal(failed.status, 1);
  assert.equal(passed.status, 0, passed.stderr);
});

test("security gate reserves direct main PRs for release and hotfix branches", () => {
  assert.equal(check(["docs/readme.md"], "main", "feature/jshop-location").status, 1);
  assert.equal(check(["docs/readme.md"], "main", "release/pilot-1").status, 0);
  assert.equal(check(["docs/readme.md"], "main", "hotfix/token-scope").status, 0);
});

test("security gate accepts the current stacked pilot branches", () => {
  assert.equal(check(["scripts/check-security-change-coverage.mjs", "tests/security-change-coverage.test.ts"],
    "test/sec06-hosted-isolation-harness-20261122", "governance/security-foundation-20261122").status, 0);
});
