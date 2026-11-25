import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
const source=(path:string)=>readFileSync(path,"utf8");

test("Skeleton and real JCard share identical responsive sizing calculations",()=>{
 const theme=source("src/theme/jcard.ts");
 const real=source("src/components/JobinCard.tsx");
 const skeleton=source("src/components/JCardLoadingSkeleton.tsx");
 assert.ok(theme.includes("export function jcardSurfaceSize("));
 assert.ok(theme.includes("lightHeight:330, darkHeight:400"));
 assert.ok(theme.includes("compactThreshold:350"));
 assert.ok(real.includes("jcardSurfaceSize({screenWidth:width,measuredWidth:measuredCardWidth,fontScale"));
 assert.ok(skeleton.includes("jcardSurfaceSize({screenWidth,measuredWidth,fontScale,theme,profile:{}})"));
 assert.ok(real.includes("setMeasuredCardWidth("));
 assert.ok(skeleton.includes("setMeasuredWidth("));
 assert.ok(real.includes("jcardSurfaceMetrics.maxWidth"));
 assert.ok(skeleton.includes("jcardSurfaceMetrics.maxWidth"));
 assert.ok(!skeleton.includes("height:450"));
 assert.ok(skeleton.includes('accessibilityLabel="Cargando JCard"'));
});

test("Skeleton mirrors the frameless portrait and chip/language layout with the hexagonal gears loader",()=>{
 const skeleton=source("src/components/JCardLoadingSkeleton.tsx");
 const gears=source("src/components/JobinLoadingGears.tsx");
 assert.ok(skeleton.includes("<JobinLoadingGears size={35} mode=\"loading\"/>"));
 assert.ok(skeleton.includes("height:portrait.height,borderRadius:portrait.radius"));
 assert.ok(!skeleton.includes("borderRadius:44,borderWidth:3"));
 assert.ok(!skeleton.includes(">JCard</Text>"));
 assert.ok(skeleton.includes("minHeight:80"));
 assert.ok(skeleton.includes("height:35,borderRadius:18"));
 assert.ok(skeleton.includes("minHeight:43"));
 assert.ok(gears.includes('mode="loading"'));
 assert.ok(gears.includes("useReducedMotion()"));
 assert.ok(gears.includes('if(mode!=="loading"||reducedMotion)return;'));
 assert.ok(gears.includes("withRepeat(withTiming(360"));
 assert.ok(gears.includes("<Polygon"));
 assert.ok(gears.includes("t.ink2"));
 assert.ok(!gears.includes("t.yellow"));
});

test("Offline gear indicator is static and has retry, cached JCard remains visible",()=>{
 const state=source("src/components/JCardConnectionState.tsx");
 const owner=source("src/app/(tabs)/profile.tsx");
 const publicCard=source("src/app/jcard.tsx");
 assert.ok(state.includes('mode="offline"'));
 assert.ok(state.includes("Reintentar"));
 assert.ok(state.includes("Mostrando la última JCard guardada"));
 assert.ok(state.includes("isJCardConnectivityError"));
 assert.ok(owner.includes("<JCardOfflineNotice retry={workspace.reload} cached/>"));
 assert.ok(owner.includes("<JCardLoadState loading={workspace.loading}"));
 assert.ok(publicCard.includes("<JCardLoadState loading={resource.loading}"));
 assert.ok(!publicCard.includes("<ProfessionalStatus loading={resource.loading}"));
});

test("No persistent flip handle or hand tutorial remains",()=>{
 const card=source("src/components/JobinCard.tsx");
 const flip=source("src/components/BusinessCard3D.tsx");
 assert.ok(!card.includes("Toca para ver datos personales"));
 assert.ok(!card.includes('accessibilityLabel="Girar a JCard de negocio"'));
 assert.ok(!card.includes('name="hand-left-outline"'));
 assert.ok(!card.includes('name="sync-outline"'));
 assert.ok(!card.includes("ghostPreview="));
 assert.ok(flip.includes("return()=>{cancelAnimation(previewAngle)"));
 assert.ok(flip.includes("onSide(next)"));
});


