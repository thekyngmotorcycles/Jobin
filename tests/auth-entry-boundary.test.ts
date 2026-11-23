import test from "node:test";
import assert from "node:assert/strict";
import { createAuthEntryBoundary, isGoogleCallbackUrl, parseGoogleCallback } from "../src/lib/auth-entry-boundary.ts";

function pendingStore(initial = NaN) {
  let deadline = initial;
  return {
    async readDeadline() { return deadline; },
    async writeDeadline(value: number) { deadline = value; },
    async clear() { deadline = NaN; },
  };
}

test("only a single valid code on the configured empty-host redirect can be exchanged", () => {
  assert.equal(parseGoogleCallback("jobin://?code=abc-123"), "abc-123");
  assert.equal(parseGoogleCallback("jobin:///?code=abc"), "abc");
  assert.equal(parseGoogleCallback("jobeen-security-pilot://?code=abc", "jobeen-security-pilot"), "abc");
  assert.equal(parseGoogleCallback("jobin://?code=abc", "jobeen-security-pilot"), null);
  for (const url of ["jobin://profile?code=abc", "jobin://?code=a&code=b", "jobin://?code=a#x",
    "https://x/?code=a", "jobin://?code=%0A", "jobin://?code=%ZZ", "jobin://?code=abc&state=unexpected"]) {
    assert.equal(parseGoogleCallback(url), null);
  }
  for (const url of ["jobin://", "jobin:///", "jobin://profile", "jobin://profile?code=abc", "jobin://?unrelated=true"]) {
    assert.equal(isGoogleCallbackUrl(url), false);
  }
});

test("unsolicited, duplicate and expired returns cannot exchange", async () => {
  let now = 1000;
  let calls = 0;
  const boundary = createAuthEntryBoundary(() => now);
  const exchange = () => boundary.completeGoogle("jobin://?code=fixture", async () => ++calls);
  assert.equal(await exchange(), null);
  await boundary.google(ready => ready());
  assert.equal(await exchange(), 1);
  assert.equal(await exchange(), null);
  await boundary.google(ready => ready());
  now += 300001;
  assert.equal(await exchange(), null);
  assert.equal(calls, 1);
});

test("a fresh entry may replace an abandoned browser, while a claimed exchange remains exclusive", async () => {
  const boundary = createAuthEntryBoundary();
  const replace = { replacePendingGoogle: true };
  await boundary.google(ready => ready());
  await assert.rejects(boundary.exclusive(async () => true), /Hay un acceso en proceso/);
  assert.equal(await boundary.exclusive(async () => true, replace), true);
  await boundary.google(ready => ready());
  const result = await boundary.completeGoogle("jobin://?code=fixture", async () => {
    await assert.rejects(boundary.exclusive(async () => true, replace), /Hay un acceso en proceso/);
    await assert.rejects(boundary.google(ready => ready(), replace), /Hay un acceso en proceso/);
    return 1;
  });
  assert.equal(result, 1);
  assert.equal(await boundary.exclusive(async () => true), true);
});

test("a stored intent can be claimed only once after recreation, within its deadline", async () => {
  const now = 1000;
  for (const deadline of [now-1, now+300001]) {
    const boundary = createAuthEntryBoundary(() => now, pendingStore(deadline));
    assert.equal(await boundary.completeGoogle("jobin://?code=fixture", async () => true), null);
  }

  const store = pendingStore(now+120000);
  const boundary = createAuthEntryBoundary(() => now, store);
  const claims = await Promise.all([
    boundary.completeGoogle("jobin://?code=fixture", async code => code),
    boundary.completeGoogle("jobin://?code=fixture", async code => code),
  ]);
  assert.deepEqual(claims, ["fixture", null]);
  const relaunched = createAuthEntryBoundary(() => now, store);
  assert.equal(await relaunched.completeGoogle("jobin://?code=fixture", async code => code), null);
});

test("ordinary app links preserve a pending attempt and an explicit malformed return consumes it safely", async () => {
  const store = pendingStore();
  const boundary = createAuthEntryBoundary(Date.now, store);
  await boundary.google(ready => ready());
  for (const url of ["jobin://", "jobin://auth?code=abc"]) {
    assert.equal(await boundary.completeGoogle(url, async () => assert.fail("Not an OAuth return")), null);
    assert.ok(Number.isFinite(await store.readDeadline()));
  }
  assert.equal(await boundary.completeGoogle("jobin://#error=access_denied", async code => code ?? "invalid"), "invalid");
  assert.ok(Number.isNaN(await store.readDeadline()));
  assert.equal(await boundary.exclusive(async () => true), true);
});
