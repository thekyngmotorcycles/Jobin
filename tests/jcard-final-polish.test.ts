import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
import {businessReviewDisplay,businessPhoneLabel} from "../src/lib/jcard-review-display.ts";
const source=(p:string)=>readFileSync(p,"utf8");
test("Five stars stay empty before ten reviews, then reflect actual average to the nearest half",()=>{
 for(const count of [0,1,6,9]){
  const r=businessReviewDisplay(4.9,count);
  assert.equal(r.score,"0.0");assert.deepEqual(r.stars,Array(5).fill("empty"));assert.equal(r.unlocked,false);
 }
 assert.equal(businessReviewDisplay(null,0).countLabel,"Sin reseñas");
 assert.equal(businessReviewDisplay(5,1).countLabel,"1 reseña");
 assert.equal(businessReviewDisplay(5,42).countLabel,"42 reseñas");
 assert.deepEqual(businessReviewDisplay(3.5,18).stars,["full","full","full","half","empty"]);
 assert.deepEqual(businessReviewDisplay(4.2,35).stars,["full","full","full","full","empty"]);
 assert.deepEqual(businessReviewDisplay(5,42).stars,Array(5).fill("full"));
 for(const invalid of [null,NaN,Infinity,0,6])assert.equal(businessReviewDisplay(invalid,15).unlocked,false);
});
test("Phone display normalizes ESP/ENG only; no custom labels are rewritten",()=>{
 for(const [label,expected] of [["Esp","ESP"],["eng","ENG"],["ENG","ENG"],["Ventas","Ventas"],["Español","Español"],["",""]])assert.equal(businessPhoneLabel(label),expected);
});
test("All business faces reuse one compact review row; geometry and privacy stay intact",()=>{
 const card=source("src/components/JobinCard.tsx"),review=source("src/components/BusinessReviewSummary.tsx");
 assert.equal((card.match(/<BusinessReviewSummary rating=\{rating\}/g)??[]).length,2);
 assert.ok(review.includes('flexDirection:"row"')&&review.includes("numberOfLines={1}"));
 assert.ok(card.includes("const cardHeight=surface.height;"));
 assert.ok(card.includes("visibility.business_show_phone")&&card.includes("visibility.business_show_email"));
});
test("Profile actions follow shared private dimensions and singular counter labels",()=>{
 const counts=source("src/components/ProfileFollowCounts.tsx"),actions=source("src/components/ProfileCommunityActions.tsx"),card=source("src/components/JobinCard.tsx"),shared=source("src/components/ProfileSharedSections.tsx");
 assert.ok(counts.includes('counts?.followers===1?"Seguidor":"Seguidores"')&&counts.includes('counts?.contacts===1?"Contacto":"Contactos"'));
 assert.ok(!actions.includes("marginVertical:10")&&!actions.includes("minHeight:52"));
 for(const s of [actions,card]){
  assert.ok(s.includes("minHeight:JOBEEN_CONTROL.touchTarget")&&s.includes("borderRadius:JOBEEN_CONTROL.buttonRadius"));
  assert.ok(s.includes('gap:8,')&&s.includes('paddingVertical:10'));
 }
 assert.ok(shared.includes("gap:actionsInset>0?10:14")&&shared.includes("jcardSurfaceMetrics.maxWidth+2*actionsInset"));
});
test("Opacity is increased for profile routes only, while navigation behavior is unchanged",()=>{
 assert.ok(source("src/components/PersistentBottomTabs.tsx").includes('profileOpaque={pathname==="/jcard"}'));
 assert.ok(source("src/app/(tabs)/_layout.tsx").includes('profileOpaque={pathname==="/profile"||pathname==="/(tabs)/profile"}'));
});
