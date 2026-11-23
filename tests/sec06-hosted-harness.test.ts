import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { test } from "node:test";
import { actors, Blocked, configFrom, pilotApi, pilotOrigin, type Report, rowCases, runStandard, storageDenied, validateTarget } from "../scripts/sec06-hosted.ts";
import { revocationSettings, verifyCopiedLinks, videoSettings } from "../scripts/sec06-video.ts";

const suffixId = (n: number) => "00000000-0000-4000-8000-" + String(n).padStart(12, "0");
const identities = { A: suffixId(1), B: suffixId(2), C: suffixId(3) };
const data = Buffer.from("synthetic Storage fixture");
const hash = createHash("sha256").update(data).digest("hex");
const fixture = {
  identities,
  rows: Object.fromEntries(rowCases.map((entry, i) => [entry.fixture, suffixId(i + 10)])),
  files: {
    draft: { name: "sec06-draft.jpg", sha256: hash },
    evidence: { name: "sec06-evidence.pdf", sha256: hash },
    sharedPost: { name: "sec06-shared.jpg", sha256: hash },
  },
};
const env = {
  SEC06_ALLOW_HOSTED_RUN: "mkvzkvkmrribcaecvphq",
  SEC06_SUPABASE_URL: pilotOrigin,
  SEC06_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_synthetic-never-used",
  SEC06_A_EMAIL: "a@example.invalid", SEC06_A_PASSWORD: "fixture-A",
  SEC06_B_EMAIL: "b@example.invalid", SEC06_B_PASSWORD: "fixture-B",
  SEC06_C_EMAIL: "c@example.invalid", SEC06_C_PASSWORD: "fixture-C",
};

test("SEC-06 requires exact pilot HTTPS, a publishable key and three distinct fixture identities", async () => {
  assert.equal(validateTarget(env), env.SEC06_SUPABASE_PUBLISHABLE_KEY);
  for (const target of [
    "", pilotOrigin.replace("https", "http"), pilotOrigin + ":443",
    pilotOrigin + "?foo=bar", pilotOrigin + "/auth/v1",
    pilotOrigin + ".example.invalid", "https://user@" + new URL(pilotOrigin).hostname,
    "https://nwiimdmtddjquwxtjxmw.supabase.co",
  ]) assert.throws(() => validateTarget({ ...env, SEC06_SUPABASE_URL: target }));
  assert.throws(() => validateTarget({ ...env, SEC06_ALLOW_HOSTED_RUN: undefined }));
  assert.throws(() => validateTarget({ ...env, SEC06_SUPABASE_PUBLISHABLE_KEY: "sb_secret_do-not-use" }));
  assert.throws(() => configFrom({ ...env, SEC06_C_EMAIL: env.SEC06_A_EMAIL }, fixture, "core"));
  assert.throws(() => configFrom(env, { ...fixture, identities: { ...identities, C: identities.A } }, "core"));
  assert.throws(() => configFrom(env, { ...fixture, files: { ...fixture.files, draft: { name: "../a.png", sha256: hash } } }, "core"));
  const api = pilotApi(configFrom(env, fixture, "auth"), async () => assert.fail("unexpected network request"));
  await assert.rejects(api.request("//outside.example/rest/v1/profiles"));
});

test("SEC-06 CLI plan needs no credentials and a wrong origin is blocked with sanitized output", () => {
  const cli = ["--experimental-strip-types", "scripts/run-sec06-hosted.ts"];
  const cleanEnv = { NODE_ENV: "test" as const };
  const plan = spawnSync(process.execPath, [...cli, "--plan"], { encoding: "utf8", env: cleanEnv });
  assert.ifError(plan.error);
  assert.equal(plan.status, 0);
  assert.match(plan.stdout, /plan sin red/);
  const rejected = spawnSync(process.execPath, [...cli, "--run", "core"], {
    encoding: "utf8", env: { ...cleanEnv, ...env, SEC06_SUPABASE_URL: "https://sensitive.example.invalid" },
  });
  assert.ifError(rejected.error);
  assert.equal(rejected.status, 2);
  assert.equal(rejected.stdout.trim(), "BLOQUEADO configuración-requerida");
  assert.doesNotMatch(rejected.stderr, /sensitive|fixture-A|sb_publishable/);
});

