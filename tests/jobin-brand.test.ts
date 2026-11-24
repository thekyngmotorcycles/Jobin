import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
import {createHash} from "node:crypto";
import {JOBIN_BRAND_NAME,JOBIN_BRAND_GOLD,JOBIN_WORDMARK_INK,JOBIN_WORDMARK_GOLD,JOBIN_ICON_INK,JOBIN_ICON_GOLD} from "../src/theme/brand-art.ts";
test("approved original brand masters are immutable and the theme vectors share their contours",()=>{
 const hash=(path:string)=>createHash("sha256").update(readFileSync(path)).digest("hex");
 assert.equal(hash("assets/brand/logo-original.webp"),"7b8d6a5fb201f825f890bab7cba3925249e8614ce18cf5f877e1fc15e59f171a");
 assert.equal(hash("assets/brand/icono-original.webp"),"349b0319ef4dce96b2a800fcc4e4f1f935462d4f4cf89f28d181743814ac4762");
 assert.equal(JOBIN_BRAND_NAME,"Jobin");
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
});
