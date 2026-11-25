import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=(p:string)=>readFileSync(p,"utf8");
test("Local JCard appearance can only be read and changed by the verified owner",()=>{
 const store=read("src/lib/jcard-appearance.ts"),gallery=read("src/app/jcard-backgrounds.tsx"),card=read("src/components/JobinCard.tsx");
 assert.ok(store.includes("if(scope.owner!==owner)"));
 assert.ok(store.includes("await assertMessageScope(scope)"));
 assert.ok(store.includes("serializePrivateWrite(key(owner,side)"));
 assert.ok(gallery.includes("saveJCardAppearance(scope.owner,selected,side,scope)"));
 assert.ok(card.includes("if(!ownerId||!showOwnerActions)"));
 assert.ok(card.includes("if(scope.owner!==ownerId||!live)return;"));
 // The approved redesign removed the optional tutorial entirely; owner-only
 // appearance access above remains required.
 assert.ok(!card.includes("jobeen.jcard.flip.ghost"));
 assert.ok(!card.includes("AsyncStorage"));
 assert.ok(card.includes('readJCardAppearance(ownerId,"personal",scope)'));
 assert.ok(card.includes('readJCardAppearance(ownerId,"business",scope)'));
});
test("Quick composer preference is cloud-authoritative with current-session fallback only",()=>{
 const store=read("src/lib/home-preferences.ts"),header=read("src/components/SocialHeader.tsx");
 assert.ok(!store.includes("AsyncStorage"));
 assert.ok(store.includes("if(scope.owner!==owner)"));
 assert.ok(store.includes("if(row&&row.profile_id!==owner)"));
 assert.ok(store.includes("memory.read(scope)"));
 assert.ok(store.includes('if(next!==observed||event==="SIGNED_OUT")memory.clear()'));
 assert.ok(header.includes("saveQuickComposerPreference(owner,next,scope)"));
 assert.ok(header.includes("if(scopeRef.current!==scope)return;"));
});
