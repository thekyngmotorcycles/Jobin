import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import { AuthClient } from "@supabase/supabase-js";
import ts from "typescript";
import * as boundary from "../src/lib/auth-entry-boundary.ts";
import { createCredentialVault } from "../src/lib/credential-vault.ts";

type Modules = Record<string, unknown>;
function loadSource<T>(path: string, modules: Modules): T {
  const { outputText } = ts.transpileModule(readFileSync(path, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
    fileName: path,
  });
  const module = { exports: {} };
  const requireFixture = (name: string) => {
    assert.ok(Object.hasOwn(modules, name), `Unexpected import: ${name}`);
    return modules[name];
  };
  new Function("require", "module", "exports", outputText)(requireFixture, module, module.exports);
  return module.exports as T;
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(done => { resolve = done; });
  return { promise, resolve };
}

function intentStorage() {
  const storage = new Map<string, string>();
  return {
    async getItem(key: string) { return storage.get(key) ?? null; },
    async setItem(key: string, value: string) { storage.set(key, value); },
    async removeItem(key: string) { storage.delete(key); },
  };
}

function loadEntry(auth: unknown, asyncStorage: ReturnType<typeof intentStorage>) {
  return loadSource<typeof import("../src/lib/auth-entry.ts")>("src/lib/auth-entry.ts", {
    "@react-native-async-storage/async-storage": asyncStorage,
    "./auth-entry-boundary": boundary,
    "./supabase": { requireSupabase: () => ({ auth }) },
  });
}

function fixture() {
  const asyncStorage = intentStorage();
  let session: { user: { id: string }; access_token: string } | null = null;
  const exchangedCodes: string[] = [];
  const exchangeStarted = deferred<void>();
  let pauseExchange: Promise<void> | undefined;
  let pauseSession: Promise<void> | undefined;
  const auth = {
    async getSession() {
      await pauseSession;
      return { data: { session }, error: null };
    },
    async signInWithOAuth() { return { data: { url: "https://example.test/authorize" }, error: null }; },
    async exchangeCodeForSession(code: string) {
      exchangedCodes.push(code);
      exchangeStarted.resolve();
      await pauseExchange;
      session = { user: { id: "google-owner" }, access_token: "google-token" };
      return { data: { session }, error: null };
    },
    async getUser() { return { data: { user: session?.user } }; },
    onAuthStateChange() { return { data: { subscription: { unsubscribe() {} } } }; },
  };
  const profile = {
    usernames: { username: "tester" },
    profiles: { display_name: "Tester" },
    jcard_profiles: { handle: "tester" },
  };
  const supabase = {
    auth,
    from: (name: keyof typeof profile) => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: profile[name] }) }) }),
    }),
  };
  function createEntry() {
    return loadEntry(auth, asyncStorage);
  }

  function mountGate(entry: ReturnType<typeof createEntry>, initial: Promise<string | null>, nativeInitial: string | null = null) {
    let cachedUrl = nativeInitial;
    let urlListener!: (event: { url: string }) => void;
    let resume!: (state: string) => void;
    let cleanup: () => void = () => {};
    const states: unknown[] = [];
    const react = {
      createContext: () => ({ Provider: Symbol() }),
      useRef: (current: unknown) => ({ current }),
      useEffect: (effect: () => () => void) => { cleanup = effect(); },
      useState: (value: unknown) => {
        const index = states.push(value) - 1;
        return [value, (next: unknown) => { states[index] = next; }];
      },
      Fragment: Symbol(),
    };
    const { AuthGate } = loadSource<typeof import("../src/components/AuthGate.tsx")>("src/components/AuthGate.tsx", {
      react,
      "react/jsx-runtime": { jsx() {} },
      "react-native": {
        Platform: { OS: "android" },
        AppState: {
          addEventListener: (_event: string, action: typeof resume) => {
            resume = action;
            return { remove() {} };
          },
        },
      },
      "expo-linking": {
        getInitialURL: () => initial,
        getLinkingURL: () => cachedUrl,
        addEventListener: (_event: string, action: typeof urlListener) => {
          urlListener = action;
          return { remove() {} };
        },
      },
      "@react-native-async-storage/async-storage": asyncStorage,
      "../lib/auth-entry": entry,
      "../lib/auth-entry-boundary": boundary,
      "../lib/auth-navigation-phase": { classifyAuthNavigation() {} },
      "../lib/supabase": { supabase },
      "../lib/session-lifetime": { sessionMarkerKey: (owner: string) => owner, sessionLifetimeState: () => "missing" },
      "../lib/session-exit-fence": {
        sessionExitFence: { current: () => null, assertOpen() {}, subscribe: () => () => {} },
      },
    });
    AuthGate({ children: null });
    return {
      cache: (url: string) => { cachedUrl = url; },
      emit: (url: string) => { cachedUrl = url; urlListener({ url }); },
      activate: () => resume("active"),
      checkingOAuth: () => states[2],
      scope: () => states[1],
      cleanup,
    };
  }

  return {
    createEntry, mountGate, exchangedCodes, exchangeStarted,
    holdExchange: (promise: Promise<void>) => { pauseExchange = promise; },
    holdSessionRead: (promise: Promise<void>) => { pauseSession = promise; },
  };
}

