import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
import {JOBEEN_CONTROL,PROFILE_SEGMENTED,PROFILE_CONTROL_RHYTHM,profileActionSurface} from "../src/theme/control-metrics.ts";
import {royalHiveTypography} from "../src/theme/typography.ts";
const shared=readFileSync("src/components/ProfileSharedSections.tsx","utf8");
const section=shared.slice(shared.indexOf("export function ProfileSectionTabs"),shared.indexOf("export type ProfileAboutSide"));
const about=shared.slice(shared.indexOf("export function ProfileAboutSelector"),shared.indexOf("export function ProfilePersonalContact"));
test("Compact track and moving pill preserve at least 48 dp hit geometry",()=>{
 const m=PROFILE_SEGMENTED;assert.equal(m.touchHeight,JOBEEN_CONTROL.touchTarget);assert.equal(m.touchHeight,48);
 assert.equal(m.touchHeight-2*m.trackInset,38);assert.equal(m.touchHeight-2*m.pillInset,30);
 assert.ok(m.pillInset>m.trackInset);
 for(const width of [320,360,390,402,440])for(const scale of [1,1.3,2]){
  const line=royalHiveTypography(width,true).lineHeight.segmented;
  const height=Math.max(m.touchHeight,Math.ceil(line*scale)+2*m.textPadding);
  assert.ok(height>=48);assert.ok(height-2*m.pillInset>=line*scale);
  const half=(width-40-2*m.horizontalInset)/2;assert.ok(half>=48);
 }
});
test("Both selectors paint the background and selection inside independent touch rows",()=>{
 for(const source of [section,about]){
  assert.ok(source.includes("minHeight:JOBEEN_CONTROL.touchTarget"));
  assert.ok(source.includes("minWidth:JOBEEN_CONTROL.touchTarget"));
  assert.ok(source.includes("paddingVertical:PROFILE_SEGMENTED.textPadding"));
  const track=source===section?"PROFILE_SEGMENTED.trackInset":"PROFILE_CONTROL_RHYTHM.aboutTrackInset";
  const pill=source===section?"PROFILE_SEGMENTED.pillInset":"PROFILE_CONTROL_RHYTHM.aboutPillInset";
  assert.ok(source.includes(`top:${track},bottom:${track}`));
  assert.equal(source.split(`top:${pill},bottom:${pill}`).length-1,2);
  assert.ok(source.includes('pointerEvents="none"'));
  assert.ok(source.includes('useReducedMotion()'));
 }
 assert.ok(section.includes("Animated.parallel")&&section.includes("width:pillWidth")&&section.includes("translateX:position"));
 assert.ok(section.includes("alignItems:\"stretch\"")&&section.includes("<ScrollView horizontal"));
 assert.ok(about.includes("if(!personalAvailable||!businessAvailable)return null"));
 assert.ok(about.includes("outputRange:[0,half]")&&about.includes("width-2*PROFILE_SEGMENTED.horizontalInset"));
});

test("Option 2 keeps independent 40, 38 and 44 dp surfaces with nonoverlapping 48 dp touch rows",()=>{
 const r=PROFILE_CONTROL_RHYTHM,m=PROFILE_SEGMENTED,h=JOBEEN_CONTROL.touchTarget;
 assert.equal(h-2*r.actionInset,40);assert.equal(h-2*m.trackInset,38);
 assert.equal(h-2*r.aboutTrackInset,44);assert.equal(h-2*r.aboutPillInset,36);
 assert.equal(r.actionRadius,20);assert.equal(r.icon,18);assert.equal(r.gap,8);
 assert.equal(r.cardActionGap+r.actionInset,8);
 assert.equal(m.trackInset+r.aboutTop+r.aboutTrackInset,8);
 assert.ok(r.actionInset+r.heroBottom+m.outerVerticalPadding+m.trackInset>=r.gap);
 assert.deepEqual(profileActionSurface("test"),{position:"absolute",left:0,right:0,top:4,bottom:4,borderRadius:20,backgroundColor:"test"});
 for(const [path,start,end] of [
  ["src/components/JobinCard.tsx","{showOwnerActions&&ownerQuickActions&&","{showOwnerActions&&!ownerQuickActions"],
  ["src/components/ProfileCommunityActions.tsx"," return <View>","  <Modal visible={menuOpen}"]
 ]){
  const src=readFileSync(path,"utf8");const row=src.slice(src.indexOf(start),src.indexOf(end,src.indexOf(start)));
  assert.equal(row.split("profileActionSurface(").length-1,3);
  assert.equal(row.split("minHeight:JOBEEN_CONTROL.touchTarget").length-1,3);
  assert.equal(row.split('pointerEvents="none"').length-1,3);
  assert.ok(row.includes("gap:PROFILE_CONTROL_RHYTHM.gap"));
  assert.equal(row.split("size={PROFILE_CONTROL_RHYTHM.icon}").length-1,3);
 }
 for(const path of ["src/app/(tabs)/profile.tsx","src/app/jcard.tsx"]){
  const src=readFileSync(path,"utf8");assert.ok(src.includes("paddingBottom:PROFILE_CONTROL_RHYTHM.heroBottom"));
  assert.ok(src.includes("paddingHorizontal:PROFILE_CONTROL_RHYTHM.horizontalInset"));
  assert.ok(src.includes("PROFILE_CONTROL_RHYTHM.aboutTop"));
 }
});
