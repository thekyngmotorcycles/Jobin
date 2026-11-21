import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const src=(p:string)=>readFileSync(p,"utf8");

test("Share, composer, notices and message privacy share the same touch metrics",()=>{
 const controls=src("src/theme/control-metrics.ts");
 assert.ok(controls.includes("touchTarget:48"));
 assert.ok(controls.includes("visualAction:40"));
 assert.ok(controls.includes("inputHeight:42"));
 for(const p of [
  "src/components/JCardShareSheet.tsx",
  "src/components/PostComposerSheets.tsx",
  "src/components/JobeenNoticeDialog.tsx",
  "src/app/message-requests.tsx",
  "src/components/ProfileCommunityActions.tsx",
 ]){
  assert.ok(src(p).includes("JOBEEN_CONTROL"),p);
 }
});
test("Message privacy uses common sheet radius, colors, handle and scrollable safe area",()=>{
 const s=src("src/app/message-requests.tsx");
 assert.ok(s.includes("jobeenModalTokens(theme)"));
 assert.ok(s.includes("backgroundColor:modal.scrim"));
 assert.ok(s.includes("borderTopLeftRadius:modal.radius.sheet,borderTopRightRadius:modal.radius.sheet"));
 assert.ok(s.includes("backgroundColor:modal.surface"));
 assert.ok(s.includes("backgroundColor:modal.handle"));
 assert.ok(s.includes("style={{flexShrink:1}}"));
 assert.ok(s.includes("paddingBottom:Math.max(insets.bottom,18)"));
 assert.ok(s.includes("fontSize:JOBEEN_TYPE.modalTitle"));
 assert.ok(s.includes("saveMessagePrivacy(next)"),"Do not change privacy persistence");
});
test("Confirmation dialogs stay open while an action is processing",()=>{
 const s=src("src/components/JobeenNoticeDialog.tsx");
 assert.ok(s.includes("onRequestClose={()=>{if(!busy)onCancel();}}"),"Android Back must not dismiss an in-progress confirmation");
 assert.ok(s.includes('accessibilityLabel="Cerrar aviso" disabled={busy} onPress={onCancel}'),"Backdrop tap must not dismiss while busy");
 assert.ok(s.includes("minHeight:JOBEEN_CONTROL.touchTarget"),"Both choices preserve accessible controls");
});
test("Message requests controls have uniform accessible 48dp targets",()=>{
 const s=src("src/app/message-requests.tsx");
 assert.ok(s.includes('width:JOBEEN_CONTROL.touchTarget,height:JOBEEN_CONTROL.touchTarget'),"Privacy settings trigger has a full touch target");
 assert.ok(s.includes('flex:1,minHeight:JOBEEN_CONTROL.touchTarget,flexDirection:"row"'),"Request tabs share the same minimum height");
 assert.equal((s.match(/flex:1,minHeight:JOBEEN_CONTROL.touchTarget,borderRadius:14/g)??[]).length,2,"Accept and delete controls match");
});
test("Destructive public profile action receives only semantic red emphasis",()=>{
 const s=src("src/components/ProfileCommunityActions.tsx");
 assert.ok(s.includes('const danger=jobeenModalTokens(theme,"danger")'));
 assert.ok(s.includes('name="ban-outline" size={20} color={danger.icon}'));
 assert.ok(s.includes("minHeight:JOBEEN_CONTROL.touchTarget"));
 assert.ok(s.includes("Bloquear perfil"));
 assert.ok(s.includes("Denunciar perfil"));
});
test("Composer keeps draft and media preview behavior while using compact action heights",()=>{
 const s=src("src/components/PostComposerSheets.tsx");
 assert.ok(s.includes("height:JOBEEN_CONTROL.visualAction+2"));
 assert.ok(s.includes("minHeight:JOBEEN_CONTROL.touchTarget"));
 assert.ok(s.includes("minHeight:92"));
 assert.ok(s.includes("onRestore(draft)"));
 assert.ok(s.includes("p.onClosePreview"));
});
