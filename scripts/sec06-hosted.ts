import { createHash } from "node:crypto";
import { setTimeout as wait } from "node:timers/promises";

export const pilotOrigin = "https://mkvzkvkmrribcaecvphq.supabase.co";
export const actors = ["A", "B", "C"] as const;
export const uuid = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/;
const jwt = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;
const fixtureName = /^sec06-[a-z0-9-]{1,48}\.(jpg|png|pdf)$/;
const businessContacts = ["email", "email_secondary", "phone", "phone_secondary"] as const;
const sha256 = /^[0-9a-f]{64}$/;
const imageLimit = 2 * 1024 * 1024;
type Actor = typeof actors[number];
type Json = Record<string, unknown>;

export type Suite = "auth" | "core" | "business" | "expiration" | "video" | "video-revocation";
export type Env = Readonly<Record<string, string | undefined>>;
export type Report = (result: "OK" | "FALLO" | "BLOQUEADO" | "OBSERVACIÓN", check: string) => void;
export type Session = { owner: string; id: string; access: string; refresh: string; expiresAt: number };
export type FileFixture = { name: string; sha256: string };
type Identity = { id: string; email: string; password: string };
type Rows = Record<(typeof rowCases)[number]["fixture"], string>;
type Files = Record<"draft" | "evidence" | "sharedPost", FileFixture>;
export type Config = {
  key: string;
  identities: Record<Actor, Identity>;
  rows?: Rows;
  files?: Partial<Files>;
  expiryWaitSeconds: number;
};

export const rowCases = [
  { fixture: "messageAB", table: "jobeen_direct_messages", ownerColumn: "sender_id", owner: "A", visible: "AB" },
  { fixture: "shopThreadAB", table: "jshop_conversations", ownerColumn: "seller_id", owner: "A", visible: "AB" },
  { fixture: "shopMessageAB", table: "jobeen_direct_messages", ownerColumn: "sender_id", owner: "A", visible: "AB" },
  { fixture: "sharedPostAB", table: "jobeen_feed_posts", ownerColumn: "author_id", owner: "A", visible: "AB" },
  { fixture: "activeStory", table: "jobeen_stories", ownerColumn: "author_id", owner: "A", visible: "ABC" },
  { fixture: "expiredStory", table: "jobeen_stories", ownerColumn: "author_id", owner: "A", visible: "A" },
  { fixture: "publishedListing", table: "jshop_listings", ownerColumn: "seller_id", owner: "A", visible: "ABC" },
  { fixture: "pausedListing", table: "jshop_listings", ownerColumn: "seller_id", owner: "A", visible: "A" },
] as const;

export class Blocked extends Error {}

function requireCheck(condition: unknown): asserts condition {
  if (!condition) throw Error("SEC06 assertion");
}

function object(value: unknown): Json {
  requireCheck(typeof value === "object" && value !== null && !Array.isArray(value));
  return value as Json;
}

function matching(value: unknown, pattern: RegExp): string {
  requireCheck(typeof value === "string" && pattern.test(value));
  return value;
}

export function validateTarget(env: Env) {
  requireCheck(env.SEC06_ALLOW_HOSTED_RUN === "mkvzkvkmrribcaecvphq");
  requireCheck(env.SEC06_SUPABASE_URL === pilotOrigin || env.SEC06_SUPABASE_URL === pilotOrigin + "/");
  return matching(env.SEC06_SUPABASE_PUBLISHABLE_KEY, /^sb_publishable_[A-Za-z0-9_-]{16,128}$/);
}

function fixtureFile(value: unknown): FileFixture {
  const data = object(value);
  return { name: matching(data.name, fixtureName), sha256: matching(data.sha256, sha256) };
}

