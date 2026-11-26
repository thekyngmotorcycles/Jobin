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
 const {jcardProfilePortraitMetrics,jcardBusinessLogoMetrics,jcardProfileCoverGeometry}=await import("../src/theme/jcard.ts");
 for(const width of [250,288,310,390,520]){
  const m=jcardProfilePortraitMetrics(width);
  assert.equal(m.overlap,m.height/4);
  assert.ok(m.width>=60&&m.width<=86);
  const {coverHeight,frameTop,bodyTop}=jcardProfileCoverGeometry(width+32,m);
  assert.ok(frameTop>=52,"Portrait stays clear of the cover editor");
  assert.equal(frameTop+m.overlap,bodyTop);
  assert.equal(bodyTop,coverHeight-m.coverOverlap);
  assert.ok(bodyTop<coverHeight);
  for(const ratio of [0.5,1,1.5,3]){
   const logo=jcardBusinessLogoMetrics(m,ratio);
   assert.ok(logo.width<=m.width&&logo.height<=m.height);
   assert.ok(Math.abs(logo.width/logo.height-ratio)<1e-6);
   assert.ok(Math.abs(m.overlap-logo.top-logo.height/4)<1e-6);
  }
 }
 const card=source("src/components/JobinCard.tsx"),flip=source("src/components/BusinessCard3D.tsx"),skeleton=source("src/components/JCardLoadingSkeleton.tsx");
 assert.ok(card.includes("jcardProfilePortraitMetrics(")&&skeleton.includes("jcardProfilePortraitMetrics(width)"));
 assert.ok(card.includes("left:profilePortrait.inset")&&card.includes("right:portrait.inset"));
 assert.ok(card.indexOf("<JCardProfileLayers")<card.indexOf("<BusinessCard3D height={cardHeight}"));
 assert.ok(card.includes("<JCardSharedCover target={ownerId}")&&!card.includes("source={{uri:card.business.bannerUrl}}"));
 assert.ok(flip.includes("height:totalHeight")&&flip.includes("marginTop:topInset,shadowColor"));
 assert.ok(flip.includes("{frontPortrait}")&&flip.includes("{backPortrait}"));
 assert.ok(skeleton.includes("paddingTop:portrait.overlap")&&skeleton.includes("top:0,width:portrait.width"));
 const layers=source("src/components/JCardProfileLayers.tsx");
 assert.ok(layers.includes('position:"absolute",top:0,left:0,right:0,height:geometry.coverHeight'));
 assert.ok(layers.includes("paddingTop:geometry.frameTop,zIndex:1"));
 assert.ok(layers.includes("{cover(geometry.coverHeight)}")&&layers.includes("{children}"));
 assert.ok(!layers.includes("marginBottom")&&!layers.includes("BusinessCard3D"));
 assert.ok(card.includes("<JCardProfileLayers")&&skeleton.includes("<JCardProfileLayers"));
});