const tick = () => new Promise<void>(resolve => setImmediate(resolve));

test("Android resume consumes the cached PKCE callback when React Native loses the event", async () => {
  const app = fixture();
  const entry = app.createEntry();
  const gate = app.mountGate(entry, Promise.resolve(null));
  try {
    await tick();
    await entry.startGoogleAuth(async () => {});
    gate.cache("jobin://?code=android-return");
    gate.activate();
    await tick();
    assert.deepEqual(app.exchangedCodes, ["android-return"]);
    assert.equal(gate.scope(), "google-owner");
    gate.emit("jobin://?code=android-return");
    gate.activate();
    await tick();
    assert.deepEqual(app.exchangedCodes, ["android-return"]);
  } finally { gate.cleanup(); }
});

test("a stale Android launch URL cannot expose Login during a live Google exchange", async () => {
  const app = fixture();
  const entry = app.createEntry();
  const initial = deferred<string | null>();
  const exchange = deferred<void>();
  app.holdExchange(exchange.promise);
  const gate = app.mountGate(entry, initial.promise);
  try {
    await entry.startGoogleAuth(async () => {});
    gate.emit("jobin://?code=live-return");
    await app.exchangeStarted.promise;
    assert.equal(gate.checkingOAuth(), true);
    initial.resolve("jobin://");
    await tick();
    assert.equal(gate.checkingOAuth(), true, "Login became available while the exchange still owns the lease");
    await assert.rejects(entry.runSignedOutAuth(async () => true), /Hay un acceso en proceso/);
  } finally {
    exchange.resolve();
    await tick();
    gate.cleanup();
  }
});

test("Android recreation consumes Expo's cached callback ahead of an unrelated launch URL", async () => {
  const app = fixture();
  await app.createEntry().startGoogleAuth(async () => {});
  const recreated = app.createEntry();
  const gate = app.mountGate(recreated, Promise.resolve("jobin://"), "jobin:///?code=restart-return");
  try {
    await tick();
    assert.deepEqual(app.exchangedCodes, ["restart-return"]);
    assert.equal(gate.scope(), "google-owner");
  } finally { gate.cleanup(); }
});

test("the hostless GoTrue callback completes Google Login on Android after the app is recreated", async () => {
  const app = fixture();
  await app.createEntry().startGoogleAuth(async () => {});
  const gate = app.mountGate(app.createEntry(), Promise.resolve(null));
  try {
    await tick();
    gate.emit("jobin:?code=gotrue-return");
    await tick();
    assert.deepEqual(app.exchangedCodes, ["gotrue-return"]);
    assert.equal(gate.scope(), "google-owner");
  } finally { gate.cleanup(); }
});

test("Login is unavailable as soon as a valid Google return reserves the entry, before Supabase responds", async () => {
  const app = fixture();
  const entry = app.createEntry();
  const gate = app.mountGate(entry, Promise.resolve(null));
  const sessionRead = deferred<void>();
  try {
    await tick();
    await entry.startGoogleAuth(async () => {});
    app.holdSessionRead(sessionRead.promise);
    gate.emit("jobin://?code=return-with-slow-session");
    await tick();
    assert.deepEqual(app.exchangedCodes, []);
    await assert.rejects(entry.startGoogleAuth(async () => {}), /Hay un acceso en proceso/);
    assert.equal(gate.checkingOAuth(), true, "Login must be guarded before the pending session read completes");
  } finally {
    sessionRead.resolve();
    await tick();
    gate.cleanup();
  }
  assert.deepEqual(app.exchangedCodes, ["return-with-slow-session"]);
  assert.equal(gate.scope(), "google-owner");
});

test("a cached navigation link cannot hide a valid React Native startup callback", async () => {
  const app = fixture();
  await app.createEntry().startGoogleAuth(async () => {});
  const gate = app.mountGate(app.createEntry(), Promise.resolve("jobin://?code=startup-return"), "jobin://");
  try {
    await tick();
    assert.deepEqual(app.exchangedCodes, ["startup-return"]);
    assert.equal(gate.scope(), "google-owner");
  } finally { gate.cleanup(); }
});

