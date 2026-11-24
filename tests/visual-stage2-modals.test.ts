import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const src=(p:string)=>readFileSync(p,"utf8");

test("Share, composer, notices and message privacy share the same touch metrics",()=>{
 const controls=src("src/theme/control-metrics.ts");
 assert.ok(controls.includes("touchTarget:48"));
 assert.ok(controls.includes("visualAction:48"));
 assert.ok(controls.includes("inputHeight:48"));
 for(const p of [
  "src/components/JCardShareSheet.tsx",
  "src/components/PostComposerSheets.tsx",
  "src/components/JobeenNoticeDialog.tsx",
  "src/app/message-requests.tsx",
  "src/components/SettingsMenuRow.tsx",
 ]){

  assert.ok(src(p).includes("JOBEEN_CONTROL"),p);
 }
 assert.ok(src("src/components/ProfileCommunityActions.tsx").includes("<SettingsMenuRow"),"Visitor menu inherits the shared control targets");
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
 assert.ok(s.includes("await saveMessagePrivacy(next,scope)"),"Preserve privacy persistence with original session");
 assert.ok(s.includes("if(scopeRef.current===scope)setPrivacy(next)"),"Do not render settings from a superseded session");
});
test("Confirmation dialogs stay open while an action is processing",()=>{
 const s=src("src/components/JobeenNoticeDialog.tsx");
 assert.ok(s.includes("onRequestClose={()=>{if(!busy)onCancel();}}"),"Android Back must not dismiss an in-progress confirmation");
 assert.ok(s.includes('accessibilityLabel="Cerrar aviso" disabled={busy} onPress={onCancel}'),"Backdrop tap must not dismiss while busy");
 assert.ok(s.includes("minHeight:JOBEEN_CONTROL.touchTarget"),"Both choices preserve accessible controls");
});
test("Privacy settings cannot close during an in-flight save",()=>{
 const s=src("src/app/message-requests.tsx");
 assert.ok(s.includes('function closePrivacy(){if(!saving)setSettingsOpen(false);}'));
 assert.ok(s.includes('onRequestClose={closePrivacy}'));
 assert.equal((s.match(/onPress=\{closePrivacy\}/g)??[]).length,2,"Both backdrop and close icon respect the save state");
 assert.ok(s.includes("!!privacyError"),"Save failures are visible inside the sheet");
});
test("Message requests controls have uniform accessible 48dp targets",()=>{
 const s=src("src/app/message-requests.tsx");
 assert.ok(s.includes('width:JOBEEN_CONTROL.touchTarget,height:JOBEEN_CONTROL.touchTarget'),"Privacy settings trigger has a full touch target");
 assert.ok(s.includes('flex:1,minHeight:JOBEEN_CONTROL.touchTarget,flexDirection:"row"'),"Request tabs share the same minimum height");
 assert.equal((s.match(/flex:1,minHeight:JOBEEN_CONTROL.touchTarget,borderRadius:14/g)??[]).length,2,"Accept and delete controls match");
});
test("Destructive public profile action uses the shared premium menu row with restrained emphasis",()=>{
 const s=src("src/components/ProfileCommunityActions.tsx");
 const row=src("src/components/SettingsMenuRow.tsx");
 assert.ok(s.includes('<SettingsMenuRow variant="action" tone="danger" title="Bloquear perfil"'));
 assert.ok(s.includes('icon="ban-outline" onPress={block}'));
 assert.ok(s.includes("Denunciar perfil"));
 assert.ok(row.includes('const danger=jobeenModalTokens(theme,"danger")'));
 assert.ok(row.includes('minHeight:JOBEEN_CONTROL.touchTarget'));
 assert.ok(row.includes('variant==="navigation"&&<Ionicons name="chevron-forward"'),"Contextual actions omit navigation chevrons");
});
test("Composer keeps draft and media preview behavior while using compact action heights",()=>{
 const s=src("src/components/PostComposerSheets.tsx");
 assert.ok(s.includes("minHeight:JOBEEN_CONTROL.visualAction"));
 assert.ok(s.includes("minHeight:JOBEEN_CONTROL.touchTarget"));
 assert.ok(s.includes("p.drafts.length?<ScrollView"),"Draft lists remain scrollable when populated");
 assert.ok(s.includes("paddingHorizontal:18,paddingTop:6,paddingBottom:20"),"Empty dialog hugs a single message");
 assert.ok(s.includes('fontSize:JOBEEN_TYPE.body,lineHeight:21}}>Aún no tienes borradores guardados.'),"Empty-state message uses shared typography");
 assert.ok(!s.includes("0 de {MAX_POST_DRAFTS} borradores"),"Empty state should not repeat a counter");
 assert.ok(!s.includes('name="albums-outline"'),"Empty state should not consume extra height with a decorative icon");
 assert.ok(!s.includes("minHeight:92"),"Do not reserve an oversized empty panel");
 assert.ok(s.includes('width:"48%"'),"Draft grid retains two columns at any phone width");
 assert.ok(s.includes("paddingHorizontal:JOBEEN_CONTROL.modalHorizontalPadding"),"Draft list uses the shared modal padding");
 assert.ok(s.includes("borderRadius:modal.radius.control"),"Draft cards use consistent control rounding");
 assert.ok(s.includes("fontSize:JOBEEN_TYPE.caption"),"Draft metadata uses semantic caption typography");
 assert.ok(s.includes("onRestore(draft)"));
 assert.ok(s.includes("p.onClosePreview"));
});

test("Shared buttons and compact action windows retain semantic states and account-bound destructive actions",()=>{
 const ui=src("src/components/ui.tsx");
 const notice=src("src/components/JobeenNoticeDialog.tsx");
 const chat=src("src/app/message.tsx");
 const contacts=src("src/components/ProfileFollowCounts.tsx");
 const shop=src("src/app/jshop/settings.tsx");
 const row=src("src/components/SettingsMenuRow.tsx");
 assert.ok(ui.includes('JobeenButtonVariant="primary"|"secondary"|"tertiary"|"danger"'));
 assert.ok(ui.includes("const locked=disabled||busy"));
 assert.ok(ui.includes("accessibilityState={{selected,disabled:locked,busy}}"));
 assert.ok(ui.includes("minHeight: JOBEEN_CONTROL.touchTarget"));
 assert.ok(notice.includes('variant="secondary" disabled={busy}'));
 assert.ok(notice.includes('variant={destructive?"danger":"primary"} busy={busy}'));
 assert.ok(!chat.includes("Gestiona esta conversación profesional."));
 assert.ok(chat.includes('description={blockError||"No podrá enviarte más mensajes."}'));
 assert.ok(!contacts.includes("Alert.alert("));
 assert.ok(contacts.includes('visible={sheet&&!pendingRemove}'));
 assert.ok(contacts.includes('visible={sheet&&pendingRemove!==null}'));
 assert.ok(contacts.includes("contactAction(person,undefined,scope)"));
 assert.ok(contacts.includes("await captureMessageScope(scope)"));
 assert.ok(contacts.includes("contactMutation.current===operation"));
 assert.ok(contacts.includes("await removeContactRequest(person.requestId,scope)"));
 assert.ok(shop.includes("<SettingsMenuRow"));
 assert.ok(row.includes("!!value"));
 assert.ok(!shop.includes("Publicados, borradores, pausados y vendidos"));
 assert.ok(shop.includes("if(!saving)setCurrencyOpen(false)"));
 assert.ok(shop.includes("Se aplicará a los nuevos anuncios."));
 assert.ok(shop.includes("await writeSellerCurrency(owner,next,scope)"));
});
