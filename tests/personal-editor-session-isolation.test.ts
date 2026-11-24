import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=(path:string)=>readFileSync(path,"utf8");
test("The personal editor refuses to save until real privacy and contact values were loaded",()=>{
 const editor=read("src/app/professional.tsx");
 assert.ok(editor.includes("editorScope&&settingsReady&&workspace.data?.card.id===editorScope.owner"));
 assert.ok(editor.includes("loadPersonalContactDetails(scope.owner,scope)"));
 assert.ok(editor.includes("loadContactPreferences(scope)"));
 assert.ok(editor.includes("readJCardVisibility(scope.owner,scope)"));
 assert.ok(editor.includes("setEditorScope(scope);setSettingsReady(true)"));
 assert.ok(editor.includes("setSettingsReady(false);setEditorError("));
 assert.ok(editor.includes("!editorScope||!settingsReady)return"));
});
test("Multi-step professional and contact updates retain the original editor scope",()=>{
 const editor=read("src/app/professional.tsx");
 for(const call of ["loadWorkspace(origin)","savePersonalContactDetails(personalContacts,owner,origin)","saveContactPreferences({show_email:showEmail,show_phone:showPhone},owner,origin)","saveJCardVisibility(visibility,owner,origin)","saveProfessionSpecialties(profession,specialties,origin)","replacePrimaryProfession(editingProfession,profession,training,institution,origin)","replaceSecondaryProfession(editingProfession,profession,training,institution,origin)"])assert.ok(editor.includes(call),call);
 assert.ok(editor.includes('professionalMutation("jobin_remove_unverified_profession",{profession:code},origin)'));
 assert.ok(editor.includes("editorScopeRef.current!==origin"));
 const contact=read("src/lib/jcard-contact.ts"),visibility=read("src/lib/jcard-visibility.ts");
 assert.ok(contact.includes("captureMessageScope(expectedScope)"));
 assert.ok(contact.includes("await assertMessageScope(scope)"));
 assert.ok(visibility.includes("captureMessageScope(expectedScope)"));
});

test("Profession removal confirmation retains the captured editor and unverified target",()=>{
 const editor=read("src/app/professional.tsx");
 assert.ok(editor.includes("setRemoveRequest({code,primary,origin})"));
 assert.ok(editor.includes("editorScopeRef.current!==origin||editorScope!==origin"));
 assert.ok(editor.includes("p.profession_code===code&&!p.verified"));
 assert.ok(editor.includes("await verifyEditor(origin)"));
 assert.ok(editor.includes("current=>current===request?null:current"));
 assert.ok(editor.includes("visible={!!w&&!!removeRequest&&!unsavedDialogOpen}"));
 assert.ok(editor.includes("busy={action.busy}"));
});
