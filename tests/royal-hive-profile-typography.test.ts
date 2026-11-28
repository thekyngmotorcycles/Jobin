import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {JOBEEN_TYPE,JOBEEN_LINE_HEIGHT,jobeenTypeWidthScale,royalHiveTypography} from "../src/theme/typography.ts";
const source=(path:string)=>readFileSync(path,"utf8");
test("Approved profile type sizes at logical widths and boundaries",()=>{
 const keys=["pageTitle","navigationTitle","modalTitle","sectionTitle","body","input","action","segmented","secondary","micro"] as const;
 const compact=[20,16,18,15,14,14,13,12,12,10],standard=[21,17,19,16,15,15,14,13,12,11],wide=[22,18,20,17,15,15,15,14,13,11];
 for(const [width,expected] of [[280,compact],[320,compact],[359,compact],[360,standard],[390,standard],[399,standard],[400,wide],[402,wide],[440,wide],[1200,wide],[NaN,standard]] as const){
  const tokens=royalHiveTypography(width,true);assert.deepEqual(keys.map(k=>tokens.type[k]),expected);
  for(const k of keys)assert.ok(tokens.lineHeight[k]>=tokens.type[k]);
  assert.equal(tokens.adaptive,true);
 }
});
test("Legacy sizes are preserved outside the profile and no global multiplier is used",()=>{
 for(const width of [280,320,360,390,402,440,1200]){
  const tokens=royalHiveTypography(width);assert.equal(tokens.adaptive,false);
  for(const key of Object.keys(JOBEEN_TYPE) as (keyof typeof JOBEEN_TYPE)[])assert.equal(tokens.type[key],JOBEEN_TYPE[key]);
  for(const key of Object.keys(JOBEEN_LINE_HEIGHT) as (keyof typeof JOBEEN_LINE_HEIGHT)[])assert.equal(tokens.lineHeight[key],JOBEEN_LINE_HEIGHT[key]);
  assert.equal(jobeenTypeWidthScale(width),1);
 }
});
test("Both profiles opt in, shared menu and actions respect the scope, card art opts out",()=>{
 for(const path of ["src/app/(tabs)/profile.tsx","src/app/jcard.tsx"])assert.ok(source(path).includes("<ProfileTypographyScope>"));
 assert.ok(source("src/components/JobinCard.tsx").includes("const { s, fs } = useUi(false)"));
 for(const path of ["ui.tsx","ProfileSharedSections.tsx","ProfessionalHistoryGrid.tsx","ProfileCommunityActions.tsx","SettingsMenuRow.tsx","SettingsDrawerHeader.tsx","social-ui.tsx"])assert.ok(source("src/components/"+path).includes("useRoyalHiveTypography("));
 assert.ok(!source("src/theme/ProfileTypographyScope.tsx").includes("fontScale"));
});
