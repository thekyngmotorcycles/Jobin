import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {jcardSectionStyles,jcardSectionMetrics,personalJCardFaceMetrics,businessJCardFaceMetrics} from "../src/theme/jcard-structure.ts";

const source=(p:string)=>readFileSync(p,"utf8");
test("Both JCard faces use the shared header, content and footer rules",()=>{
 assert.deepEqual(jcardSectionStyles.header,{flexShrink:0});
 assert.deepEqual(jcardSectionStyles.content,{flex:1,minHeight:0});
 assert.deepEqual(jcardSectionStyles.footer,{flexShrink:0});
 const face=source("src/components/JobinCard.tsx");
 for(const role of ["header","content","footer"] as const)
  assert.equal(face.split("jcardSectionStyles."+role).length-1,2,role+" must be used on both faces");
});
test("Shared rules preserve approved measurements in both themes",()=>{
 assert.equal(jcardSectionMetrics.gridUnit,4);
 assert.deepEqual(personalJCardFaceMetrics("light",false),{padding:12,gap:5,footerHeight:76});
 assert.deepEqual(personalJCardFaceMetrics("light",true),{padding:12,gap:5,footerHeight:76});
 assert.deepEqual(personalJCardFaceMetrics("dark",false),{padding:14,gap:8,footerHeight:92});
 assert.deepEqual(personalJCardFaceMetrics("dark",true),{padding:14,gap:8,footerHeight:166});
 assert.deepEqual(businessJCardFaceMetrics("light"),{paddingHorizontal:10,paddingTop:14,paddingBottom:8,gap:1,footerHeight:64});
 assert.deepEqual(businessJCardFaceMetrics("dark"),{paddingHorizontal:14,paddingTop:16,paddingBottom:9,gap:5,footerHeight:64});
});
test("The outer card height and original visual elements are untouched",()=>{
 const face=source("src/components/JobinCard.tsx");
 const surface=source("src/theme/jcard.ts");
 assert.ok(surface.includes("lightHeight:330, darkHeight:400"));
 assert.ok(surface.includes("maxWidth:520, horizontalScreenInset:32, compactThreshold:350"));
 assert.ok(face.includes("jcardSurfaceSize({screenWidth:width,measuredWidth:measuredCardWidth,fontScale,theme:previewTheme??theme})"));
 assert.ok(face.includes('name="logo-whatsapp"'));
 assert.ok(!face.includes('label:"En el mercado"'));
 assert.ok(face.includes("jcardSectionStyles.content"));
 assert.ok(face.includes("jcardSectionStyles.footer"));
});