export function configFrom(env: Env, value: unknown, suite: Suite): Config {
  const key = validateTarget(env);
  const fixture = object(value);
  const identitiesInput = object(fixture.identities);
  const identities = {} as Config["identities"];
  for (const alias of actors) {
    const id = matching(identitiesInput[alias], uuid);
    const email = matching(env[`SEC06_${alias}_EMAIL`], /^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    const password = env[`SEC06_${alias}_PASSWORD`];
    requireCheck(password && password.length <= 1024);
    identities[alias] = { id, email, password };
  }
  requireCheck(new Set(actors.map(alias => identities[alias].id)).size === actors.length);
  requireCheck(new Set(actors.map(alias => identities[alias].email.toLowerCase())).size === actors.length);
  const text = env.SEC06_MAX_EXPIRY_WAIT_SECONDS ?? "180";
  const expiryWaitSeconds = Number(matching(text, /^[1-9]\d{0,3}$/));
  requireCheck(expiryWaitSeconds <= 7200);
  const config: Config = { key, identities, expiryWaitSeconds };
  if (suite === "expiration") {
    config.files = { draft: fixtureFile(object(fixture.files).draft) };
  }
  if (suite === "core") {
    const rows = object(fixture.rows);
    config.rows = Object.fromEntries(rowCases.map(({ fixture: name }) => [name, matching(rows[name], uuid)])) as Rows;
    requireCheck(new Set(Object.values(config.rows)).size === rowCases.length);
    const files = object(fixture.files);
    config.files = { draft: fixtureFile(files.draft), evidence: fixtureFile(files.evidence), sharedPost: fixtureFile(files.sharedPost) };
  }
  return config;
}

export async function bytes(response: Response, limit: number): Promise<Buffer> {
  const reader = response.body?.getReader();
  requireCheck(reader);
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) return Buffer.concat(chunks, total);
      total += value.byteLength;
      requireCheck(total <= limit);
      chunks.push(value);
    }
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}

async function json(response: Response): Promise<unknown> {
  return JSON.parse((await bytes(response, 256 * 1024)).toString("utf8")) as unknown;
}

export async function discard(response: Response) {
  await response.body?.cancel().catch(() => {});
}

export async function check(report: Report, name: string, operation: () => Promise<void>) {
  try {
    await operation();
    report("OK", name);
  } catch (error) {
    report(error instanceof Blocked ? "BLOQUEADO" : "FALLO", name);
    throw error;
  }
}

export function pilotApi(config: Config, send: typeof fetch) {
  const open = new Set<Session>();
  async function request(path: string, options: { method?: string; token?: string; body?: Json } = {}) {
    const url = new URL(path, pilotOrigin);
    requireCheck(url.origin === pilotOrigin && !url.username && !url.password && !url.hash);
    const headers = new Headers({ apikey: config.key, "Cache-Control": "no-store" });
    if (options.token) headers.set("Authorization", "Bearer " + options.token);
    if (options.body) headers.set("Content-Type", "application/json");
    const response = await send(url, {
      method: options.method ?? "GET", redirect: "error", credentials: "omit", cache: "no-store",
      headers, body: options.body ? JSON.stringify(options.body) : undefined, signal: AbortSignal.timeout(20_000),
    });
    requireCheck(!response.redirected);
    return response;
  }

  async function readSession(response: Response, owner: string): Promise<Session> {
    requireCheck(response.status === 200);
    const payload = object(await json(response));
    const access = matching(payload.access_token, jwt);
    const claims = object(JSON.parse(Buffer.from(access.split(".")[1], "base64url").toString("utf8")));
    const id = matching(claims.session_id, uuid);
    const actualOwner = matching(claims.sub, uuid);
    requireCheck(claims.role === "authenticated"
      && claims.aud === "authenticated" && claims.iss === pilotOrigin + "/auth/v1"
      && Number.isSafeInteger(claims.exp) && Number(claims.exp) > Date.now() / 1000);
    requireCheck(typeof payload.refresh_token === "string" && payload.refresh_token.length > 0);
    const session = { owner: actualOwner, id, access, refresh: payload.refresh_token, expiresAt: Number(claims.exp) * 1000 };
    open.add(session);
    requireCheck(object(payload.user).id === owner && actualOwner === owner);
    const user = await request("/auth/v1/user", { token: access });
    requireCheck(user.status === 200 && object(await json(user)).id === owner);
    return session;
  }

  async function login(alias: Actor) {
    const { id, email, password } = config.identities[alias];
    return readSession(await request("/auth/v1/token?grant_type=password", {
      method: "POST", body: { email, password },
    }), id);
  }

  async function refresh(session: Session) {
    const renewed = await readSession(await request("/auth/v1/token?grant_type=refresh_token", {
      method: "POST", body: { refresh_token: session.refresh },
    }), session.owner);
    requireCheck(session.id === renewed.id && session.refresh !== renewed.refresh);
    open.delete(session);
    return renewed;
  }

  async function logout(session: Session) {
    const response = await request("/auth/v1/logout?scope=local", { method: "POST", token: session.access });
    await discard(response);
    requireCheck(response.status === 204);
    open.delete(session);
  }

  async function deniedRefresh(session: Session) {
    const response = await request("/auth/v1/token?grant_type=refresh_token", {
      method: "POST", body: { refresh_token: session.refresh },
    });
    // Track unexpected fresh sessions so a failed revocation can still be cleaned up.
    if (response.ok) await readSession(response, session.owner);
    else {
      requireCheck(response.status === 400 || response.status === 401);
      const code = object(await json(response)).error_code;
      requireCheck(code === "refresh_token_not_found" || code === "refresh_token_already_used" || code === "session_not_found");
      return;
    }
    throw Error("SEC06 revocation");
  }

  async function close() {
    const sessions = new Map([...open].map(session => [session.id, session]));
    const results = await Promise.allSettled([...sessions.values()].map(async session => {
      await logout(session.expiresAt <= Date.now() ? await refresh(session) : session);
    }));
    requireCheck(results.every(result => result.status === "fulfilled"));
  }
  return { request, login, refresh, logout, deniedRefresh, close };
}
export type PilotApi = ReturnType<typeof pilotApi>;

