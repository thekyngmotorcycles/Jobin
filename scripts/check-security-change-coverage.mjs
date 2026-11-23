import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

// Gate incremental, no certificación de seguridad. Cada área sensible exige prueba del área.
const rules = [
  {
    name: "database",
    source: [/^supabase\/(?:migrations|security-review|functions)\//i],
    evidence: [/^tests\/.*\.test\.sql$/i],
  },
  {
    name: "workflow",
    source: [/^\.github\/workflows\/.*\.ya?ml$/i, /^scripts\/check-security-change-coverage\.mjs$/i],
    evidence: [/^tests\/(?:security-change-coverage|release-approval-workflows|workflow|ci-security).*\.test\.ts$/i],
  },
  {
    name: "expo-config",
    source: [/^(?:app\.config\.js|eas\.json|app\.json)$/i],
    evidence: [/^tests\/.*(?:security-pilot-config|expo-config|eas-config|native-autolinking).*\.test\.ts$/i,
      /^scripts\/test-security-pilot-fail-closed\.mjs$/i],
  },
  {
    name: "native",
    source: [/^modules\//i, /^src\/.*(?:android-private-file|private-file-vault|private-metadata-vault|auth-storage\.native)/i],
    evidence: [/^tests\/.*(?:native|android|file|vault|storage|secure|metadata).*\.test\.ts$/i],
  },
  {
    name: "auth",
    source: [/^src\/.*(?:auth|session|account-scope|credential|recovery|supabase)/i,
      /^app\/.*(?:auth|login|register|session|recovery|cuenta)/i],
    evidence: [/^tests\/.*(?:auth|session|account|credential|recovery|pilot-config|security-pilot-config).*\.test\.ts$/i],
  },
  {
    name: "media",
    source: [/^src\/.*(?:video|media|upload|photo|evidence|storage|file-vault)/i,
      /^app\/.*(?:videos|flashes|publish|camera|media|photos)/i],
    evidence: [/^tests\/.*(?:video|media|upload|photo|evidence|storage|file|publish|flash).*\.test\.ts$/i],
  },
  {
    name: "social-privacy",
    source: [/^src\/.*(?:jcard|jshop|message|feed|story|stories|privacy|permission|contact)/i,
      /^app\/.*(?:jcard|jshop|message|feed|stories|story|profile|notifications)/i],
    evidence: [/^tests\/.*(?:jcard|jshop|message|feed|story|stories|social|privacy|permission|contact|profile|notification).*\.test\.ts$/i],
  },
];

function changeRecord(input) {
  if (typeof input === "string") return { path: input, status: "M" };
  if (input && typeof input.path === "string" && /^[AMRCD]$/.test(input.status))
    return { path: input.path, status: input.status };
  throw new Error("Registro Git diff inválido.");
}

export function assessChanges(changes, baseBranch = "", headBranch = "") {
  if (!Array.isArray(changes)) throw new Error("Se requiere un array de cambios.");
  const normalized = changes.map(changeRecord)
    .map(({ path, status }) => ({ path: path.replaceAll("\\", "/").trim(), status }))
    .filter(({ path }) => path.length > 0);
  const missing = [];
  const checked = [];
  for (const rule of rules) {
    const affected = normalized.filter(({ path }) => rule.source.some(pattern => pattern.test(path)));
    if (affected.length === 0) continue;
    checked.push({ area: rule.name, files: affected.map(x => x.path) });
    const covered = normalized.some(({ path, status }) =>
      status !== "D" && rule.evidence.some(pattern => pattern.test(path)));
    if (!covered) missing.push(rule.name);
  }
  const findings = missing.map(name => "Falta una prueba modificada del área: " + name);
  if (baseBranch === "main" && !/^(?:release|hotfix)\/[a-z0-9][a-z0-9._/-]*$/.test(headBranch)) {
    findings.push("main solo acepta PR desde release/* o hotfix/*.");
  }
  return { ok: findings.length === 0, checked, missing, findings };
}

function gitDiffRecords(base, head) {
  if (!/^[0-9a-f]{40}$/.test(base) || !/^[0-9a-f]{40}$/.test(head))
    throw new Error("Se requieren SHA Git completos.");
  const diff = execFileSync("git", ["diff", "--name-status", "--find-renames", "--diff-filter=ACMRD", base, head], {
    encoding: "utf8", maxBuffer: 4 * 1024 * 1024,
  });
  return diff.split("\n").filter(Boolean).map(line => {
    const fields = line.split("\t");
    return { status: fields[0][0], path: fields.at(-1) };
  });
}

function main(args) {
  let changes;
  if (args[0] === "--paths-json" && args.length === 2) {
    changes = JSON.parse(args[1]);
  } else if (args[0] === "--base" && args[2] === "--head" && args.length === 4) {
    changes = gitDiffRecords(args[1], args[3]);
  } else {
    throw new Error("Uso: --base <sha> --head <sha> o --paths-json '[...]'.");
  }
  const result = assessChanges(changes, process.env.GITHUB_BASE_REF ?? "", process.env.GITHUB_HEAD_REF ?? "");
  if (!result.ok) {
    for (const finding of result.findings) console.error("SEGURIDAD: " + finding);
    console.error("Áreas afectadas: " + result.checked.map(x => x.area).join(", "));
    process.exitCode = 1;
  } else {
    console.log("SEGURIDAD: regresiones por área verificadas (" + result.checked.length + " áreas sensibles).");
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(process.argv.slice(2)); }
  catch (error) {
    console.error("SEGURIDAD: análisis interrumpido: " + (error instanceof Error ? error.message : "error"));
    process.exitCode = 2;
  }
}
