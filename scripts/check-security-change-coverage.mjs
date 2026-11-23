import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

// Gate de alcance incremental: no es una auditoría ni certifica la seguridad del código.
const sensitive = [
  /^supabase\/(?:migrations|security-review|functions)\//i,
  /^modules\/.*\.(?:kt|java|ts|tsx)$/i,
  /^src\/.*(?:auth|session|account|secure|private|jcard|jshop|message|storage|video|media|permission|privacy|recovery|supabase)/i,
  /^app\/.*(?:auth|login|register|profile|settings|messages|jshop|publish|notifications|recovery)/i,
  /^app\.config\.js$/,
  /^eas\.json$/,
  /^\.github\/workflows\/.*\.ya?ml$/,
];
const regressions = [
  /^tests\/.*(?:\.test\.ts|\.test\.sql)$/,
  /^scripts\/test-[^/]+\.mjs$/,
  /\/__tests__\/.*\.(?:ts|tsx|js)$/,
];
const allowedToMain = /^(?:release|hotfix)\/[a-z0-9][a-z0-9._/-]*$/;

export function assessChanges(paths, baseBranch = "", headBranch = "") {
  const files = [...new Set(paths.filter(value => typeof value === "string").map(value => value.replaceAll("\\", "/").trim()).filter(Boolean))];
  const affected = files.filter(path => sensitive.some(pattern => pattern.test(path)));
  const testFiles = files.filter(path => regressions.some(pattern => pattern.test(path)));
  const findings = [];
  if (affected.length > 0 && testFiles.length === 0) {
    findings.push("Cambios en archivos sensibles sin una prueba de regresión modificada en este PR.");
  }
  if (baseBranch === "main" && !allowedToMain.test(headBranch)) {
    findings.push("main solo acepta PR desde release/* o hotfix/*; cambios de trabajo van a development/integration.");
  }
  return { ok: findings.length === 0, affected, testFiles, findings };
}

function gitDiffPaths(base, head) {
  if (!/^[0-9a-f]{40}$/.test(base) || !/^[0-9a-f]{40}$/.test(head)) {
    throw new Error("Se requieren SHA Git completos para comprobar el diff.");
  }
  return execFileSync("git", ["diff", "--name-only", "--diff-filter=ACMR", base, head], {
    encoding: "utf8", maxBuffer: 4 * 1024 * 1024,
  }).split("\n").filter(Boolean);
}

function main(args) {
  let files;
  if (args[0] === "--paths-json" && args.length === 2) {
    files = JSON.parse(args[1]);
    if (!Array.isArray(files) || !files.every(path => typeof path === "string")) {
      throw new Error("Lista de rutas inválida.");
    }
  } else if (args[0] === "--base" && args[2] === "--head" && args.length === 4) {
    files = gitDiffPaths(args[1], args[3]);
  } else {
    throw new Error("Uso: --base <sha> --head <sha> o --paths-json '[...]'.");
  }
  const result = assessChanges(files, process.env.GITHUB_BASE_REF ?? "", process.env.GITHUB_HEAD_REF ?? "");
  if (!result.ok) {
    for (const finding of result.findings) console.error("SEGURIDAD: " + finding);
    console.error("Archivos sensibles: " + result.affected.join(", "));
    console.error("Añade o actualiza un test pertinente; no elimines ni silencies pruebas.");
    process.exitCode = 1;
  } else {
    console.log("SEGURIDAD: comprobación incremental de cambios OK (" + result.affected.length + " archivos sensibles).");
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(process.argv.slice(2)); }
  catch (error) {
    console.error("SEGURIDAD: no se pudo analizar el diff: " + (error instanceof Error ? error.message : "error"));
    process.exitCode = 2;
  }
}
