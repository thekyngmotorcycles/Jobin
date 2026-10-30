import { test } from "node:test";
import assert from "node:assert/strict";
import { addStrike, canGoLive, canReview, extendAuthorization, grantReviewAuthorization, rankStories, REVIEW_AUTH_DAYS, canSendJobinCard, canDeleteApprovedEmployment } from "../src/lib/rules.ts";

const DAY = 86_400_000;

test("review authorization expires after 30 days", () => {
  const auth = grantReviewAuthorization(0);
  assert.equal(canReview(auth, REVIEW_AUTH_DAYS * DAY - 1), true);
  assert.equal(canReview(auth, REVIEW_AUTH_DAYS * DAY), false);
  assert.equal(canReview(null, 0), false);
});

test("extension adds months from the later of expiry or now", () => {
  const auth = grantReviewAuthorization(0);
  const extended = extendAuthorization(auth, 3, 0);
  assert.equal(extended.expiresAt, 30 * DAY + 90 * DAY);
  const expired = extendAuthorization(auth, 1, 100 * DAY);
  assert.equal(expired.expiresAt, 100 * DAY + 30 * DAY);
});

test("second strike bans for one year", () => {
  let s = addStrike({ count: 0, bannedUntil: null }, 0);
  assert.equal(canGoLive(s, 1, null), true);
  s = addStrike(s, 10);
  assert.equal(canGoLive(s, 11, null), false);
  assert.equal(canGoLive(s, 366 * DAY, null), true);
});

test("live is blocked when employer has not approved", () => {
  assert.equal(canGoLive({ count: 0, bannedUntil: null }, 0, false), false);
  assert.equal(canGoLive({ count: 0, bannedUntil: null }, 0, true), true);
});

test("Jobin Card only goes from owner to a company that requested it", () => {
  assert.equal(canSendJobinCard("company", true, true), true);
  assert.equal(canSendJobinCard("personal", true, true), false);
  assert.equal(canSendJobinCard("company", false, true), false);
  assert.equal(canSendJobinCard("company", true, false), false);
});

test("approved employment cannot be deleted", () => {
  assert.equal(canDeleteApprovedEmployment({ status: "approved" }), false);
  assert.equal(canDeleteApprovedEmployment({ status: "pending" }), true);
});

test("stories rank by interaction", () => {
  const ranked = rankStories([{ id: "a" }, { id: "b" }, { id: "c" }], { b: 9, a: 2 });
  assert.deepEqual(ranked.map(x => x.id), ["b", "a", "c"]);
});
