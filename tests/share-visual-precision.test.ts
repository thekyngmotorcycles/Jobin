import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {JOBEEN_TYPE,JOBEEN_LINE_HEIGHT} from "../src/theme/typography.ts";
import {JOBEEN_CONTROL,royalHiveLayout} from "../src/theme/control-metrics.ts";
const src=(p:string)=>readFileSync(p,"utf8");
test("Royal Hive share sheet uses one semantic scale and accessible growable controls",()=>{
 const sheet=src("src/components/JCardShareSheet.tsx");
 assert.equal(JOBEEN_TYPE.modalSectionTitle,17);
 assert.equal(JOBEEN_TYPE.modalRecipient,14);
 assert.equal(JOBEEN_TYPE.modalAction,15);
 assert.equal(JOBEEN_LINE_HEIGHT.modalRecipient,18);
 assert.equal(JOBEEN_CONTROL.inputHeight,48);
 assert.equal(JOBEEN_CONTROL.visualAction,48);
 for(const width of [280,320,360,390,430,480])for(const fontScale of [1,1.3,2]){
  const l=royalHiveLayout(width,fontScale);
  assert.ok(l.actionSize>=48&&l.actionSize<=60);
  assert.ok(l.recipientCell>=l.avatarSize+12);
  assert.ok(l.methodCell>=48);
  assert.equal(l.methodsNeedScroll,l.methodsWidth>l.available);
 }
 assert.ok(sheet.includes("royalHiveLayout("));
 assert.ok(sheet.includes("scrollEnabled={layout.methodsNeedScroll}"));
 assert.ok(sheet.includes("width:methodCell,minHeight:JOBEEN_CONTROL.touchTarget"));
 assert.ok(sheet.includes("size={JOBEEN_CONTROL.shareIcon}"));
 assert.ok(sheet.includes("size={avatarSize} framed={false}"));
 assert.ok(sheet.includes("numberOfLines={fontScale<=1?2:undefined}"));
 assert.ok(sheet.includes("minHeight:JOBEEN_CONTROL.visualAction"));
 assert.ok(sheet.includes("width:23,height:23"));
 assert.ok(sheet.includes("style={{flexShrink:1}}"));
 assert.ok(sheet.includes("KeyboardAvoidingView"));
 assert.ok(sheet.includes("onPress={()=>void sendSelected()}"));
 assert.ok(sheet.includes("await sendToShareRecipients(selected,message,scope)"));
 assert.ok(sheet.includes("await assertMessageScope(scope)"));
});
