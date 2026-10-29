import assert from "node:assert/strict";
import test from "node:test";
import { addInterest, filterByCity, rankByRating, toggleItem } from "../src/lib/domain.ts";
test("repeated likes do not create duplicate interests; intent stays independent", () => {
  const first = addInterest([], { professionalId: "ana", intent: "Amistad" });
  assert.equal(addInterest(first, { professionalId: "ana", intent: "Amistad" }), first);
  const next = addInterest(first, { professionalId: "ana", intent: "Profesionales" });
  assert.equal(next.length, 2);
  assert.equal(first.length, 1);
});
test("city filtering preserves every local professional and supports all cities", () => {
  const people = [{ city: "Miami", id: 1 }, { city: "Orlando", id: 2 }, { city: "Miami", id: 3 }];
  assert.deepEqual(filterByCity(people, "Miami").map(p => p.id), [1, 3]);
  assert.equal(filterByCity(people, "Todas").length, 3);
  assert.deepEqual(filterByCity(people, "Unknown"), []);
});
test("toggle save and membership removes only the chosen item", () => {
  const original = ["ana", "sofia"];
  assert.deepEqual(toggleItem(original, "ana"), ["sofia"]);
  assert.deepEqual(toggleItem(original, "marcos"), ["ana", "sofia", "marcos"]);
  assert.deepEqual(original, ["ana", "sofia"]);
});
test("rankByRating puts the best-rated first, breaks ties by reviews, and does not mutate input", () => {
  const people = [
    { id: "a", rating: 4.7, reviews: 80 },
    { id: "b", rating: 4.9, reviews: 10 },
    { id: "c", rating: 4.7, reviews: 120 },
  ];
  assert.deepEqual(rankByRating(people).map(p => p.id), ["b", "c", "a"]);
  assert.deepEqual(people.map(p => p.id), ["a", "b", "c"]);
});
