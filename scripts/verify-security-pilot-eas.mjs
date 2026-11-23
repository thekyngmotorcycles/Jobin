import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const projectId = "de0b71bb-0646-48fa-a875-6b9662c3c2c7";
const applicationIdentifier = "com.thekyngmotorcycles.jobin.securitypilot";
const variableName = "EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY";
const expoApi = "https://api.expo.dev/graphql";
const supabaseSettings = "https://mkvzkvkmrribcaecvphq.supabase.co/auth/v1/settings";
const isPublishableKey = key => typeof key === "string" && /^sb_publishable_[A-Za-z0-9_-]{10,}$/.test(key);

function checkExpoIdentity(executable, token) {
  return spawnSync(executable, ["whoami"], {
    cwd: process.env.RUNNER_TEMP,
    env: {
      PATH: process.env.PATH,
      HOME: process.env.HOME,
      CI: "1",
      EXPO_NO_TELEMETRY: "1",
      EXPO_TOKEN: token,
    },
    stdio: "ignore",
    timeout: 30_000,
  }).status === 0;
}

export async function verifyPilot({
  token, githubKey, easExecutable, request = fetch, identify = checkExpoIdentity,
}) {
  async function readExpoApp(query, variables = {}) {
    try {
      const response = await request(expoApi, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ query, variables: { projectId, ...variables } }),
        redirect: "error",
        signal: AbortSignal.timeout(20_000),
      });
      if (!response.ok) return null;
      const { data, errors } = await response.json();
      return !errors?.length && data?.app?.byId?.id === projectId ? data.app.byId : null;
    } catch {
      return null;
    }
  }

  async function supabaseStatus(key) {
    try {
      const response = await request(supabaseSettings, {
        method: "GET",
        headers: key ? { apikey: key } : undefined,
        redirect: "error",
        signal: AbortSignal.timeout(15_000),
      });
      await response.body?.cancel();
      return response.status;
    } catch {
      return 0;
    }
  }

  const report = {
    expoToken: token ? "unverified" : "missing",
    pilotProject: "blocked",
    githubPilotKey: githubKey ? "invalid_format" : "missing",
    easPreviewKey: "blocked",
    easPreviewSupabase: "blocked",
    easPreviewMatchesGithub: "blocked",
    androidSigning: "blocked",
  };

  // A successful GET only verifies the key if the same endpoint rejects anonymous requests.
  const verifiesSupabase = async key =>
    await supabaseStatus() === 401 && await supabaseStatus(key) === 200;

  if (isPublishableKey(githubKey)) {
    report.githubPilotKey = await verifiesSupabase(githubKey) ? "authorized_for_pilot" : "unverified";
  }

  if (!token || !identify(easExecutable, token)) return report;
  report.expoToken = "authenticated";
  report.pilotProject = "unverified";

  const project = await readExpoApp(`
    query PilotProject($projectId: String!) {
      app { byId(appId: $projectId) { id } }
    }
  `);
  if (!project) return report;
  report.pilotProject = "verified";

  const [preview, signing] = await Promise.all([
    // Restrict the response to the single expected variable and include no file contents.
    readExpoApp(`
      query PilotPreviewKey($projectId: String!, $names: [String!], $environment: EnvironmentVariableEnvironment) {
        app {
          byId(appId: $projectId) {
            id
            environmentVariablesIncludingSensitive(filterNames: $names, environment: $environment) {
              name visibility type value
            }
          }
        }
      }
    `, { names: [variableName], environment: "preview" }),
    // Project the keystore ID only. The EAS credentials menu and CLI fragments can retrieve key material.
    readExpoApp(`
      query PilotAndroidSigning($projectId: String!, $applicationIdentifier: String!) {
        app {
          byId(appId: $projectId) {
            id
            androidAppCredentials(filter: { applicationIdentifier: $applicationIdentifier, legacyOnly: false }) {
              applicationIdentifier
              androidAppBuildCredentialsList { isDefault androidKeystore { id } }
            }
          }
        }
      }
    `, { applicationIdentifier }),
  ]);

  const credentials = signing?.androidAppCredentials;
  if (Array.isArray(credentials)) {
    const matching = credentials.filter(item => item.applicationIdentifier === applicationIdentifier);
    const signed = matching.flatMap(item => item.androidAppBuildCredentialsList ?? [])
      .filter(item => item.androidKeystore?.id);
    report.androidSigning = signed.some(item => item.isDefault === true)
      ? "default_present"
      : signed.length ? "present_without_default" : "missing";
  } else {
    report.androidSigning = "unverified";
  }

  const variables = preview?.environmentVariablesIncludingSensitive;
  if (!Array.isArray(variables)) {
    report.easPreviewKey = "unverified";
    return report;
  }
  if (variables.length === 0) {
    report.easPreviewKey = "missing";
    return report;
  }
  if (variables.length !== 1 || variables[0].name !== variableName) {
    report.easPreviewKey = "unverified";
    return report;
  }

  const variable = variables[0];
  report.easPreviewKey = "present";
  if (variable.visibility === "SECRET" || variable.value == null) {
    report.easPreviewSupabase = "value_unavailable";
    return report;
  }
  if (variable.type !== "STRING" || !isPublishableKey(variable.value)) {
    report.easPreviewSupabase = "invalid_format";
    return report;
  }

  const matches = isPublishableKey(githubKey) && variable.value === githubKey;
  if (isPublishableKey(githubKey)) {
    report.easPreviewMatchesGithub = matches ? "match" : "mismatch";
  }
  const valid = matches ? report.githubPilotKey === "authorized_for_pilot" : await verifiesSupabase(variable.value);
  report.easPreviewSupabase = valid ? "authorized_for_pilot" : "unverified";
  return report;
}

async function main() {
  try {
    const report = await verifyPilot({
      token: process.env.EXPO_TOKEN,
      githubKey: process.env.JOBEEN_SECURITY_PILOT_PUBLISHABLE_KEY,
      easExecutable: process.argv[2],
    });
    console.log(JSON.stringify(report, null, 2));
    process.exitCode = report.expoToken === "authenticated"
      && report.pilotProject === "verified"
      && report.githubPilotKey === "authorized_for_pilot"
      && report.easPreviewKey === "present"
      && report.easPreviewSupabase === "authorized_for_pilot"
      && report.easPreviewMatchesGithub === "match"
      && report.androidSigning === "default_present" ? 0 : 1;
  } catch {
    console.error("Pilot verification stopped before completing all read-only checks.");
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
