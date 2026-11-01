import { contrastRatio,composite,opacity } from "../src/theme/color.ts";
import assert from "node:assert/strict";
import test from "node:test";
import { displayedRating, jcardTier, sealRows } from "../src/lib/jcard.ts";
import { jcardTokens } from "../src/theme/jcard.ts";
import { JCARD_RATING_EXAMPLES, mockJCard } from "../src/mocks/jcard.ts";

function contrast(a:string,b:string){return contrastRatio(a,b);}
function mix(a:string,b:string,fraction:number){return composite(opacity(b,fraction),a);}

test("JCard selects its finish from the displayed one-decimal rating", () => {
  for (const [rating, expected] of [[1,"base"],[3.5,"base"],[3.549,"base"],[3.55,"silver"],[3.6,"silver"],[4.5,"silver"],[4.549,"silver"],[4.55,"gold"],[4.6,"gold"],[5,"gold"]] as const) {
    assert.equal(jcardTier(rating, 5), expected, String(rating));
  }
  assert.equal(displayedRating(4.55, 2), 4.6);
  assert.equal(jcardTier(5,4),"base");
  assert.equal(jcardTier(5,5),"gold");
  assert.equal(displayedRating(null, 0), null);
  assert.equal(displayedRating(5, 0), null);
  assert.equal(jcardTier(null, 0), "base");
});

test("JCard small text meets WCAG AA across every gradient and seal surface", () => {
  for (const theme of ["light","dark","pink","navy-green","camel"] as const) {
    for (const tier of ["base","silver","gold"] as const) {
      const t = jcardTokens(theme, tier);
      for (let step=0; step<=20; step++) {
        const background = mix(t.start, t.end, step / 20);
        for (const foreground of [t.text, t.secondary]) {
          assert.ok(contrast(foreground,background) >= 4.5, theme + "/" + tier + " text on gradient");
        }
      }
      assert.ok(contrast(t.sealText,t.sealFill) >= 4.5, theme + "/" + tier + " verified seal");
      assert.ok(contrast(t.pendingText,t.pendingFill) >= 4.5, theme + "/" + tier + " pending seal");
    }
  }
  assert.notEqual(jcardTokens("light","base").start,jcardTokens("dark","base").start);
});

test("mock matrix covers all 32 requested combinations without global account state", () => {
  let count=0;
  for (const theme of ["light","dark"] as const) {
    for (const rating of JCARD_RATING_EXAMPLES) {
      for (const status of ["ACTIVE","AVAILABLE"] as const) {
        for (const inAcademy of [false,true]) {
          const card = mockJCard(rating,status,inAcademy);
          assert.equal(card.status,status);
          assert.equal(card.inAcademy,inAcademy);
          assert.equal(card.employer !== null,status === "ACTIVE");
          assert.equal(card.role,inAcademy ? "Actor" : "HVAC technician");
          assert.ok(jcardTokens(theme,jcardTier(card.rating,card.reviewCount)));
          assert.equal(new URL(card.profileUrl).hostname,"example.com");
          count++;
        }
      }
    }
  }
  assert.equal(count,32);
});

test("eleven mock seals remain complete, ordered and limited to two rows", () => {
  const card=mockJCard();
  const rows=sealRows(card.seals);
  assert.equal(rows.length,2);
  assert.deepEqual(rows.map(row=>row.length),[6,5]);
  assert.equal(rows.flat().filter(seal=>seal.verified).length,10);
  assert.equal(rows.flat().filter(seal=>!seal.verified).length,1);
  assert.equal(new Set(rows.flat().map(seal=>seal.id)).size,11);
});
