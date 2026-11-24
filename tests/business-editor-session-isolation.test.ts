import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=(path:string)=>readFileSync(path,"utf8");

test("Business editor must load card and privacy under the same origin before showing editing controls",()=>{
 const editor=read("src/app/jcard-business-edit.tsx");
 assert.ok(editor.includes("captureMessageScope(originRef.current??undefined)"));
 assert.ok(editor.includes("Promise.all([readCloudBusiness(scope.owner,scope),readJCardVisibility(scope.owner,scope)])"));
 assert.ok(editor.includes("setVisibility(settings);setEditorScope(scope)"));
 assert.ok(editor.includes("!editorScope?<Button title=\"Reintentar\""));
 assert.ok(editor.includes("savingRef.current||!editorScope||loading||!activeRef.current"));
 assert.ok(!editor.includes("readScopedBusinessCard("));
 assert.ok(!editor.includes("writeScopedBusinessCard("));
});
test("Business editor keeps originating session across handle checks, fresh reads and writes",()=>{
 const editor=read("src/app/jcard-business-edit.tsx");
 for(const call of ["checkBusinessHandleAvailable(businessHandle,origin)","readCloudBusiness(editorOwner,origin)","writeCloudBusiness(clean,editorOwner,origin)","saveJCardVisibility(visibility,editorOwner,origin)"])assert.ok(editor.includes(call),call);
 assert.ok(editor.includes("await assertMessageScope(origin)"));
 assert.ok(editor.includes("originRef.current!==origin"));
 assert.ok(editor.includes("setEditorScope(null);setData(empty)"));
 const api=read("src/lib/jcard-cloud.ts");
 for(const name of ["readCloudBusiness","writeCloudBusiness","checkBusinessHandleAvailable"]){
  const section=api.split("export async function "+name)[1].split("export async function")[0];
  assert.ok(section.includes("captureMessageScope(expectedScope)"),name);
  assert.ok(section.includes("await assertMessageScope(scope)"),name);
 }
});

test("Business editor visibility notice cannot disable the last active JCard",()=>{
 const editor=read("src/app/jcard-business-edit.tsx");
 assert.ok(editor.includes('if(item.key==="business_enabled"&&visibility.business_enabled&&!visibility.personal_enabled){setVisibilityWarning(true);return;}'));
 assert.ok(editor.includes("visible={!!editorScope&&visibilityWarning}"));
 assert.ok(editor.includes("await saveJCardVisibility(visibility,editorOwner,origin)"));
 assert.ok(editor.includes('busy={saving} busyLabel="Guardando…"'));
});
