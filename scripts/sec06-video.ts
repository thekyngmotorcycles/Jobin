import { open } from "node:fs/promises";
import { isIP } from "node:net";
import { createPrivateVideoTransfer, VIDEO_CHUNK_BYTES } from "../src/lib/private-video-transfer.ts";
import { createPrivateVideoTus, type WorkVideoSubmission } from "../src/lib/private-video-tus.ts";
import { Blocked, check, discard, expectStorageDenied, type Config, type Env, type Report, runWithSessions, type Session, uuid } from "./sec06-hosted.ts";

const protocol = "jobeen-private-tus-v1";
const endpoint = "/v1/private-video-uploads";
const maxFixtureBytes = 2 * VIDEO_CHUNK_BYTES;

function requireVideo(condition: unknown): asserts condition {
  if (!condition) throw Error("SEC06 video assertion");
}

function origin(value: string | undefined) {
  if (!value) throw new Blocked();
  const url = new URL(value);
  requireVideo(url.protocol === "https:" && (value === url.origin || value === url.origin + "/")
    && !url.port && url.hostname.includes(".") && !isIP(url.hostname)
    && !url.hostname.endsWith(".supabase.co"));
  return url.origin;
}

export function videoSettings(env: Env) {
  const gateway = origin(env.SEC06_VIDEO_GATEWAY_ORIGIN);
  const sourcePath = env.SEC06_VIDEO_FIXTURE_FILE;
  const endMs = Number(env.SEC06_VIDEO_FIXTURE_DURATION_MS);
  if (!sourcePath) throw new Blocked();
  requireVideo(Number.isInteger(endMs) && endMs >= 1000 && endMs <= 60_000);
  return { gateway, sourcePath, endMs };
}

async function withoutBody(response: Response, expected: number) {
  await discard(response);
  requireVideo(response.status === expected);
}

function gatewayRequester(gateway: string, send: typeof fetch) {
  return async (url: string, init: RequestInit) => {
    const target = new URL(url);
    requireVideo(target.origin === gateway && !target.username && !target.password && !target.hash && !target.search
      && (target.pathname === endpoint || target.pathname.startsWith(endpoint + "/")));
    const response = await send(target, { ...init, redirect: "error", credentials: "omit", cache: "no-store",
      signal: init.signal ?? AbortSignal.timeout(30_000) });
    requireVideo(!response.redirected && response.headers.get("Jobeen-Video-Protocol") === protocol);
    return response;
  };
}

export async function runVideo(settings: ReturnType<typeof videoSettings>, config: Config, send: typeof fetch, report: Report) {
  const input = await open(settings.sourcePath, "r");
  try {
    const stat = await input.stat();
    requireVideo(stat.isFile() && stat.size > VIDEO_CHUNK_BYTES && stat.size <= maxFixtureBytes);
    const readOffsets: number[] = [];
    const source = {
      size: stat.size,
      mime: "video/mp4" as const,
      async read(offset: number, length: number) {
        requireVideo(length > 0 && length <= VIDEO_CHUNK_BYTES);
        const segment = new Uint8Array(length);
        const { bytesRead } = await input.read(segment, 0, length, offset);
        requireVideo(bytesRead === length);
        readOffsets.push(offset);
        return segment;
      },
    };
    const { gateway } = settings;
    const request = gatewayRequester(gateway, send);
    const sendTicket = (session: Session, route: string, method: string, headers: Record<string, string> = {}, body?: string) =>
      request(gateway + endpoint + route, {
        method, body, headers: {
          Authorization: "Bearer " + session.access, "Jobeen-Video-Protocol": protocol,
          "Cache-Control": "no-store", ...headers,
        },
      });
    const tus = { "Tus-Resumable": "1.0.0" };
    const submission: WorkVideoSubmission = {
      title: "SEC-06 video sintético", profession: "electricista", activity: "work",
      consent: true, start_ms: 0, end_ms: settings.endMs,
    };
    await runWithSessions(config, send, report, async (api, { A, B, C }) => {
      await check(report, "TUS-transferencia-reanudación-y-aislamiento", async () => {
        const scope = { owner: A.owner, session: "jobeen.session.started.v3." + A.owner + "." + A.id };
        let interrupted = false;
        const channel = createPrivateVideoTus({
          origin: gateway, scope, source, submission,
          authorize: async () => A.access,
          async request(url, init) {
            const response = await request(url, init);
            if (init.method === "PATCH" && response.status === 204 && !interrupted) {
              requireVideo(response.headers.get("Upload-Offset") === String(VIDEO_CHUNK_BYTES));
              interrupted = true;
              await discard(response);
              throw Error("Synthetic response loss after acknowledgment");
            }
            return response;
          },
        });
        const transfer = createPrivateVideoTransfer(source, scope, channel.transport, async actual => {
          requireVideo(actual.owner === A.owner && actual.session === scope.session);
        }, channel.allocate);
        const ticket = await channel.allocate();
        const path = "/" + ticket + "/tus";
        try {
          requireVideo(await transfer.transfer().then(() => false, () => interrupted));
          const a2 = await api.login("A");
          requireVideo(a2.id !== A.id);
          for (const actor of [a2, B, C]) {
            await withoutBody(await sendTicket(actor, path, "HEAD", tus), 403);
          }
          const uploaded = await transfer.transfer();
          requireVideo(channel.receipt() && uploaded.path === A.owner + "/" + ticket + ".mp4");
          requireVideo(readOffsets.length === 2 && readOffsets[0] === 0 && readOffsets[1] === VIDEO_CHUNK_BYTES);
          for (const actor of [a2, B, C]) {
            await withoutBody(await sendTicket(actor, "/" + ticket + "/complete", "POST",
              { "Content-Type": "application/json" }, JSON.stringify(submission)), 403);
          }
          for (const actor of [A, B, C]) {
            const original = "video-originals/" + uploaded.path;
            await expectStorageDenied(await api.request("/storage/v1/object/authenticated/" + original, { token: actor.access }));
            await expectStorageDenied(await api.request("/storage/v1/object/sign/" + original, {
              method: "POST", token: actor.access, body: { expiresIn: 30 },
            }));
          }
          await expectStorageDenied(await api.request("/storage/v1/object/public/video-originals/" + uploaded.path));
        } finally {
          if (!channel.receipt()) channel.stop();
        }
      });
      await check(report, "TUS-cancelación-y-revocación-de-sesión", async () => {
        const allocate = async () => {
          const response = await sendTicket(A, "", "POST", { "Content-Type": "application/json" },
            JSON.stringify({ kind: "work-video", size: source.size, mime: source.mime }));
          const id = response.headers.get("Jobeen-Upload-Id");
          await withoutBody(response, 201);
          requireVideo(id && uuid.test(id));
          return "/" + id + "/tus";
        };
        const cancelled = await allocate();
        await withoutBody(await sendTicket(A, cancelled, "POST", { ...tus, "Upload-Length": String(source.size) }), 201);
        await withoutBody(await sendTicket(A, cancelled, "DELETE", tus), 204);
        await withoutBody(await sendTicket(A, cancelled, "HEAD", tus), 403);
        const revoked = await allocate();
        await api.logout(A);
        await withoutBody(await sendTicket(A, revoked, "POST", { ...tus, "Upload-Length": String(source.size) }), 403);
      });
    });
  } finally {
    await input.close();
  }
}

