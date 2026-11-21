import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";

const src=(file:string)=>readFileSync(file,"utf8");

test("Jobeen semantic typography preserves compact density across phone sizes",()=>{
 const type=src("src/theme/typography.ts");
 assert.ok(type.includes("modalTitle:17"));
 assert.ok(type.includes("sectionTitle:14"));
 assert.ok(type.includes("input:13"));
 assert.ok(type.includes("action:14"));
 assert.ok(type.includes("screenWidth<360?0.95:1"));
 const ui=src("src/components/ui.tsx");
 assert.ok(ui.includes("jobeenTypeWidthScale(width)"));
 assert.ok(ui.includes("JOBEEN_TYPE.body"));
 assert.ok(ui.includes("JOBEEN_TYPE.headline"));
 assert.ok(!ui.includes("MAX_SCALE = 1.1"),"Large screens should show more content, not larger text by default");
});
test("Premium Jobeen share sheet uses common type scale and compact accessible send button",()=>{
 const sheet=src("src/components/JCardShareSheet.tsx");
 assert.ok(sheet.includes("JOBEEN_TYPE.modalTitle"));
 assert.ok(sheet.includes("JOBEEN_TYPE.sectionTitle"));
 assert.ok(sheet.includes("JOBEEN_TYPE.input"));
 assert.ok(sheet.includes("JOBEEN_TYPE.action"));
 assert.ok(sheet.includes("minHeight:46,marginHorizontal:13"));
 assert.ok(sheet.includes("paddingBottom:18,gap:10"));
 assert.ok(sheet.includes("flex:1,fontSize:JOBEEN_TYPE.modalTitle,lineHeight:JOBEEN_LINE_HEIGHT.modalTitle"));
 assert.ok(sheet.includes("contentTitle??\"Compartir \"+cardType"));
 assert.ok(sheet.includes("if(result.sent.length)onShared?.()"));
 assert.ok(sheet.includes('name="checkmark" color={t.ink} size={18}'));
});
test("Shared bottom sheets reuse the same compact heading while retaining theme and gestures",()=>{
 const sheet=src("src/components/social-ui.tsx");
 assert.ok(sheet.includes("fontSize:JOBEEN_TYPE.modalTitle"));
 assert.ok(sheet.includes("const modal=jobeenModalTokens(theme)"));
 assert.ok(sheet.includes('borderTopLeftRadius:modal.radius.sheet,borderTopRightRadius:modal.radius.sheet'));
 assert.ok(sheet.includes('statusBarTranslucent={false}'));
});