test("Profile faces share the fixed compact footprint and grow only with accessibility scale",async()=>{
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
 assert.ok(card.includes("const cardHeight=surface.height;"));
 assert.match(card,/<BusinessCard3D\s+height=\{cardHeight\}/);
 assert.match(card,/back=\{<View\s+style=\{\{height:cardHeight\}\}>/);
 assert.ok(!card.includes("measurePersonal")&&!card.includes("measureBusiness"));
});

test("Full-width 5:2 cover has independent geometry on own and visitor profiles", async()=>{
 const {jcardSurfaceSize,jcardProfilePortraitMetrics,jcardProfileCoverGeometry,JCARD_PROFILE_COVER_RATIO}=await import("../src/theme/jcard.ts");
 assert.equal(JCARD_PROFILE_COVER_RATIO,2.5);
 for(const [screenWidth,height] of [[320,128],[360,144],[390,156],[414,166],[768,307]]){
  for(const horizontalInset of [16,20]){
   const size=jcardSurfaceSize({screenWidth,fontScale:1,theme:"light",profile:true,horizontalInset});
   const portrait=jcardProfilePortraitMetrics(size.width);
   const geometry=jcardProfileCoverGeometry(screenWidth,portrait);
   assert.equal(geometry.coverHeight,height);
   assert.equal(geometry.bodyTop,height-portrait.coverOverlap);
   assert.equal(geometry.frameTop+portrait.overlap,geometry.bodyTop);
  }
 }
 const card=source("src/components/JobinCard.tsx");
 assert.ok(card.includes("<JCardProfileLayers portrait={profilePortrait}"));
 assert.ok(!card.includes("marginBottom:-(profilePortrait.overlap"));
 const owner=source("src/app/(tabs)/profile.tsx"),visitor=source("src/app/jcard.tsx");
 for(const [screen,inset] of [[owner,16],[visitor,16]] as const){
  assert.ok(screen.includes('contentInsetAdjustmentBehavior="never"'));
  assert.ok(!screen.includes('paddingTop:NAVIGATION_ROW_HEIGHT+12'));
  assert.ok(screen.includes(`profileInset={${inset}}`));
 }
});

test("Fixed identity slots clear portraits with the approved business left column",async()=>{
 const {jcardProfilePortraitMetrics,jcardProfileIdentitySpace,JCARD_BUSINESS_COLUMN_INSET}=await import("../src/theme/jcard.ts");
 for(const width of [250,280,288,328,390,520]){
  const portrait=jcardProfilePortraitMetrics(width);
  for(const fontScale of [1,1.3,2]){
   const p=jcardProfileIdentitySpace(portrait,fontScale,"personal"),b=jcardProfileIdentitySpace(portrait,fontScale,"business");
   assert.ok(p.paddingLeft>portrait.inset+portrait.width);
   assert.equal(p.paddingLeft,b.paddingRight);assert.equal(b.paddingLeft,JCARD_BUSINESS_COLUMN_INSET);assert.ok(b.paddingLeft>p.paddingRight);
   assert.equal(p.minHeight,b.minHeight);assert.equal(p.nameHeight,b.nameHeight);assert.equal(p.subtitleHeight,b.subtitleHeight);
   assert.ok(p.width>0&&p.minHeight>=portrait.height-portrait.overlap);
   assert.ok(p.paddingLeft+p.paddingRight<width);
  }
 }
});

test("Business profile restores the review star and aligned branded contact circles",()=>{
 const card=source("src/components/JobinCard.tsx");
 const contactIcon=card.slice(card.indexOf("function BusinessContactIcon"),card.indexOf("function BusinessProfileLogo"));
 assert.ok(contactIcon.includes("backgroundColor:colors.yellow")&&contactIcon.includes("color={colors.onYellow}"));
 const face=card.slice(card.indexOf("const contactRows=profilePortrait?"),card.indexOf(' </View>:<View style={{gap:theme='));
 for(const icon of ["mail","call","location"]){
  assert.ok(face.includes(`<BusinessContactIcon name="${icon}-outline" theme={theme}/>`));
 }
 const profile=card.slice(card.indexOf("const profileName="),card.indexOf('   </View>:<>',card.indexOf("const profileName=")));
 assert.ok(profile.includes('<JCardProfileIdentity portrait={profilePortrait} side="business"'));
 assert.ok(profile.includes('color:jcardCommon.businessGold}}>★</Text> {ratingUnlocked?rating!.toFixed(1):"—"}'));
 assert.ok(profile.includes('· ({reviewCount}'));
});
test("Profile faces show personal counts only and present languages and services in About",()=>{
 const card=source("src/components/JobinCard.tsx");
 const personal=card.slice(card.indexOf("{profilePortrait?<View style={{flex:1,minHeight:0,paddingBottom:4}}>"),card.indexOf("export function BusinessFace"));
 const business=card.slice(card.indexOf("export function BusinessFace"),card.indexOf("export function JobinCard"));
 assert.ok(personal.includes("<ProfileConnectionCountRow"));
 assert.ok(!business.includes("<ProfileConnectionCountRow"));
 assert.match(business,/profilePortrait\?<View style=\{\{flex:1,minHeight:0,paddingBottom:4\}\}>[\s\S]*?profileName[\s\S]*?profileCategory[\s\S]*?reseñas[\s\S]*?\{contactRows\}/);
 assert.ok(card.includes('resizeMode="contain"'));
 for(const path of ["src/app/(tabs)/profile.tsx","src/app/jcard.tsx"]){
  const app=source(path);
  assert.ok(app.includes("<ProfilePersonalLanguages languages={"));
  assert.ok(app.includes("<ProfileBusinessAbout business={"));
 }
});
