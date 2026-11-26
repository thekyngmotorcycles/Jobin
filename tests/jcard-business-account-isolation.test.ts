import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {wrapBusinessCardName} from "../src/lib/business-card-layout.ts";

const file=(path:string)=>readFileSync(path,"utf8");
const profile=file("src/app/(tabs)/profile.tsx");
const editor=file("src/app/jcard-business-edit.tsx");
const cloud=file("src/lib/jcard-cloud.ts");
const cache=file("src/lib/business-card-cache.ts");
const card=file("src/components/JobinCard.tsx");
const avatar=file("src/app/personal-avatar-editor.tsx");

test("Business caches are account-scoped and legacy shared data is never imported",()=>{
 assert.ok(!cache.includes("AsyncStorage"));
 assert.ok(cache.includes("createBusinessSessionMemory<BusinessCardData>()"));
 assert.ok(cache.includes("await assertAccountOwner(owner,scope.session)"));
 assert.ok(cache.includes('event==="SIGNED_OUT"'));
 assert.ok(!profile.includes('AsyncStorage.getItem("jobin.business.card.v1")'));
 assert.ok(!profile.includes('AsyncStorage.setItem("jobin.business.card.v1")'));
 assert.ok(!editor.includes('AsyncStorage.getItem("jobin.business.card.v1")'));
 assert.ok(!editor.includes('AsyncStorage.setItem("jobin.business.card.v1")'));
 assert.ok(profile.includes("readScopedBusinessCard(owner,scope)"));
 assert.ok(profile.includes("writeScopedBusinessCard(owner,current,scope)"));
 assert.ok(!editor.includes("writeScopedBusinessCard("));
 assert.ok(!editor.includes("readScopedBusinessCard("));
 assert.ok(!avatar.includes('AsyncStorage.getItem("jobin.business.card.v1")'));
 assert.ok(!avatar.includes('AsyncStorage.setItem("jobin.business.card.v1")'));
 assert.ok(avatar.includes("await writeCloudBusiness(updated,owner,scope)"));
 assert.ok(avatar.includes("await writeScopedBusinessCard(owner,updated,scope)"));
});
test("Missing business cloud records cannot trigger uploads from previous accounts",()=>{
 assert.ok(!profile.includes("await writeCloudBusiness(local)"));
 assert.ok(profile.includes("const current={...EMPTY_BUSINESS_CARD,...(row??{})}"));
 assert.ok(profile.includes("scope={owner,session:await assertAccountOwner(owner,workspaceSession)}"));
 assert.ok(profile.includes("await assertMessageScope(scope)"));
 assert.ok(profile.includes("businessScope.current=scope"));
 assert.ok(profile.includes("businessOwner===workspace.data.card.id?business:EMPTY_BUSINESS_CARD"));
 assert.ok(editor.includes("captureMessageScope(originRef.current??undefined)"));
 assert.ok(editor.includes("await assertMessageScope(origin)"));
 assert.ok(editor.includes("originRef.current!==origin"));
 assert.ok(editor.includes("savingRef.current||!editorScope||loading||!activeRef.current"));
 assert.ok(editor.includes("await writeCloudBusiness(clean,editorOwner,origin)"));
 assert.ok(cloud.includes("if(expectedOwner&&expectedOwner!==owner)throw new Error"));
});
test("Business category is selected from a searchable catalog, never free-text",()=>{
 assert.ok(editor.includes("loadCatalog()"));
 assert.ok(editor.includes('key==="category"?<View'));
 assert.ok(editor.includes('accessibilityLabel="Seleccionar categoría empresarial"'));
 assert.ok(editor.includes('accessibilityLabel="Buscar categoría empresarial"'));
 assert.ok(editor.includes("visibleCategories.map(option=>"));
 assert.ok(editor.includes("option.code?option.label:\"\""));
 assert.ok(editor.includes('key==="category"?<View'));
});
test("Business title preserves word boundaries and fixes cramped service/contact rows",()=>{
 assert.equal(wrapBusinessCardName("Climas Sierra Norte",20,true),"Climas Sierra Norte");
 assert.equal(wrapBusinessCardName("Soluciones Aire Uno",14,true),"Soluciones\nAire Uno");
 assert.equal(wrapBusinessCardName("Industria de Refrigeración",8,true),"Industria de Refrigeración");
 assert.equal(wrapBusinessCardName("The kyng motorcycles"),"The kyng\nmotorcycles");
 assert.equal(wrapBusinessCardName("The Cooling Guy"),"The Cooling Guy");
 assert.ok(wrapBusinessCardName("Long multi word business title").split("\n").every(x=>x.length<=15));
 assert.ok(card.includes("wrapBusinessCardName(businessName)"));
 assert.ok(card.includes('flex:1,minHeight:0,justifyContent:"space-evenly"'));
 assert.ok(card.includes('height:64,flexShrink:0'));
});
