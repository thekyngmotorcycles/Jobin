import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {readFileSync} from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const script = resolve(dirname(fileURLToPath(import.meta.url)), "../scripts/check-security-change-coverage.mjs");
type Change = string | { path: string; status: "A" | "M" | "R" | "C" | "D" };

function check(paths: Change[], base = "development", head = "security/test-case") {
  return spawnSync(process.execPath, [script, "--paths-json", JSON.stringify(paths)], {
    encoding: "utf8", env: { ...process.env, GITHUB_BASE_REF: base, GITHUB_HEAD_REF: head },
  });
}

test("docs-only changes need no extra test", () => {
  assert.equal(check(["docs/ENGINEERING_BRANCHES_SECURITY.md", "AGENTS.md"]).status, 0);
});

test("Auth change requires an Auth-specific test, not an unrelated test", () => {
  assert.equal(check(["src/lib/auth-entry.ts"]).status, 1);
  const unrelated = check(["src/lib/auth-entry.ts", "tests/jshop-favorites.test.ts"]);
  assert.equal(unrelated.status, 1);
  assert.match(unrelated.stderr, /auth/i);
  assert.equal(check(["src/lib/auth-entry.ts", "tests/auth-entry.test.ts"]).status, 0);
});

test("RLS migrations require a SQL test and reject unrelated TypeScript tests", () => {
  assert.equal(check(["supabase/migrations/20261122_security.sql"]).status, 1);
  assert.equal(check(["supabase/migrations/20261122_security.sql", "tests/auth-entry.test.ts"]).status, 1);
  assert.equal(check(["supabase/migrations/20261122_security.sql", "tests/security-integration.test.sql"]).status, 0);
});

test("config and workflow changes require separate matching regressions", () => {
  const changes = ["app.config.js", ".github/workflows/check.yml"];
  assert.equal(check(changes).status, 1);
  assert.equal(check([...changes, "tests/security-pilot-config.test.ts"]).status, 1);
  assert.equal(check([...changes, "tests/security-change-coverage.test.ts"]).status, 1);
  assert.equal(check([...changes, "tests/security-pilot-config.test.ts", "tests/security-change-coverage.test.ts"]).status, 0);
});

test("release workflow edits use release-approval test evidence, not unrelated app tests", () => {
  assert.equal(check([".github/workflows/expo-development.yml", "tests/auth-entry.test.ts"]).status, 1);
  assert.equal(check([".github/workflows/expo-development.yml", "tests/release-approval-workflows.test.ts"]).status, 0);
});

test("native vault, video and social privacy require evidence from their own areas", () => {
  assert.equal(check(["modules/jobeen-private-files/android/src/main/java/PrivateFiles.kt", "tests/auth-entry.test.ts"]).status, 1);
  assert.equal(check(["modules/jobeen-private-files/android/src/main/java/PrivateFiles.kt", "tests/android-private-file.test.ts"]).status, 0);
  assert.equal(check(["src/lib/private-video-transfer.ts", "tests/auth-entry.test.ts"]).status, 1);
  assert.equal(check(["src/lib/private-video-transfer.ts", "tests/private-video-transfer.test.ts"]).status, 0);
  assert.equal(check(["src/lib/jshop-messages.ts", "tests/jshop-messages.test.ts"]).status, 0);
  assert.equal(check(["src/lib/jshop-messages.ts", "tests/private-video-transfer.test.ts"]).status, 1);
});

test("deletions of sensitive code require a surviving test; deleted tests cannot satisfy gate", () => {
  assert.equal(check([{ path: "src/lib/auth-entry.ts", status: "D" }]).status, 1);
  assert.equal(check([{ path: "src/lib/auth-entry.ts", status: "M" }, { path: "tests/auth-entry.test.ts", status: "D" }]).status, 1);
  assert.equal(check([{ path: "src/lib/auth-entry.ts", status: "D" }, { path: "tests/auth-entry.test.ts", status: "M" }]).status, 0);
});

test("changes in multiple sensitive domains require coverage per domain", () => {
  const changes = ["src/lib/auth-entry.ts", "src/lib/private-video-transfer.ts", "supabase/migrations/new_policy.sql"];
  assert.equal(check([...changes, "tests/auth-entry.test.ts"]).status, 1);
  assert.equal(check([...changes, "tests/auth-entry.test.ts", "tests/private-video-transfer.test.ts"]).status, 1);
  assert.equal(check([...changes, "tests/auth-entry.test.ts", "tests/private-video-transfer.test.ts", "tests/security-integration.test.sql"]).status, 0);
});

test("main accepts only release or hotfix PRs", () => {
  assert.equal(check(["docs/readme.md"], "main", "feature/jshop-location").status, 1);
  assert.equal(check(["docs/readme.md"], "main", "release/pilot-1").status, 0);
  assert.equal(check(["docs/readme.md"], "main", "hotfix/token-scope").status, 0);
});

test("the current governance PR is allowed with its regression test", () => {
  assert.equal(check(["scripts/check-security-change-coverage.mjs", ".github/workflows/check.yml",
    "tests/security-change-coverage.test.ts"],
  "test/sec06-hosted-isolation-harness-20261122", "governance/security-foundation-20261122").status, 0);
});


test("Shared cover SQL is executed only in the disposable local Postgres job with strict failures",()=>{
 const workflow=readFileSync(resolve(dirname(script),"../.github/workflows/check.yml"),"utf8");
 const marker="  database:\n";const jobs=workflow.indexOf(marker);
 assert.ok(jobs>0);
 // Delimit the SQL job at the next top-level job, not at end of file.
 const nextJob=/^  [a-zA-Z_][a-zA-Z0-9_-]*:\s*$/m.exec(workflow.slice(jobs+marker.length));
 const end=nextJob?jobs+marker.length+nextJob.index:workflow.length;
 const validation=workflow.slice(0,jobs),database=workflow.slice(jobs,end),following=workflow.slice(end);
 const coverStep="psql -v ON_ERROR_STOP=1 -f tests/jcard-shared-cover.test.sql";
 assert.ok(!validation.includes(coverStep)&&!following.includes(coverStep));
 assert.equal(database.split(coverStep).length-1,1);
 assert.ok(database.includes("image: postgres:17")&&database.includes("PGHOST: localhost")&&database.includes("PGDATABASE: jobin_test"));
 assert.ok(database.indexOf("tests/database-bootstrap.sql")<database.indexOf(coverStep));
 assert.ok(database.indexOf("tests/security-integration.test.sql")<database.indexOf(coverStep));
 assert.ok(!database.includes("secrets.")&&!database.includes("supabase db push")&&!database.includes("continue-on-error: true"));
 assert.equal(check([".github/workflows/check.yml","supabase/security-review/jcard-shared-cover.sql","tests/jcard-shared-cover.test.sql"]).status,1);
 assert.equal(check([".github/workflows/check.yml","supabase/security-review/jcard-shared-cover.sql","tests/jcard-shared-cover.test.sql","tests/security-change-coverage.test.ts"]).status,0);
});