async function rows(api: PilotApi, session: Session, table: string, filter: Record<string, string>, columns: string) {
  const query = new URLSearchParams({ select: columns, limit: "2" });
  for (const [column, value] of Object.entries(filter)) query.set(column, "eq." + value);
  const response = await api.request("/rest/v1/" + table + "?" + query, { token: session.access });
  requireCheck(response.status === 200);
  const value = await json(response);
  requireCheck(Array.isArray(value));
  return value.map(object);
}

async function expectRows(api: PilotApi, viewer: Session, table: string, ids: Record<string, string>, visible: boolean) {
  const result = await rows(api, viewer, table, ids, Object.keys(ids).join(","));
  requireCheck(result.length === (visible ? 1 : 0));
  if (visible) for (const [key, value] of Object.entries(ids)) requireCheck(result[0][key] === value);
}

async function ownerPrefs(api: PilotApi, session: Session, owner = session.owner) {
  await expectRows(api, session, "account_preferences", { profile_id: owner }, owner === session.owner);
}

export function storageDenied(status: number, payload?: unknown) {
  if (status === 401 || status === 403 || status === 404) return true;
  if (status !== 400 || typeof payload !== "object" || payload === null) return false;
  const code = (payload as Json).statusCode;
  return code === "403" || code === "404" || code === 403 || code === 404;
}

export async function expectStorageDenied(response: Response) {
  if (response.status === 400) requireCheck(storageDenied(400, await json(response)));
  else {
    await discard(response);
    requireCheck(storageDenied(response.status));
  }
}

function filePath(owner: Session, bucket: string, fixture: FileFixture) {
  return bucket + "/" + owner.owner + "/" + fixture.name;
}

async function verifyFile(response: Response, fixture: FileFixture) {
  requireCheck(response.status === 200);
  requireCheck(createHash("sha256").update(await bytes(response, imageLimit)).digest("hex") === fixture.sha256);
}

async function fileRead(api: PilotApi, session: Session | undefined, path: string, fixture?: FileFixture) {
  const response = await api.request("/storage/v1/object/authenticated/" + path, { token: session?.access });
  if (fixture) await verifyFile(response, fixture);
  else await expectStorageDenied(response);
}

