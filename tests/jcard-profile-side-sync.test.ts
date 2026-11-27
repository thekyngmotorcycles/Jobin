import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
import {resolveProfileCardSide} from "../src/lib/jcard-profile-side.ts";
const source=(p:string)=>readFileSync(p,"utf8");
test("Public face selection respects availability, including a business deep link before business data arrives",()=>{
 for(const side of ["personal","business"] as const){
  assert.equal(resolveProfileCardSide(side,true,true),side);
  assert.equal(resolveProfileCardSide(side,true,false),"personal");
  assert.equal(resolveProfileCardSide(side,false,true),"business");
  assert.equal(resolveProfileCardSide(side,false,false),"personal");
 }
 assert.equal(resolveProfileCardSide("business",true,false),"personal");
 assert.equal(resolveProfileCardSide("business",true,true),"business");
});
test("Both profiles share one selection for the card and About and reset on identity changes",()=>{
 const own=source("src/app/(tabs)/profile.tsx"),visitor=source("src/app/jcard.tsx");
 assert.ok(own.includes('selectedSide={aboutSide} onActiveSideChange={setAboutSide}'));
 assert.ok(own.includes('<ProfileAboutSelector side={aboutSide} onSelect={setAboutSide}'));
 assert.ok(own.includes('if(aboutSide==="business")editBusiness();'));
 assert.ok(own.includes('[card,ownerId,workspaceSession]'));
 assert.ok(visitor.includes('selectedSide={activeCardSide} onActiveSideChange={setActiveCardSide}'));
 assert.ok(visitor.includes('<ProfileAboutSelector side={activeCardSide} onSelect={setActiveCardSide}'));
 assert.ok(visitor.includes('resolveProfileCardSide(requestedCardSide,cardVisibility.personal_enabled,!!publicBusiness)'));
 assert.ok(visitor.includes('[card,user,publicScope?.session]'));
 assert.ok(!visitor.includes("aboutPreference"));
 assert.ok(!/\baboutSide\b/.test(visitor),"No stale independent About state in public profile");
 assert.ok(visitor.includes('section==="cv"&&activeCardSide==="business"&&cardVisibility.business_enabled&&publicBusiness'));
 assert.ok(visitor.includes('section==="cv"&&activeCardSide==="personal"&&cardVisibility.personal_enabled'));
 assert.ok(visitor.includes('visibleCardSide={activeCardSide}'));
 assert.ok(visitor.includes('saveVisibleJCard(user,activeCardSide,viewer,origin.scope)'));
});
test("Controlled JCard flips on selection and reports gestures without echoing or resetting controlled props",()=>{
 const card=source("src/components/JobinCard.tsx"),flip=source("src/components/BusinessCard3D.tsx");
 assert.ok(card.includes('selectedSide===undefined?localBack:selectedSide==="business"'));
 assert.ok(card.includes('if(selectedSide===undefined)onActiveSideChange?.(back?"business":"personal")'));
 assert.ok(card.includes('onSideChange={side=>{if(selectedSide===undefined)setLocalBack(side==="business");else onActiveSideChange?.(side);}}'));
 assert.ok(card.includes('side={back?"business":"personal"}'));
 assert.ok(flip.includes('angle.value=withSpring(side==="business"?180:0,SPRING)'));
 assert.ok(flip.includes('if(moving.value)angle.value=withSpring(side==="business"?180:0,SPRING)'));
 assert.ok(flip.includes('onSide(next)'));
});
