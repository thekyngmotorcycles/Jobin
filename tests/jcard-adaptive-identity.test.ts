import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
import {fitJCardProfileName,jcardProfileNameLimits,estimateJCardNameWidth,JCARD_NAME_BADGE_WIDTH,JCARD_NAME_BADGE_GAP} from "../src/lib/jcard-profile-name.ts";
import {jcardProfilePortraitMetrics,jcardProfileIdentitySpace} from "../src/theme/jcard.ts";
const source=(p:string)=>readFileSync(p,"utf8");
test("Short names keep full size; long names fit at most two bounded lines",()=>{
 for(const width of [250,288,328,382,520]){
  const portrait=jcardProfilePortraitMetrics(width),space=jcardProfileIdentitySpace(portrait,1),limits=jcardProfileNameLimits(width);
  const short=fitJCardProfileName("Luis J Salas",space.width,width,1);
  assert.equal(short.lines.length,1);assert.equal(short.fontSize,limits.max);
  for(const scale of [1,1.3,2])for(const name of ["Shoes Store","Maximiliano Acosta Beltran","Alejandro Martín Rodríguez Pérez Fernández de la Cruz","W".repeat(80),"李".repeat(50)]){
   const s=jcardProfileIdentitySpace(portrait,scale),fit=fitJCardProfileName(name,s.width,width,scale);
   assert.ok(fit.lines.length<=2&&fit.lines.length>=1);
   assert.ok(fit.fontSize>=limits.min&&fit.fontSize<=limits.max);
   assert.ok(fit.lines.every((line,index)=>estimateJCardNameWidth(line,fit.fontSize,scale)<=s.width-(index===fit.lines.length-1?JCARD_NAME_BADGE_WIDTH+JCARD_NAME_BADGE_GAP:0)+1e-6));
   if(fit.truncated)assert.ok(fit.lines.at(-1)?.endsWith("…"));
  }
 }
 const p=jcardProfilePortraitMetrics(288),s=jcardProfileIdentitySpace(p,1);
 assert.equal(fitJCardProfileName("Maximiliano Acosta Beltran",s.width,288,1).lines.length,2);
 assert.equal(fitJCardProfileName("W".repeat(80),s.width,288,1).truncated,true);
});
test("Shared header keeps fixed subtitle and final badge; full identity opens dialog",()=>{
 const card=source("src/components/JobinCard.tsx"),header=source("src/components/JCardProfileIdentity.tsx");
 assert.ok(card.includes('<JCardProfileIdentity portrait={profilePortrait} side="personal"'));
 assert.ok(card.includes('<JCardProfileIdentity portrait={profilePortrait} side="business"'));
 assert.ok(!card.includes("compactNameFont")&&!card.includes("displayedProfileName"));
 assert.ok(header.includes('height:space.nameHeight,justifyContent:"flex-end"'));
 assert.ok(header.includes('height:space.subtitleHeight,flexDirection:"row"'));
 assert.ok(header.includes('numberOfLines={1} ellipsizeMode="tail"'));
 assert.ok(header.includes("minimumFontScale={fit.min/fit.fontSize}"));
 assert.ok(header.includes("{last&&<View")&&header.includes("{badge}"));
 assert.ok(header.includes("description={name+")&&header.includes("event.stopPropagation()"));
});
