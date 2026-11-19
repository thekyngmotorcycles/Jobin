import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";

const editor=readFileSync("src/app/professional.tsx","utf8");
const workspace=readFileSync("src/state/useProfessionalData.ts","utf8");

test("Personal JCard accordion sections have working save actions",()=>{
 for(const section of ["identity","languages","privacy"]){
  assert.ok(editor.includes('saveSection("'+section+'")'),"Missing contextual save for "+section);
 }
 assert.ok(editor.includes('const saveSection=(target:SaveTarget)=>saveSections('));
 assert.ok(editor.includes("const pendingTargets:SaveTarget[]="),"The Save button must include hidden dirty sections");
 assert.ok(editor.includes('title={action.busy?"Guardando…":"Guardar cambios"}'));
 assert.ok(editor.includes("const saveSections=(targets:SaveTarget[])=>{"));
 assert.ok(editor.includes('professionalMutation("jobin_save_jcard"'));
 assert.ok(editor.includes("savePersonalContactDetails(personalContacts)"));
 assert.ok(editor.includes("saveContactPreferences({show_email:showEmail,show_phone:showPhone})"));
 assert.ok(editor.includes("saveJCardVisibility(visibility)"));
});

test("Header Save appears when editable personal data changes and saves all dirty sections",()=>{
 for(const name of ["identityDirty","languageDirty","privacyDirty","hasUnsavedChanges"])
  assert.ok(editor.includes(name));
 assert.ok(editor.includes('headerRight:hasUnsavedChanges?()'));
 assert.ok(editor.includes("onPress={()=>saveSections(pendingTargets)}"));
 assert.ok(editor.includes('accessibilityLabel="Guardar cambios de JCard"'));
 assert.ok(editor.includes("action.busy"),"Saving must not allow overlapping mutations");
 assert.ok(editor.includes("if(!ok)return"),"Failed saves must not clear pending changes");
 assert.ok(workspace.includes("setNotice(cause instanceof Error?cause.message:String(cause))"),"Errors remain visible");
});

test("Leaving the JCard with unsaved changes asks before discarding",()=>{
 assert.ok(editor.includes("usePreventRemove(hasUnsavedChanges||professionFormOpen"));
 assert.ok(editor.includes("Alert.alert(\"Cambios sin guardar\""));
 assert.ok(editor.includes('text:"Seguir editando"'));
 assert.ok(editor.includes('text:"Descartar"'));
 assert.ok(editor.includes("navigation.dispatch(data.action)"));
 assert.ok(editor.includes("Guard ar cambios")===false);
});
