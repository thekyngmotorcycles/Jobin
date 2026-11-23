import { createInterface } from "node:readline/promises";
import { open } from "node:fs/promises";
import { Blocked, configFrom, runStandard, type Report, type Suite, validateTarget } from "./sec06-hosted.ts";
import { revocationSettings, runVideo, verifyCopiedLinks, videoSettings } from "./sec06-video.ts";

const commands: Suite[] = ["auth", "core", "business", "expiration", "video", "video-revocation"];
const report: Report = (result, check) => console.log(result + " " + check);

async function manifest(path: string | undefined) {
  if (!path) throw new Blocked();
  const file = await open(path, "r");
  try {
    const stat = await file.stat();
    if (!stat.isFile() || stat.size > 16_384 || (stat.mode & 0o077) !== 0) throw Error("SEC06 fixture file");
    const contents = Buffer.alloc(16_385);
    const { bytesRead } = await file.read(contents, 0, contents.byteLength, 0);
    if (bytesRead !== stat.size) throw Error("SEC06 fixture file");
    return JSON.parse(contents.subarray(0, bytesRead).toString("utf8")) as unknown;
  } finally {
    await file.close();
  }
}

async function confirmRevocation() {
  if (!process.stdin.isTTY) throw new Blocked();
  console.log("Retira ahora el acceso a ambos enlaces en el entorno piloto. Confirma con REVOCADO.");
  const prompt = createInterface({ input: process.stdin, terminal: false });
  try {
    const answer = await prompt.question("", { signal: AbortSignal.timeout(180_000) });
    if (answer !== "REVOCADO") throw new Blocked();
  } finally {
    prompt.close();
  }
}

async function main(args: string[]) {
  if (args.length === 1 && args[0] === "--plan") {
    console.log("SEC-06 plan sin red. Con autorización posterior: --run " + commands.join(" | "));
    return;
  }
  const suite = commands.find(command => command === args[1]);
  if (args.length !== 2 || args[0] !== "--run" || !suite) {
    report("BLOQUEADO", "elige---plan-o---run-con-una-suite");
    process.exitCode = 2;
    return;
  }
  let started = false;
  try {
    validateTarget(process.env);
    if (suite === "video-revocation") {
      if (!process.stdin.isTTY) throw new Blocked();
      const settings = revocationSettings(process.env);
      started = true;
      await verifyCopiedLinks(settings, fetch, report, confirmRevocation);
    } else {
      const config = configFrom(process.env, await manifest(process.env.SEC06_FIXTURES_FILE), suite);
      if (suite === "video") {
        const settings = videoSettings(process.env);
        started = true;
        await runVideo(settings, config, fetch, report);
      } else {
        started = true;
        await runStandard(suite, config, fetch, report);
      }
    }
  } catch (error) {
    const blocked = !started || error instanceof Blocked;
    report(blocked ? "BLOQUEADO" : "FALLO", started ? suite : "configuración-requerida");
    process.exitCode = blocked ? 2 : 1;
    return;
  }
  report("OK", suite + "-ejecutada-en-piloto-alojado");
}

void main(process.argv.slice(2));