async function sign(api: PilotApi, session: Session, path: string, fixture?: FileFixture) {
  const response = await api.request("/storage/v1/object/sign/" + path, {
    method: "POST", token: session.access, body: { expiresIn: 30 },
  });
  if (!fixture) return expectStorageDenied(response);
  requireCheck(response.status === 200);
  const signed = matching(object(await json(response)).signedURL, /^\S{1,4096}$/);
  const url = new URL(signed, pilotOrigin + "/storage/v1/");
  if (url.pathname === "/object/sign/" + path) url.pathname = "/storage/v1" + url.pathname;
  const params = [...url.searchParams.keys()];
  requireCheck(url.origin === pilotOrigin && !url.hash && !url.username && !url.password
    && url.pathname === "/storage/v1/object/sign/" + path && params.length === 1 && params[0] === "token"
    && url.searchParams.get("token"));
  await verifyFile(await api.request(url.pathname + url.search), fixture);
}

type Sessions = Record<Actor, Session>;

async function logins(api: PilotApi, report: Report): Promise<Sessions> {
  const sessions = {} as Sessions;
  await check(report, "auth-identidades-A-B-C", async () => {
    for (const alias of actors) sessions[alias] = await api.login(alias);
    requireCheck(new Set(actors.map(alias => sessions[alias].id)).size === actors.length);
  });
  return sessions;
}

async function core(config: Config, api: PilotApi, sessions: Sessions, report: Report) {
  const { A, B, C } = sessions;
  await check(report, "RLS-perfiles-JCards-ubicaciones", async () => {
    for (const viewer of [A, B, C]) {
      for (const owner of [A, B, C]) {
        await expectRows(api, viewer, "profiles", { id: owner.owner }, true);
        await ownerPrefs(api, viewer, owner.owner);
        await expectRows(api, viewer, "jcard_personal_contacts", { owner_id: owner.owner }, viewer === owner);
        await expectRows(api, viewer, "jshop_seller_locations", { seller_id: owner.owner }, viewer === owner);
      }
    }
  });
  for (const probe of rowCases) {
    await check(report, "RLS-" + probe.fixture, async () => {
      const ids = { id: config.rows![probe.fixture], [probe.ownerColumn]: sessions[probe.owner].owner };
      for (const alias of actors) await expectRows(api, sessions[alias], probe.table, ids, probe.visible.includes(alias));
    });
  }
  await check(report, "fixture-audiencia-y-objeto-del-post", async () => {
    const data = await rows(api, A, "jobeen_feed_posts", { id: config.rows!.sharedPostAB, author_id: A.owner },
      "audience,audience_followers,audience_contacts,photo_paths,photo_bucket");
    const expected = A.owner + "/" + config.files!.sharedPost!.name;
    requireCheck(data.length === 1 && data[0].audience === "private" && data[0].audience_followers === true
      && data[0].audience_contacts === false && data[0].photo_bucket === "jobeen-private-post-photos"
      && Array.isArray(data[0].photo_paths) && data[0].photo_paths.length === 1 && data[0].photo_paths[0] === expected);
  });
  await check(report, "RLS-favoritos-JShop", async () => {
    const ids = { user_id: B.owner, listing_id: config.rows!.publishedListing };
    for (const viewer of [A, B, C]) await expectRows(api, viewer, "jshop_favorites", ids, viewer === B);
  });
  const files = config.files!;
  const probes = [
    { bucket: "jobeen-post-draft-photos", file: files.draft!, shared: false },
    { bucket: "employer-report-evidence", file: files.evidence!, shared: false },
    { bucket: "jobeen-private-post-photos", file: files.sharedPost!, shared: true },
  ];
  for (const { bucket, file, shared } of probes) {
    await check(report, "Storage-" + bucket, async () => {
      const path = filePath(A, bucket, file);
      await fileRead(api, A, path, file);
      await sign(api, A, path, file);
      if (shared) await fileRead(api, B, path, file);
      else {
        await fileRead(api, B, path);
        await sign(api, B, path);
      }
      await fileRead(api, C, path);
      await sign(api, C, path);
      await fileRead(api, undefined, path);
      await expectStorageDenied(await api.request("/storage/v1/object/public/" + path));
    });
  }
}

