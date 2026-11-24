import assert from "node:assert/strict";
import test from "node:test";
import {ROYAL_HIVE_PALETTE,ROYAL_HIVE_BRAND,ROYAL_HIVE_STATES,THEMES,themeTokens} from "../src/theme/palettes.ts";
import {ROYAL_HIVE_TYPE,ROYAL_HIVE_LINE_HEIGHT,JOBEEN_TYPE,JOBEEN_LINE_HEIGHT,jobeenTypeWidthScale} from "../src/theme/typography.ts";
import {ROYAL_HIVE_CONTROL,royalHiveLayout,JOBEEN_CONTROL,jobeenPageLayout} from "../src/theme/control-metrics.ts";
import {readFileSync} from "node:fs";
import {contrastRatio} from "../src/theme/color.ts";
test("Royal Hive contrast meets AA on declared opaque surfaces and states",()=>{
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
test("Active shared typography and control geometry match plan v1.2",()=>{
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
 assert.ok(readFileSync("src/theme/modals.ts","utf8").includes("sheet:30,dialog:26,popover:18"));
});
test("Responsive controls keep four logical methods without clipping across widths and text scales",()=>{
 for(const width of [280,320,359,360,375,399,400,430,480])for(const scale of [1,1.3,2])for(const count of [3,4]){
  const l=royalHiveLayout(width,scale,count);
  assert.equal(l.touchTarget,48);
  assert.equal(l.profile,width<360?"compact":width<400?"standard":"wide");
  assert.ok(l.actionSize>=48&&l.actionSize<=60);
  assert.ok(l.methodCell>=48&&l.methodCell>=l.actionSize);
  assert.equal(l.methodsWidth,count*l.methodCell+(count-1)*l.gap);
  assert.equal(l.methodsNeedScroll,l.methodsWidth>l.available);
  assert.ok(l.avatarSize>=48&&l.avatarSize<=60);
  assert.ok(l.recipientCell>=l.avatarSize+12);
  assert.equal(jobeenTypeWidthScale(width),1);
 }
 assert.equal(royalHiveLayout(200).methodsNeedScroll,true);
 assert.equal(royalHiveLayout(280,2).methodsNeedScroll,true);
});
test("Only two Royal Hive palettes and one shared active type/control system",()=>{
 assert.deepEqual(THEMES.map(t=>t.id),["light","dark"]);
 assert.equal(themeTokens("light").paper,"#F5F7FA");
 assert.equal(themeTokens("dark").paper,"#0B1422");
 assert.equal(JOBEEN_TYPE.modalTitle,20);
 assert.equal(JOBEEN_CONTROL.visualAction,48);
 assert.equal(JOBEEN_TYPE,ROYAL_HIVE_TYPE);
 assert.equal(JOBEEN_LINE_HEIGHT,ROYAL_HIVE_LINE_HEIGHT);
 assert.equal(JOBEEN_CONTROL,ROYAL_HIVE_CONTROL);
});

test("Universal page layouts preserve responsive margins and readable content widths",()=>{
 for(const w of [280,320,359,360,399,400,430,768,1024,1440])for(const kind of ["settings","form","list","management"] as const){
  const page=jobeenPageLayout(w,kind);
  assert.equal(page.padding,royalHiveLayout(w).margin);
  assert.equal(page.maxWidth,kind==="settings"||kind==="form"?720:980);
  assert.equal(page.width,"100%");
  assert.equal(page.alignSelf,"center");
  assert.equal(page.gap,16);
  assert.ok(page.paddingBottom>=page.padding);
 }
});
