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
 assert.ok(skeleton.includes("jcardSurfaceSize({screenWidth,measuredWidth,fontScale,theme,profile:true,horizontalInset:profileInset})"));
 assert.ok(real.includes("setMeasuredCardWidth("));
 assert.ok(skeleton.includes("setMeasuredWidth("));
 assert.ok(real.includes("jcardSurfaceMetrics.maxWidth"));
 assert.ok(skeleton.includes("jcardSurfaceMetrics.maxWidth"));
 assert.ok(!skeleton.includes("height:450"));
 assert.ok(skeleton.includes('accessibilityLabel="Cargando JCard"'));
});

test("Skeleton mirrors the frameless portrait and centered summary with the hexagonal gears loader",()=>{
 const skeleton=source("src/components/JCardLoadingSkeleton.tsx");
 const gears=source("src/components/JobinLoadingGears.tsx");
 assert.ok(skeleton.includes("<JobinLoadingGears size={30} mode=\"loading\"/>"));
 assert.ok(skeleton.includes("height:portrait.height,borderRadius:portrait.radius"));
 assert.ok(!skeleton.includes("borderRadius:44,borderWidth:3"));
 assert.ok(!skeleton.includes(">JCard</Text>"));
 assert.ok(skeleton.includes("style={titleSpace}"));
 assert.ok(skeleton.includes('justifyContent:"space-evenly"'));
 assert.ok(!skeleton.includes("Idiomas"));
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
 assert.ok(skeleton.includes("top:-portrait.overlap"));
});


test("Profile faces share a compact floor, grow with type, and fit the widest rendered face",async()=>{
 const {jcardSurfaceSize,jcardProfileBodyHeight}=await import("../src/theme/jcard.ts");
 for(const width of [250,288,310,390,520]){
  for(const theme of ["light","dark"] as const){
   const base={screenWidth:width+32,measuredWidth:width,fontScale:1,theme};
   const skeleton=jcardSurfaceSize({...base,profile:true});
   assert.equal(skeleton.height,jcardProfileBodyHeight(width,1));
   assert.ok(skeleton.height<(width<350?328:320));
   assert.ok(jcardSurfaceSize({...base,profile:true,fontScale:1.5}).height>skeleton.height);
   assert.equal(jcardSurfaceSize(base).height,(theme==="light"?330:400)+(width<350?8:0));
  }
 }
 const card=source("src/components/JobinCard.tsx");
 assert.match(card,/Math\.max\(surface.height,showPersonal\?personalHeight:0,showBusiness\?businessHeight:0\)/);
 assert.match(card,/<BusinessCard3D\s+height=\{cardHeight\}/);
 assert.match(card,/back=\{<View\s+style=\{\{height:cardHeight\}\}>/);
 assert.ok(card.includes("onProfileLayout={measurePersonal}")&&card.includes("onProfileLayout={measureBusiness}"));
});

test("Full-width banner preserves previous heights on own and visitor profiles", async()=>{
 const {jcardSurfaceSize,jcardProfilePortraitMetrics}=await import("../src/theme/jcard.ts");
 for(const [screenWidth,ownHeight,publicHeight] of [[320,86,84],[360,98,96],[414,115,112],[768,148,148]]){
  for(const [horizontalInset,height] of [[16,ownHeight],[20,publicHeight]]){
   const size=jcardSurfaceSize({screenWidth,fontScale:1,theme:"light",profile:true,horizontalInset});
   assert.equal(jcardProfilePortraitMetrics(size.width).coverHeight,height);
  }
 }
 const card=source("src/components/JobinCard.tsx");
 assert.ok(card.includes('width:"100%",height:profilePortrait.coverHeight,marginBottom:-profilePortrait.overlap'));
 const owner=source("src/app/(tabs)/profile.tsx"),visitor=source("src/app/jcard.tsx");
 for(const [screen,inset] of [[owner,16],[visitor,20]] as const){
  assert.ok(screen.includes('contentInsetAdjustmentBehavior="never"'));
  assert.ok(!screen.includes('paddingTop:NAVIGATION_ROW_HEIGHT+12'));
  assert.ok(screen.includes(`profileInset={${inset}}`));
 }
});

test("Both centered name areas clear the portrait with wide or vertically offset placement",async()=>{
 const {jcardProfilePortraitMetrics,jcardProfileIdentitySpace}=await import("../src/theme/jcard.ts");
 for(const width of [250,280,288,328,390,520]){
  const portrait=jcardProfilePortraitMetrics(width);
  for(const nameLength of [8,18,42]){
   for(const fontScale of [1,1.3,2]){
    const name=jcardProfileIdentitySpace(portrait,nameLength,17,fontScale);
    const gutter=portrait.inset+portrait.width;
    const clearance=portrait.height-portrait.overlap;
    assert.ok(name.paddingHorizontal>gutter||name.paddingTop>clearance);
    assert.ok(name.paddingHorizontal*2<width);
    assert.ok(name.minHeight>=clearance);
   }
  }
 }
});

test("Profile faces show personal counts only and present languages and services in About",()=>{
 const card=source("src/components/JobinCard.tsx");
 const personal=card.slice(card.indexOf("{profilePortrait&&identitySpace?"),card.indexOf("export function BusinessFace"));
 const business=card.slice(card.indexOf("export function BusinessFace"),card.indexOf("export function JobinCard"));
 assert.ok(personal.includes("<ProfileConnectionCountRow"));
 assert.ok(!business.includes("<ProfileConnectionCountRow"));
 assert.match(business,/profilePortrait&&identitySpace\?[\s\S]*?profileName[\s\S]*?profileCategory[\s\S]*?reseñas[\s\S]*?\{contactRows\}/);
 assert.ok(card.includes('resizeMode="contain"'));
 for(const path of ["src/app/(tabs)/profile.tsx","src/app/jcard.tsx"]){
  const app=source(path);
  assert.ok(app.includes("<ProfilePersonalLanguages languages={"));
  assert.ok(app.includes("<ProfileBusinessAbout business={"));
 }
});