function scenario(fault?: "foreign-row" | "foreign-file" | "service-error" | "signed-redirect" | "refresh-reuse") {
  let sequence = 100;
  const live = new Map<string, string>();
  const byAccess = new Map<string, { session: string; owner: string }>();
  const byRefresh = new Map<string, { session: string; owner: string }>();
  const logs: string[] = [];
  const report: Report = (result, name) => logs.push(result + " " + name);
  const issuer = pilotOrigin + "/auth/v1";
  function issue(owner: string, session = suffixId(sequence++)) {
    const refresh = "synthetic-refresh-" + sequence++;
    const claims = { sub: owner, session_id: session, exp: Math.floor(Date.now() / 1000) + 3600,
      iss: issuer, aud: "authenticated", role: "authenticated" };
    const access = "header." + Buffer.from(JSON.stringify(claims)).toString("base64url") + ".sig" + sequence++;
    byAccess.set(access, { session, owner });
    byRefresh.set(refresh, { session, owner });
    live.set(session, refresh);
    return Response.json({ user: { id: owner }, access_token: access, refresh_token: refresh });
  }
  const send: typeof fetch = async (input, init) => {
    const request = new Request(input, init);
    const url = new URL(request.url);
    assert.equal(url.origin, pilotOrigin);
    assert.equal(request.redirect, "error");
    assert.equal(request.credentials, "omit");
    assert.equal(request.headers.get("apikey"), env.SEC06_SUPABASE_PUBLISHABLE_KEY);
    const token = request.headers.get("Authorization")?.slice("Bearer ".length) ?? "";
    const session = byAccess.get(token);
    const owner = session?.owner;
    const path = url.pathname;
    if (path === "/auth/v1/token") {
      const payload = await request.json() as Record<string, string>;
      if (url.searchParams.get("grant_type") === "password") {
        const alias = actors.find(a => env[`SEC06_${a}_EMAIL`] === payload.email);
        assert.ok(alias);
        assert.equal(payload.password, env[`SEC06_${alias}_PASSWORD`]);
        return issue(identities[alias]);
      }
      const old = byRefresh.get(payload.refresh_token);
      if (old && (fault === "refresh-reuse" || live.get(old.session) === payload.refresh_token)) return issue(old.owner, old.session);
      return Response.json({ error_code: "refresh_token_not_found" }, { status: 400 });
    }
    if (path === "/auth/v1/user") return Response.json({ id: owner });
    if (path === "/auth/v1/logout") {
      assert.equal(url.searchParams.get("scope"), "local");
      assert.ok(session);
      live.delete(session.session);
      return new Response(null, { status: 204 });
    }
    const id = url.searchParams.get("id")?.slice(3) ?? "";
    const table = path.split("/").at(-1);
    if (path.startsWith("/rest/v1/")) {
      const columns = url.searchParams.get("select")!.split(",");
      const filters = Object.fromEntries(columns.map(col => [col, url.searchParams.get(col)?.slice(3)]));
      const alias = actors.find(a => identities[a] === owner);
      assert.ok(alias);
      if (table === "profiles") return Response.json([filters]);
      if (table === "account_preferences" || table === "jcard_personal_contacts" || table === "jshop_seller_locations") {
        return Response.json(Object.values(filters)[0] === owner || fault === "foreign-row" ? [filters] : []);
      }
      if (table === "jshop_favorites") return Response.json(alias === "B" ? [filters] : []);
      const probe = rowCases.find(p => fixture.rows[p.fixture] === id && p.table === table);
      assert.ok(probe);
      if (columns[0] === "audience") return Response.json([{
        audience: "private", audience_followers: true, audience_contacts: false,
        photo_paths: [identities.A + "/" + fixture.files.sharedPost.name], photo_bucket: "jobeen-private-post-photos",
      }]);
      return Response.json(probe.visible.includes(alias) ? [filters] : []);
    }
    const name = path.split("/").at(-1)!;
    const isShared = name === fixture.files.sharedPost.name;
    if (path.includes("/object/public/")) return new Response(null, { status: 404 });
    if (path.includes("/object/sign/") && request.method === "GET") {
      assert.equal(token, "");
      assert.equal(url.searchParams.get("token"), "synthetic");
      return new Response(data);
    }
    const allowed = owner === identities.A || (owner === identities.B && isShared);
    if (!allowed && fault !== "foreign-file") {
      return fault === "service-error" ? Response.json({ message: "sensitive error" }, { status: 503 })
        : Response.json({ statusCode: "404" }, { status: 400 });
    }
    if (request.method === "POST") {
      const signed = path.slice("/storage/v1".length) + "?token=synthetic";
      return Response.json({ signedURL: (fault === "signed-redirect" ? "https://outside.example" : "") + signed });
    }
    return new Response(data);
  };
  return { send, report, logs, live };
}

