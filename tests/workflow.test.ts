import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";

const { verifyPilot } = createRequire(import.meta.url)("../scripts/verify-security-pilot-eas.mjs");
const projectId = "de0b71bb-0646-48fa-a875-6b9662c3c2c7";
const pkg = "com.thekyngmotorcycles.jobin.securitypilot";
const variableName = "EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY";
const token = "synthetic-expo-token";
const githubKey = "sb_publishable_synthetic-pilot-key";
const wrongKey = "sb_publishable_synthetic-wrong-key";

type Fixture = {
  easKey?: string | null;
  appId?: string;
  signing?: "default" | "non-default" | "missing" | "denied";
  anonymousStatus?: number;
};

function fixture({ easKey = githubKey, appId = projectId, signing = "default", anonymousStatus = 401 }: Fixture = {}) {
  const operations: string[] = [];
  const request: typeof fetch = async (url, init) => {
    assert.equal(init?.redirect, "error");
    const headers = new Headers(init?.headers);
    if (url === "https://mkvzkvkmrribcaecvphq.supabase.co/auth/v1/settings") {
      assert.equal(init?.method, "GET");
      assert.equal(headers.get("Authorization"), null);
      const key = headers.get("apikey");
      return new Response(null, { status: key === null ? anonymousStatus : key === githubKey ? 200 : 401 });
    }

    assert.equal(url, "https://api.expo.dev/graphql");
    assert.equal(init?.method, "POST");
    assert.equal(headers.get("Authorization"), `Bearer ${token}`);
    const { query, variables } = JSON.parse(String(init?.body));
    assert.doesNotMatch(query, /mutation|base64EncodedKeystore|keystorePassword|keyPassword/i);
    assert.equal(variables.projectId, projectId);
    const operation = query.match(/\bquery\s+(\w+)/)?.[1];
    assert.ok(operation);
    operations.push(operation);
    const byId: Record<string, unknown> = { id: appId };
    if (operation === "PilotPreviewKey") {
      assert.deepEqual(variables, { projectId, names: [variableName], environment: "preview" });
      byId.environmentVariablesIncludingSensitive = [{
        name: variableName, type: "STRING", visibility: easKey === null ? "SECRET" : "SENSITIVE", value: easKey,
      }];
    }
    if (operation === "PilotAndroidSigning") {
      assert.deepEqual(variables, { projectId, applicationIdentifier: pkg });
      if (signing === "denied") return Response.json({ errors: [{ message: token }] });
      byId.androidAppCredentials = [{
        applicationIdentifier: pkg,
        androidAppBuildCredentialsList: signing === "missing" ? [] : [
          { isDefault: signing === "default", androidKeystore: { id: "synthetic-keystore-id" } },
        ],
      }];
    }
    return Response.json({ data: { app: { byId } } });
  };
  return { operations, request };
}

test("successful EAS verification returns only sanitized status fields", async () => {
  const report = await verifyPilot({ token, githubKey, ...fixture(), identify: () => true });
  assert.deepEqual(report, {
    expoToken: "authenticated", pilotProject: "verified", githubPilotKey: "authorized_for_pilot",
    easPreviewKey: "present", easPreviewSupabase: "authorized_for_pilot",
    easPreviewMatchesGithub: "match", androidSigning: "default_present",
  });
});

test("unavailable and mismatched EAS values cannot pass, and signing failures stay distinguishable", async () => {
  const unreadable = await verifyPilot({
    token, githubKey, ...fixture({ easKey: null, signing: "denied" }), identify: () => true,
  });
  assert.equal(unreadable.easPreviewKey, "present");
  assert.equal(unreadable.easPreviewSupabase, "value_unavailable");
  assert.equal(unreadable.androidSigning, "unverified");
  assert.doesNotMatch(JSON.stringify(unreadable), /synthetic-expo-token/);

  const mismatch = await verifyPilot({
    token, githubKey, ...fixture({ easKey: wrongKey, signing: "non-default" }), identify: () => true,
  });
  assert.equal(mismatch.easPreviewMatchesGithub, "mismatch");
  assert.equal(mismatch.easPreviewSupabase, "unverified");
  assert.equal(mismatch.androidSigning, "present_without_default");
});

test("a wrong EAS project or anonymous Supabase endpoint fails closed", async () => {
  const remote = fixture({ appId: "a6befb1a-dc03-45a8-a18c-294643e99434", anonymousStatus: 200 });
  const report = await verifyPilot({ token, githubKey, ...remote, identify: () => true });
  assert.deepEqual(remote.operations, ["PilotProject"]);
  assert.equal(report.pilotProject, "unverified");
  assert.equal(report.githubPilotKey, "unverified");
  assert.equal(report.easPreviewKey, "blocked");
  assert.equal(report.androidSigning, "blocked");
});

test("missing or ineffective GitHub tokens prevent project operations", async () => {
  for (const suppliedToken of [undefined, token]) {
    const remote = fixture();
    const report = await verifyPilot({
      token: suppliedToken, githubKey: undefined, ...remote, identify: () => false,
    });
    assert.deepEqual(remote.operations, []);
    assert.equal(report.expoToken, suppliedToken ? "unverified" : "missing");
    assert.equal(report.githubPilotKey, "missing");
  }
});

test("the secret-bearing workflow requires the owner to label an exact same-repository PR head", () => {
  const workflow = readFileSync(".github/workflows/security-pilot-eas-verification.yml", "utf8");
  assert.match(workflow, /^on:\n  pull_request:\n    types: \[labeled\]\n\npermissions:\n  contents: read$/m);
  assert.match(workflow, /github\.event\.label\.name == 'approve-eas-pilot-read'/);
  assert.match(workflow, /github\.event\.pull_request\.head\.repo\.full_name == github\.repository/);
  assert.match(workflow, /github\.event\.pull_request\.head\.ref == 'security\/verify-pilot-eas-read-only'/);
  assert.match(workflow, /github\.actor == 'thekyngmotorcycles'/);
  assert.match(workflow, /github\.triggering_actor == 'thekyngmotorcycles'/);
  assert.match(workflow, /github\.event\.sender\.login == 'thekyngmotorcycles'/);
  assert.match(workflow, /ref: \$\{\{ github\.event\.pull_request\.head\.sha \}\}/);
  assert.match(workflow, /persist-credentials: false/);
  assert.match(workflow, /test "\$\(git rev-parse HEAD\)" = "\$APPROVED_SHA"/);
  assert.equal(workflow.match(/\bsecrets\./g)?.length, 2);
  assert.doesNotMatch(workflow, /upload-artifact|\beas(?:-cli@\S+)?\s+(build|update|credentials)\b|\bgit push\b/);
});
