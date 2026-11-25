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
 assert.ok(skeleton.includes("jcardSurfaceSize({screenWidth,measuredWidth,fontScale,theme})"));
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
 assert.ok(skeleton.includes("height:compact?83:88,borderRadius:14"));
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
