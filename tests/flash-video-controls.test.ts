import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
import {playbackFraction,playbackTime,seekPosition} from "../src/lib/video-progress.ts";
import {themeTokens} from "../src/theme/palettes.ts";
import {rgba} from "../src/theme/color.ts";

test("seek uses clip duration and clamps both boundaries, including invalid metadata",()=>{
 assert.equal(seekPosition(75,300,120),30);
 assert.equal(seekPosition(-1,300,120),0);
 assert.equal(seekPosition(350,300,120),120);
 assert.equal(seekPosition(50,0,120),0);
 assert.equal(seekPosition(50,100,Infinity),0);
 assert.equal(playbackFraction(2,0),0);
 assert.equal(playbackTime(125.8),"2:05");
 assert.equal(playbackTime(NaN),"0:00");
});
test("Royal Hive watermark gold uses the same hue as the solid active state",()=>{
 for(const theme of ["light","dark"] as const){
  const c=themeTokens(theme);
  const rest=rgba(c.mediaProgress),active=rgba(c.mediaProgressActive);
  assert.deepEqual(rest.slice(0,3),active.slice(0,3));
  assert.ok(rest[3]>.4&&rest[3]<.5);
  assert.equal(active[3],1);
 }
});
test("Flashes keeps scrubbing distinct from paging and the global navigation",()=>{
 const controls=readFileSync("src/components/VideoPlaybackControls.tsx","utf8");
 const feed=readFileSync("src/components/FeedVideo.tsx","utf8");
 const videos=readFileSync("src/app/(tabs)/videos.tsx","utf8");
 const layout=readFileSync("src/app/(tabs)/_layout.tsx","utf8");
 assert.match(controls,/player\.currentTime=next/);
 assert.match(controls,/onResponderTerminate/);
 assert.match(controls,/accessibilityRole="adjustable"/);
 assert.match(controls,/FLASH_PROGRESS_HEIGHT=48/);
 assert.match(videos,/scrollEnabled=\{scrubbingId===null\}/);
 assert.match(feed,/navClearance\+FLASH_PROGRESS_HEIGHT/);
 assert.match(feed,/bindPlaybackLifecycle/);
 assert.match(layout,/FLASH_NAV_HANDLE_HEIGHT/);
 assert.match(layout,/accessibilityState=\{\{expanded:flashExpanded\}\}/);
 assert.match(layout,/importantForAccessibility=\{flashExpanded\?"auto":"no-hide-descendants"\}/);
 assert.match(layout,/pathname==="\/videos"/);
});
