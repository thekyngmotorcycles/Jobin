import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
import {JOBEEN_CONTROL,PROFILE_SEGMENTED} from "../src/theme/control-metrics.ts";
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
  assert.ok(source.includes('top:PROFILE_SEGMENTED.trackInset,bottom:PROFILE_SEGMENTED.trackInset'));
  assert.equal((source.match(/top:PROFILE_SEGMENTED\.pillInset,bottom:PROFILE_SEGMENTED\.pillInset/g)??[]).length,2);
  assert.ok(source.includes('pointerEvents="none"'));
  assert.ok(source.includes('useReducedMotion()'));
 }
 assert.ok(section.includes("Animated.parallel")&&section.includes("width:pillWidth")&&section.includes("translateX:position"));
 assert.ok(section.includes("alignItems:\"stretch\"")&&section.includes("<ScrollView horizontal"));
 assert.ok(about.includes("if(!personalAvailable||!businessAvailable)return null"));
 assert.ok(about.includes("outputRange:[0,half]")&&about.includes("width-2*PROFILE_SEGMENTED.horizontalInset"));
});