test("Profile portraits use a common exact quarter overlap and fixed non-rotating cover region",async()=>{
 const {jcardProfilePortraitMetrics}=await import("../src/theme/jcard.ts");
 for(const width of [250,288,310,390,520]){
  const m=jcardProfilePortraitMetrics(width);
  assert.equal(m.overlap,m.height/4);
  assert.ok(m.width>=60&&m.width<=86);
  assert.ok(m.coverHeight>m.overlap);
 }
 const card=source("src/components/JobinCard.tsx"),flip=source("src/components/BusinessCard3D.tsx"),skeleton=source("src/components/JCardLoadingSkeleton.tsx");
 assert.ok(card.includes("jcardProfilePortraitMetrics(")&&skeleton.includes("jcardProfilePortraitMetrics(width)"));
 assert.ok(card.includes("left:profilePortrait.inset")&&card.includes("right:profilePortrait.inset"));
 assert.ok(card.indexOf("height:profilePortrait.coverHeight")<card.indexOf("<BusinessCard3D height={cardHeight}"));
 assert.ok(card.includes("<JCardSharedCover target={ownerId}")&&!card.includes("source={{uri:card.business.bannerUrl}}"));
 assert.ok(flip.includes("height:totalHeight")&&flip.includes("marginTop:topInset,shadowColor"));
 assert.ok(flip.includes("{frontPortrait}")&&flip.includes("{backPortrait}"));
 assert.ok(skeleton.includes("top:portrait.coverHeight-portrait.overlap"));
});


test("Compact profile geometry has a shared baseline, grows for real content, and does not resize legacy previews",async()=>{
 const {jcardSurfaceSize,jcardProfileBodyHeight}=await import("../src/theme/jcard.ts");
 for(const width of [250,288,310,390,520]){
  for(const theme of ["light","dark"] as const){
   const base={screenWidth:width+32,measuredWidth:width,fontScale:1,theme};
   const skeleton=jcardSurfaceSize({...base,profile:{}});
   assert.equal(skeleton.height,jcardProfileBodyHeight(width,theme,1));
   assert.equal(skeleton.height,width<350?328:320);
   const ordinary={personal:{languageCount:2,secondarySealCount:0,saveContact:false,employerLink:false}};
   const visitor={personal:{...ordinary.personal,saveContact:true,employerLink:true}};
   const dense={personal:{languageCount:8,secondarySealCount:6,saveContact:true,employerLink:true},business:{contactRows:4,services:true,saveContact:true}};
   assert.ok(jcardSurfaceSize({...base,profile:ordinary}).height>=skeleton.height);
   assert.ok(jcardSurfaceSize({...base,profile:visitor}).height>jcardSurfaceSize({...base,profile:ordinary}).height);
   assert.ok(jcardSurfaceSize({...base,profile:dense}).height>=jcardSurfaceSize({...base,profile:visitor}).height);
   assert.ok(jcardSurfaceSize({...base,fontScale:1.5,profile:dense}).height>jcardSurfaceSize({...base,profile:dense}).height);
   assert.equal(jcardSurfaceSize(base).height,(theme==="light"?330:400)+(width<350?8:0));
  }
 }
 const card=source("src/components/JobinCard.tsx");
 assert.ok(card.includes("profile:profileSizing"));
 assert.match(card,/<BusinessCard3D\s+height=\{cardHeight\}/);
 assert.match(card,/back=\{<View\s+style=\{\{height:cardHeight\}\}>/);
 assert.ok(card.includes("secondarySealCount:secondaryCardSeals(card).length"));
 assert.ok(card.includes("visibility.business_show_email?")&&card.includes("visibility.business_show_phone&&"));
 assert.ok(card.includes("minHeight:profilePortrait?44:28"));
 assert.ok(card.includes("height:undefined,minHeight:66,flexShrink:0"));
});
