import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const src=(p:string)=>readFileSync(p,"utf8");
test("Premium sharing follows approved screenshot density without shrinking the touch target",()=>{
 const sheet=src("src/components/JCardShareSheet.tsx");
 const scale=src("src/theme/typography.ts");
 assert.ok(scale.includes("modalSectionTitle:13"));
 assert.ok(scale.includes("modalRecipient:11"));
 assert.ok(scale.includes("modalAction:13"));
 assert.ok(sheet.includes("fontSize:sectionSize"));
 assert.ok(sheet.includes("fontSize:recipientSize"));
 assert.ok(sheet.includes("fontSize:JOBEEN_TYPE.modalAction"));
 assert.ok(sheet.includes("height:JOBEEN_CONTROL.visualAction,width:\"100%\""),"Visible send button is compact");
 assert.ok(sheet.includes("minHeight:JOBEEN_CONTROL.touchTarget,marginHorizontal:13"),"Touch target remains accessible");
 assert.ok(sheet.includes("const compact=width<360"),"Jelly devices use the fallback size");
 assert.ok(sheet.includes("const headerSize=compact?JOBEEN_TYPE.modalTitle:20"),"Standard phones use the main visual scale");
 assert.ok(sheet.includes("const sectionSize=compact?JOBEEN_TYPE.modalSectionTitle:15"));
 assert.ok(sheet.includes("const recipientSize=compact?JOBEEN_TYPE.modalRecipient:12"));
 assert.ok(sheet.includes("actionSize=Math.max(44,Math.min(compact?48:62"),"Primary mobile width supports 62dp option circles");
 assert.ok(sheet.includes("width:62,height:62"));
 assert.ok(sheet.includes('size={52} framed={false}'));
 assert.ok(sheet.includes("width:23,height:23"));
 assert.ok(sheet.includes("style={{flexShrink:1}}"),"External share options must remain scrollable");
 assert.ok(sheet.includes("onPress={()=>void sendSelected()}"));
 assert.ok(sheet.includes("await sendToShareRecipients(selected,message)"));
});
