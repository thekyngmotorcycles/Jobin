import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
import {fitJCardProfileName,jcardProfileNameLimits,estimateJCardNameWidth,JCARD_NAME_BADGE_WIDTH,JCARD_NAME_BADGE_GAP,JCARD_PROFILE_NAME_MAX} from "../src/lib/jcard-profile-name.ts";
import {jcardProfilePortraitMetrics,jcardProfileIdentitySpace} from "../src/theme/jcard.ts";
const source=(p:string)=>readFileSync(p,"utf8");
test("Names use one line, maximum 20 visible characters and bounded Instagram-like type",()=>{
 for(const width of [250,288,328,382,520]){
  const portrait=jcardProfilePortraitMetrics(width),space=jcardProfileIdentitySpace(portrait,1),limits=jcardProfileNameLimits(width);
  const short=fitJCardProfileName("Luis J Salas",space.width,width,1);
  assert.equal(short.lines.length,1);assert.equal(short.fontSize,limits.max);
  for(const scale of [1,1.3,2])for(const name of ["Shoes Store","Maximiliano Acosta Beltran","abcdefghijklmnopqrst","W".repeat(80),"李".repeat(50)]){
   const s=jcardProfileIdentitySpace(portrait,scale),fit=fitJCardProfileName(name,s.width,width,scale);
   assert.equal(fit.lines.length,1);assert.ok(Array.from(fit.lines[0]).length<=JCARD_PROFILE_NAME_MAX);
   assert.ok(fit.fontSize>=limits.min&&fit.fontSize<=limits.max);
   assert.ok(estimateJCardNameWidth(fit.lines[0],fit.fontSize,scale)<=s.width-JCARD_NAME_BADGE_WIDTH-JCARD_NAME_BADGE_GAP+1e-6);
   if(fit.truncated)assert.ok(fit.lines[0].endsWith("…"));
   if(Array.from(name).length>=20)assert.ok(fit.fontSize<limits.max);
  }
 }
 const p=jcardProfilePortraitMetrics(288),s=jcardProfileIdentitySpace(p,1);
 assert.equal(fitJCardProfileName("Maximiliano Acosta Beltran",s.width,288,1).truncated,true);
});
test("Shared static header keeps fixed subtitle and inline badge without identity modal",()=>{
 const card=source("src/components/JobinCard.tsx"),header=source("src/components/JCardProfileIdentity.tsx");
 assert.ok(card.includes('<JCardProfileIdentity portrait={profilePortrait} side="personal"'));
 assert.ok(card.includes('<JCardProfileIdentity portrait={profilePortrait} side="business"'));
 assert.ok(header.includes("height:space.nameHeight")&&header.includes("height:space.subtitleHeight"));
 assert.ok(header.includes('numberOfLines={1} ellipsizeMode="tail"'));
 assert.ok(header.includes("minimumFontScale={fit.min/fit.fontSize}"));
 assert.ok(header.includes("{fit.lines[0]}")&&header.includes("{badge}"));
 assert.ok(!/Pressable|onPress|JobeenNoticeDialog|Modal/.test(header));
 assert.ok(header.includes("accessibilityLabel={name+"));
});
test("Standard private footprint is content independent with compact contacts and equal pills",()=>{
 const card=source("src/components/JobinCard.tsx");
 assert.ok(card.includes("const cardHeight=surface.height;"));
 assert.ok(!/measurePersonal|measureBusiness|personalHeight|businessHeight/.test(card));
 assert.ok(card.includes("profilePhones.map")&&card.includes('flexDirection:"row",columnGap:6'));
 assert.ok(card.includes("profilePillTouch")&&card.includes("...profilePill,backgroundColor:jobeen.cream")&&card.includes("...profilePill,flexDirection:"));
 assert.ok((card.match(/<ScrollView nestedScrollEnabled style=\{\{flex:1,minHeight:0\}\}/g)??[]).length>=2);
});


test("Equal fixed pill widths cannot be redistributed by label length; business column clears logo",async()=>{
 const {jcardProfilePillWidth,jcardProfileIdentitySpace,jcardProfilePortraitMetrics,JCARD_BUSINESS_COLUMN_INSET}=await import("../src/theme/jcard.ts");
 for(const width of [250,288,328,382,520]){
  const pill=jcardProfilePillWidth(width);
  assert.ok(2*pill+8<=width-26);
  assert.ok(pill>=108);
  const portrait=jcardProfilePortraitMetrics(width),business=jcardProfileIdentitySpace(portrait,1,"business");
  assert.equal(business.paddingLeft,JCARD_BUSINESS_COLUMN_INSET);
  assert.ok(business.paddingRight>portrait.inset+portrait.width);
 }
 const card=source("src/components/JobinCard.tsx"),header=source("src/components/JCardProfileIdentity.tsx");
 const pill=card.slice(card.indexOf("const profilePillTouch="),card.indexOf("  </View>:<View style={{",card.indexOf("const profilePillTouch=")));
 assert.ok(pill.includes("flexGrow:0,flexShrink:0"));
 assert.equal((pill.match(/style=\{profilePillTouch\}/g)??[]).length,2);
 assert.ok(!pill.includes("adjustsFontSizeToFit"));
 assert.ok(card.includes("profilePadding=profilePortrait?JCARD_BUSINESS_COLUMN_INSET"));
 assert.ok(card.includes('contentContainerStyle={{alignItems:"stretch",gap:2}}'));
 assert.ok(header.includes('const align="left"')&&header.includes('const justify="flex-start"'));
});