function copyUrl(base: string, raw: string | undefined) {
  if (!raw) throw new Blocked();
  const url = new URL(raw);
  requireVideo(raw.length <= 4096 && base === url.origin && url.pathname !== "/" && !url.hash && !url.username && !url.password);
  return url;
}

export function revocationSettings(env: Env) {
  // Require a pilot gateway approval even though playback uses its own origins.
  origin(env.SEC06_VIDEO_GATEWAY_ORIGIN);
  const source = origin(env.SEC06_VIDEO_PLAYBACK_ORIGIN);
  const cdn = origin(env.SEC06_VIDEO_CDN_ORIGIN);
  requireVideo(source !== cdn);
  const revoked = [copyUrl(source, env.SEC06_VIDEO_ORIGIN_URL), copyUrl(cdn, env.SEC06_VIDEO_CDN_URL)];
  const controls = [copyUrl(source, env.SEC06_VIDEO_ORIGIN_CONTROL_URL), copyUrl(cdn, env.SEC06_VIDEO_CDN_CONTROL_URL)];
  requireVideo(revoked.every((url, index) => url.href !== controls[index].href));
  if (!env.SEC06_VIDEO_LINKS_VALID_UNTIL) throw new Blocked();
  const validUntil = Date.parse(env.SEC06_VIDEO_LINKS_VALID_UNTIL);
  requireVideo(Number.isFinite(validUntil) && validUntil > Date.now() + 240_000);
  return { revoked, controls, validUntil };
}

export async function verifyCopiedLinks(settings: ReturnType<typeof revocationSettings>, send: typeof fetch, report: Report,
  revoke: () => Promise<void>) {
  async function probe(url: URL, expected: readonly number[]) {
    // Reuse the exact URL and headers to exercise a previously warmed cache.
    // None of the Supabase credentials are forwarded to the provider.
    const response = await send(url, {
      method: "GET", headers: { Range: "bytes=0-0" }, credentials: "omit",
      redirect: "error", signal: AbortSignal.timeout(20_000),
    });
    await discard(response);
    requireVideo(!response.redirected && expected.includes(response.status));
    if (response.ok) {
      const mime = response.headers.get("Content-Type")?.split(";")[0].trim().toLowerCase() ?? "";
      requireVideo(/^(video\/[^\s]+|application\/(octet-stream|vnd\.apple\.mpegurl|x-mpegurl|dash\+xml))$/.test(mime));
    }
  }
  await check(report, "video-origen-CDN-enlaces-vigentes", async () => {
    for (const url of [...settings.revoked, ...settings.controls]) await probe(url, [200, 206]);
  });
  await check(report, "video-confirmación-revocación-externa", revoke);
  await check(report, "video-origen-CDN-deniega-enlaces-previos", async () => {
    for (const url of settings.revoked) await probe(url, [401, 403, 404, 410]);
    for (const url of settings.controls) await probe(url, [200, 206]);
    requireVideo(Date.now() < settings.validUntil);
  });
}
