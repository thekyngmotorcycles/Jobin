import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
import {createHash} from "node:crypto";
import {JOBIN_BRAND_NAME,JOBIN_BRAND_GOLD,JOBIN_BRAND_INK,JOBIN_WORDMARK_VIEWBOX,JOBIN_WORDMARK_ASPECT,JOBIN_WORDMARK_INK,JOBIN_WORDMARK_GOLD,JOBIN_ICON_INK,JOBIN_ICON_GOLD} from "../src/theme/brand-art.ts";
test("approved original brand masters are immutable and the theme vectors share their contours",()=>{
 const hash=(path:string)=>createHash("sha256").update(readFileSync(path)).digest("hex");
 assert.equal(hash("assets/brand/logo-original.webp"),"7b8d6a5fb201f825f890bab7cba3925249e8614ce18cf5f877e1fc15e59f171a");
 assert.equal(hash("assets/brand/icono-original.webp"),"349b0319ef4dce96b2a800fcc4e4f1f935462d4f4cf89f28d181743814ac4762");
 assert.equal(JOBIN_BRAND_NAME,"Jobin");
 assert.deepEqual(JOBIN_BRAND_INK,{light:"#000000",dark:"#FFFFFF"});
 for(const [name,ink,gold] of [["logo",JOBIN_WORDMARK_INK,JOBIN_WORDMARK_GOLD],["icono",JOBIN_ICON_INK,JOBIN_ICON_GOLD]]){
  for(const theme of ["oscuro","claro"]){
   const svg=readFileSync("assets/brand/"+name+"-"+theme+".svg","utf8");
   assert.ok(svg.includes('d="'+ink+'"'));
   assert.ok(svg.includes('d="'+gold+'"'));
   assert.ok(svg.includes('fill="'+JOBIN_BRAND_GOLD+'"'));
   assert.ok(!svg.includes("<text"));
  }
 }
 const wordmark=readFileSync("src/components/JobinWordmark.tsx","utf8");
 assert.ok(wordmark.includes('preserveAspectRatio="xMidYMid meet"'));
 assert.ok(!wordmark.includes('fontFamily:"cursive"'));
 const icon=readFileSync("src/components/JobinBrandIcon.tsx","utf8");
 for(const component of [wordmark,icon]){
  assert.ok(component.includes("fill={JOBIN_BRAND_INK[theme]}"));
  assert.ok(component.includes("fill={JOBIN_BRAND_GOLD}"));
 }
});

 test("wordmark contains only the approved lettering; hexagon stays in the app icon",()=>{
 assert.equal(JOBIN_WORDMARK_GOLD.split(/(?=M)/).filter(Boolean).length,2);
 assert.ok(!JOBIN_WORDMARK_GOLD.includes("M760,12 "));
 assert.equal(JOBIN_ICON_GOLD.split(/(?=M)/).filter(Boolean).length,1);
 assert.equal(JOBIN_WORDMARK_VIEWBOX,"0 58 934 370");
 assert.equal(JOBIN_WORDMARK_ASPECT,934/370);
 for(const variant of ["oscuro","claro"]){
  const svg=readFileSync("assets/brand/logo-"+variant+".svg","utf8");
  assert.ok(svg.includes('viewBox="'+JOBIN_WORDMARK_VIEWBOX+'"'));
  assert.ok(!svg.includes("M760,12 "));
 }
});