test("SEC-06 core and session orchestration exercise positive and negative synthetic HTTP responses", async () => {
  const mock = scenario();
  await runStandard("core", configFrom(env, fixture, "core"), mock.send, mock.report);
  await runStandard("auth", configFrom(env, fixture, "auth"), mock.send, mock.report);
  assert.equal(mock.live.size, 0);
  assert.ok(mock.logs.includes("OK Storage-employer-report-evidence"));
  assert.ok(mock.logs.includes("OK auth-cambio-A-B-A"));
  assert.ok(mock.logs.includes("OBSERVACIÓN REST-acepta-JWT-tras-logout-en-la-muestra"));
  assert.ok(mock.logs.every(log => !/synthetic|example.invalid|fixture-A/.test(log)));
});

test("SEC-06 expiration blocks an insufficient wait window and closes the synthetic session", async () => {
  const mock = scenario();
  const config = configFrom({ ...env, SEC06_MAX_EXPIRY_WAIT_SECONDS: "90" }, fixture, "expiration");
  await assert.rejects(runStandard("expiration", config, mock.send, mock.report), Blocked);
  assert.equal(mock.live.size, 0);
  assert.ok(mock.logs.includes("BLOQUEADO auth-caducidad-real-REST-Storage"));
});

test("SEC-06 never interprets cross-account rows, missing service, redirected signatures or renewed revoked sessions as success", async () => {
  for (const fault of ["foreign-row", "foreign-file", "service-error", "signed-redirect", "refresh-reuse"] as const) {
    const mock = scenario(fault);
    const suite = fault === "refresh-reuse" ? "auth" : "core";
    await assert.rejects(runStandard(suite, configFrom(env, fixture, suite), mock.send, mock.report));
    assert.equal(mock.live.size, 0);
    assert.ok(mock.logs.some(log => log.startsWith("FALLO ")));
    assert.ok(mock.logs.every(log => !/sensitive|synthetic|example.invalid/.test(log)));
  }
  assert.equal(storageDenied(400, { statusCode: "404" }), true);
  assert.equal(storageDenied(400, { statusCode: "400" }), false);
  assert.equal(storageDenied(429), false);
  assert.equal(storageDenied(503), false);
});

test("SEC-06 optional video requires explicit origins and detects stale copies after revocation", async () => {
  assert.throws(() => videoSettings({}));
  assert.throws(() => videoSettings({ SEC06_VIDEO_GATEWAY_ORIGIN: pilotOrigin }));
  const settings = revocationSettings({
    SEC06_VIDEO_GATEWAY_ORIGIN: "https://gateway.example",
    SEC06_VIDEO_PLAYBACK_ORIGIN: "https://origin.example",
    SEC06_VIDEO_CDN_ORIGIN: "https://cdn.example",
    SEC06_VIDEO_ORIGIN_URL: "https://origin.example/asset?sig=fixture-A",
    SEC06_VIDEO_CDN_URL: "https://cdn.example/asset?sig=fixture-A",
    SEC06_VIDEO_ORIGIN_CONTROL_URL: "https://origin.example/asset?sig=fixture-B",
    SEC06_VIDEO_CDN_CONTROL_URL: "https://cdn.example/asset?sig=fixture-B",
    SEC06_VIDEO_LINKS_VALID_UNTIL: new Date(Date.now() + 360_000).toISOString(),
  });
  for (const stale of [false, true]) {
    const logs: string[] = [];
    let revoked = false;
    const requests: string[] = [];
    const send: typeof fetch = async (input, init) => {
      const req = new Request(input, init);
      assert.equal(req.headers.get("Authorization"), null);
      assert.equal(req.headers.get("apikey"), null);
      assert.equal(req.headers.get("Range"), "bytes=0-0");
      assert.equal(req.redirect, "error");
      requests.push(req.url);
      const denied = revoked && req.url.endsWith("fixture-A") && !(stale && req.url.startsWith("https://cdn."));
      return new Response(null, { status: denied ? 403 : 206, headers: { "Content-Type": "video/mp4" } });
    };
    const result = verifyCopiedLinks(settings, send, (status, name) => logs.push(status + " " + name),
      async () => { revoked = true; });
    if (stale) await assert.rejects(result);
    else {
      await result;
      assert.deepEqual(requests.slice(0, 4), requests.slice(4));
    }
    assert.equal(logs.at(-1)?.startsWith("FALLO "), stale);
    assert.ok(logs.every(log => !log.includes("fixture-A")));
  }
});