async function business(api: PilotApi, { A, B, C }: Sessions, report: Report) {
  await check(report, "RLS-JCard-empresarial", async () => {
    const ids = { owner_id: A.owner };
    const columns = "owner_id," + businessContacts.join(",");
    const privateRows = await rows(api, A, "jcard_business_details", ids, columns);
    requireCheck(privateRows.length === 1 && privateRows[0].owner_id === A.owner);
    requireCheck(businessContacts.every(field => typeof privateRows[0][field] === "string" && privateRows[0][field]));
    for (const viewer of [B, C]) {
      await expectRows(api, viewer, "jcard_business_details", ids, false);
      const publicRows = await rows(api, viewer, "jobeen_public_business_cards", ids, columns);
      requireCheck(publicRows.length === 1 && publicRows[0].owner_id === A.owner);
      for (const field of businessContacts) requireCheck(publicRows[0][field] === null);
    }
  });
}

async function sessions(api: PilotApi, { A, B, C }: Sessions, report: Report) {
  await check(report, "auth-cambio-A-B-A", async () => {
    await ownerPrefs(api, A);
    await ownerPrefs(api, B);
    await ownerPrefs(api, B, A.owner);
    const a2 = await api.login("A");
    requireCheck(a2.id !== A.id);
    await ownerPrefs(api, a2);
    await ownerPrefs(api, a2, B.owner);
    const renewed = await api.refresh(A);
    await api.logout(renewed);
    await api.deniedRefresh(renewed);
    await Promise.all([ownerPrefs(api, B), ownerPrefs(api, C), ownerPrefs(api, a2)]);
    const probe = await api.request("/rest/v1/account_preferences?select=profile_id&profile_id=eq." + A.owner, { token: renewed.access });
    if (probe.status === 200) {
      const data = await json(probe);
      requireCheck(Array.isArray(data) && data.length <= 1);
      if (data.length) report("OBSERVACIÓN", "REST-acepta-JWT-tras-logout-en-la-muestra");
    } else {
      await discard(probe);
      requireCheck(probe.status === 401 || probe.status === 403);
    }
  });
}

export async function expiration(config: Config, api: PilotApi, session: Session, report: Report) {
  await check(report, "auth-caducidad-real-REST-Storage", async () => {
    const fixture = config.files!.draft!;
    const path = filePath(session, "jobeen-post-draft-photos", fixture);
    await ownerPrefs(api, session);
    await fileRead(api, session, path, fixture);
    // Allow for the JWT verifier's clock-skew tolerance. This is a real issued token.
    const delay = Math.max(0, session.expiresAt - Date.now()) + 65_000;
    if (delay > config.expiryWaitSeconds * 1000) throw new Blocked();
    await wait(delay);
    const data = await api.request("/rest/v1/account_preferences?select=profile_id&profile_id=eq." + session.owner, { token: session.access });
    await discard(data);
    requireCheck(data.status === 401);
    const user = await api.request("/auth/v1/user", { token: session.access });
    await discard(user);
    requireCheck(user.status === 401 || user.status === 403);
    await fileRead(api, session, path);
    // Rotate the legitimately held refresh token and restore the positive controls.
    const renewed = await api.refresh(session);
    await ownerPrefs(api, renewed);
    await fileRead(api, renewed, path, fixture);
  });
}

export async function runWithSessions(config: Config, send: typeof fetch, report: Report,
  operation: (api: PilotApi, sessions: Sessions) => Promise<void>) {
  const api = pilotApi(config, send);
  try {
    await operation(api, await logins(api, report));
  } finally {
    await check(report, "auth-cierre-sesiones-del-ensayo", () => api.close());
  }
}

export async function runStandard(suite: "auth" | "core" | "business" | "expiration", config: Config, send: typeof fetch, report: Report) {
  if (suite === "expiration") {
    const api = pilotApi(config, send);
    try {
      const session = await api.login("A");
      await expiration(config, api, session, report);
    } finally {
      await check(report, "auth-cierre-sesiones-del-ensayo", () => api.close());
    }
    return;
  }
  await runWithSessions(config, send, report, async (api, accounts) => {
    if (suite === "auth") await sessions(api, accounts, report);
    if (suite === "core") await core(config, api, accounts, report);
    if (suite === "business") await business(api, accounts, report);
  });
}
