import assert from "node:assert/strict";
import test from "node:test";
import {ROYAL_HIVE_PALETTE,ROYAL_HIVE_BRAND,THEMES,themeTokens} from "../src/theme/palettes.ts";
import {ROYAL_HIVE_TYPE,ROYAL_HIVE_LINE_HEIGHT,JOBEEN_TYPE} from "../src/theme/typography.ts";
import {ROYAL_HIVE_CONTROL,royalHiveLayout,JOBEEN_CONTROL} from "../src/theme/control-metrics.ts";
import {ROYAL_HIVE_STATES,JOBEEN_MODAL_RADIUS} from "../src/theme/modals.ts";
import {contrastRatio} from "../src/theme/color.ts";
test("Royal Hive candidate contrast meets AA on declared opaque surfaces and states",()=>{
 for(const mode of ["light","dark"] as const){
  const p=ROYAL_HIVE_PALETTE[mode];
  for(const bg of [p.paper,p.surface,p.modal,p.selected]){
   assert.ok(contrastRatio(p.ink,bg)>=4.5,mode+" main text");
   assert.ok(contrastRatio(p.muted,bg)>=4.5,mode+" secondary text");
  }
  for(const bg of [p.paper,p.surface,p.modal]){
   assert.ok(contrastRatio(p.outline,bg)>=3,mode+" functional outline");
   assert.ok(contrastRatio(p.focus,bg)>=3,mode+" focus");
  }
  assert.ok(contrastRatio(p.onPrimary,p.primary)>=4.5);
  assert.ok(contrastRatio(p.onMedia,p.media)>=4.5);
  for(const [state,pair] of Object.entries(ROYAL_HIVE_STATES[mode])){
   assert.ok(contrastRatio(pair.foreground,pair.background)>=4.5,mode+" "+state);
  }
 }
 assert.equal(ROYAL_HIVE_BRAND.jcard,"#00072E");
});
test("Candidate typography and component geometry match plan v1.1 lower bounds",()=>{
 assert.equal(ROYAL_HIVE_TYPE.modalTitle,20);
 assert.equal(ROYAL_HIVE_TYPE.modalSectionTitle,17);
 assert.equal(ROYAL_HIVE_TYPE.modalRecipient,14);
 assert.equal(ROYAL_HIVE_TYPE.body,15);
 assert.equal(ROYAL_HIVE_TYPE.action,15);
 assert.equal(ROYAL_HIVE_TYPE.input,15);
 for(const key of Object.keys(ROYAL_HIVE_TYPE) as (keyof typeof ROYAL_HIVE_TYPE)[]){
  assert.ok(ROYAL_HIVE_LINE_HEIGHT[key]>=ROYAL_HIVE_TYPE[key],key);
 }
 assert.equal(ROYAL_HIVE_CONTROL.touchTarget,48);
 assert.equal(ROYAL_HIVE_CONTROL.visualAction,48);
 assert.equal(ROYAL_HIVE_CONTROL.inputHeight,48);
 assert.equal(ROYAL_HIVE_CONTROL.buttonRadius,12);
 assert.equal(ROYAL_HIVE_CONTROL.cardRadius,16);
 assert.equal(ROYAL_HIVE_CONTROL.shareIcon,28);
 assert.equal(JOBEEN_MODAL_RADIUS.sheet,30);
 assert.equal(JOBEEN_MODAL_RADIUS.dialog,26);
 assert.equal(JOBEEN_MODAL_RADIUS.popover,18);
});
test("Responsive candidate keeps the same target and four logical methods",()=>{
 for(const width of [280,320,359,360,375,399,400,430,480]){
  const l=royalHiveLayout(width);
  assert.equal(l.touchTarget,48);
  assert.equal(l.methodsNeedScroll,false);
  assert.equal(l.profile,width<360?"compact":width<400?"standard":"wide");
 }
 assert.equal(royalHiveLayout(200).methodsNeedScroll,true);
});
test("Candidate does not migrate or activate persisted themes or live typography",()=>{
 assert.deepEqual(THEMES.map(t=>t.id),["light","dark","pink","navy-green","camel","sunflower"]);
 assert.equal(themeTokens("light").paper,"#F5F4F0");
 assert.equal(themeTokens("dark").paper,"#000000");
 assert.equal(JOBEEN_TYPE.modalTitle,17);
 assert.equal(JOBEEN_CONTROL.visualAction,40);
});
