import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const read=(file:string)=>readFileSync(file,"utf8");

test("Home publication menu preserves behavior with shared compact action rows",()=>{
 const s=read("src/components/FeedPostOptions.tsx");
 assert.ok(s.includes('<BottomSheet visible={visible} onClose={close} title="Opciones de publicación">'));
 assert.equal((s.match(/<SettingsMenuRow variant="action"/g)??[]).length,4);
 assert.ok(s.includes('await setSavedPost(viewerId,postId,!saved,scope)'));
 assert.ok(s.includes('await hidePostFromHome(viewerId,postId,scope)'));
 assert.ok(s.includes('await onShareLink()'));
 assert.ok(s.includes("getSavedPostIds(viewerId,scope)"));
 for(const label of ["Guardar publicación","Compartir enlace","Ocultar publicación","¿Por qué veo esta publicación?"]){
  assert.ok(s.includes(label),"Missing option: "+label);
 }
 assert.ok(!s.includes("Alert.alert("),"Use Jobeen menu typography rather than native alerts");
});
test("Help and failure messages are readable within the approved publication sheet",()=>{
 const s=read("src/components/FeedPostOptions.tsx");
 assert.ok(s.includes("setWhyExpanded(v=>!v)"),"Explain feed visibility without an extra native dialog");
 assert.ok(s.includes("Home muestra publicaciones públicas relacionadas"));
 assert.ok(s.includes("jobeenModalTokens(theme)"),"Keep approved premium warm palette");
 assert.ok(s.includes("JOBEEN_TYPE.secondary"),"Use existing type system");
 assert.ok(s.includes("accessibilityLiveRegion=\"polite\""),"Announce errors inside the sheet");
 assert.ok(s.includes("const close=()=>{if(!busyRef.current)"),"Do not dismiss an in-flight action");
 assert.ok(s.includes("disabled={busy||!ready}"),"Actions stay disabled until the session is verified and while processing");
 assert.ok(s.includes("if(!scope||busyRef.current)return;"),"Synchronous guard prevents duplicate actions");
});