test("another entry removes the old persisted Google intent even if Email Login fails", async () => {
  const app = fixture();
  const entry = app.createEntry();
  await entry.startGoogleAuth(async () => {});
  await assert.rejects(entry.runSignedOutAuth(async () => { throw new Error("Invalid password"); }), /Invalid password/);
  const recreated = app.createEntry();
  const gate = app.mountGate(recreated, Promise.resolve("jobin://?code=abandoned-return"));
  try {
    await tick();
    assert.deepEqual(app.exchangedCodes, []);
    assert.equal(gate.scope(), null);
    assert.equal(await recreated.runSignedOutAuth(async () => "email-can-retry"), "email-can-retry");
  } finally { gate.cleanup(); }
});

test("Supabase SDK exchanges the stored PKCE verifier once and a later Email Login retains its own account", async () => {
  const key = "sb-fixture-auth-token";
  const secretValues = new Map<string, string>();
  const backend = {
    async isAvailableAsync() { return true; },
    async getItemAsync(name: string) { return secretValues.get(name) ?? null; },
    async setItemAsync(name: string, value: string) { secretValues.set(name, value); },
    async deleteItemAsync(name: string) { secretValues.delete(name); },
  };
  const expectedAuthUrl = "https://example.test/auth/v1";
  const grants: string[] = [];
  let challenge: string | null = null;
  const transport: typeof fetch = async (input, init) => {
    const url = new URL(String(input));
    assert.equal(url.origin, "https://example.test");
    if (url.pathname.endsWith("/logout")) return new Response(null, { status: 204 });
    assert.equal(url.pathname, "/auth/v1/token");
    const grant = url.searchParams.get("grant_type");
    assert.ok(grant);
    grants.push(grant);
    const body = JSON.parse(String(init?.body));
    if (grant === "pkce") {
      assert.equal(body.auth_code, "google-code");
      assert.equal(createHash("sha256").update(body.code_verifier).digest("base64url"), challenge);
    } else {
      assert.equal(grant, "password");
      assert.equal(body.email, "email-fixture@example.test");
    }
    const owner = grant === "pkce" ? "google-owner" : "email-owner";
    return Response.json({
      access_token: owner + "-fixture-token",
      refresh_token: owner + "-fixture-refresh",
      expires_in: 3600,
      token_type: "bearer",
      user: { id: owner, aud: "authenticated", role: "authenticated", user_metadata: {}, app_metadata: {} },
    });
  };
  const makeAuth = () => new AuthClient({
    url: expectedAuthUrl, storageKey: key, storage: createCredentialVault(backend, key),
    autoRefreshToken: false, detectSessionInUrl: false, persistSession: true, flowType: "pkce", fetch: transport,
  });
  const intent = intentStorage();
  await loadEntry(makeAuth(), intent).startGoogleAuth(async url => {
    const params = new URL(url).searchParams;
    assert.equal(params.get("redirect_to"), "jobin://");
    assert.equal(params.get("code_challenge_method"), "s256");
    challenge = params.get("code_challenge");
    assert.ok(challenge);
  });

  const auth = makeAuth();
  const entry = loadEntry(auth, intent);
  assert.equal(await entry.exchangePendingGoogle("jobin:?code=google-code", async code => {
    const { data, error } = await auth.exchangeCodeForSession(code);
    assert.ifError(error);
    assert.equal(data.session?.user.id, "google-owner");
  }), "exchanged");
  assert.equal(await entry.exchangePendingGoogle("jobin://?code=google-code", async () => assert.fail("Replayed code")), null);
  await assert.rejects(entry.runSignedOutAuth(async () => assert.fail("An active Google session cannot switch accounts")),
    /Cierra la sesión actual/);

  await entry.runAuthExit(async () => { assert.ifError((await auth.signOut({ scope: "local" })).error); });
  await entry.startGoogleAuth(async () => {});
  await entry.runSignedOutAuth(async () => {
    const { data, error } = await auth.signInWithPassword({ email: "email-fixture@example.test", password: "fixture" });
    assert.ifError(error);
    assert.equal(data.session?.user.id, "email-owner");
  });
  assert.equal(await entry.exchangePendingGoogle("jobin://?code=late-google", async () => assert.fail("Stale Google")),
    null);
  assert.deepEqual(grants, ["pkce", "password"]);
  assert.equal((await auth.getSession()).data.session?.user.id, "email-owner");
});
