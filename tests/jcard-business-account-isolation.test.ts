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
 assert.ok(cache.includes('"jobeen.business.card.v2."+owner'));
 assert.ok(cache.includes("businessCardCacheKey(owner)"));
 assert.ok(!profile.includes('AsyncStorage.getItem("jobin.business.card.v1")'));
 assert.ok(!profile.includes('AsyncStorage.setItem("jobin.business.card.v1")'));
 assert.ok(!editor.includes('AsyncStorage.getItem("jobin.business.card.v1")'));
 assert.ok(!editor.includes('AsyncStorage.setItem("jobin.business.card.v1")'));
 assert.ok(profile.includes("readScopedBusinessCard(owner)"));
 assert.ok(profile.includes("writeScopedBusinessCard(owner,current)"));
 assert.ok(editor.includes("writeScopedBusinessCard(editorOwner,clean)"));
 assert.ok(!avatar.includes('AsyncStorage.getItem("jobin.business.card.v1")'));
 assert.ok(!avatar.includes('AsyncStorage.setItem("jobin.business.card.v1")'));
 assert.ok(avatar.includes("await writeCloudBusiness(updated,owner)"));
 assert.ok(avatar.includes("await writeScopedBusinessCard(owner,updated)"));
});
test("Missing business cloud records cannot trigger uploads from previous accounts",()=>{
 assert.ok(!profile.includes("await writeCloudBusiness(local)"));
 assert.ok(profile.includes("const current={...EMPTY_BUSINESS_CARD,...(row??{})}"));
 assert.ok(profile.includes("(await cloudOwner())!==owner"));
 assert.ok(profile.includes("businessOwner===workspace.data.card.id?business:EMPTY_BUSINESS_CARD"));
 assert.ok(editor.includes("if(!editorOwner||(await appearanceOwner())!==editorOwner)"));
 assert.ok(editor.includes("await writeCloudBusiness(clean,editorOwner)"));
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
 assert.equal(wrapBusinessCardName("The kyng motorcycles"),"The kyng\nmotorcycles");
 assert.equal(wrapBusinessCardName("The Cooling Guy"),"The Cooling Guy");
 assert.ok(wrapBusinessCardName("Long multi word business title").split("\n").every(x=>x.length<=15));
 assert.ok(card.includes("wrapBusinessCardName(businessName)"));
 assert.ok(card.includes('paddingTop:5,paddingBottom:2'));
 assert.ok(card.includes('marginTop:"auto"'));
});
