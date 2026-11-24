import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {feedPhotoTiles,POST_PHOTO_LIMIT,FEED_VISIBLE_PHOTOS} from "../src/lib/feed-photo-layout.ts";
const read=(p:string)=>readFileSync(p,"utf8");
test("Hybrid gallery uses at most four nonoverlapping tiles across compact and large screens",()=>{
 assert.equal(POST_PHOTO_LIMIT,10);assert.equal(FEED_VISIBLE_PHOTOS,4);
 for(const width of [240,256,296,328,396,468,720])for(let count=1;count<=10;count++){
  const {height,tiles}=feedPhotoTiles(count,width);
  assert.equal(tiles.length,Math.min(count,4));assert.equal(height,Math.round(width*.75));
  for(const a of tiles){
   assert.ok(a.width>0&&a.height>0&&a.x>=0&&a.y>=0&&a.x+a.width<=width+.001&&a.y+a.height<=height+.001);
   for(const b of tiles)if(a!==b)assert.ok(a.x+a.width<=b.x+.001||b.x+b.width<=a.x+.001||a.y+a.height<=b.y+.001||b.y+b.height<=a.y+.001);
  }
 }
 assert.equal(feedPhotoTiles(0,300).tiles.length,0);
});
test("Shared gallery keeps uncropped viewer, zoom and scope protection",()=>{
 const s=read("src/components/PostPhotoGallery.tsx");
 assert.ok(s.includes('resizeMode="cover"'));assert.ok(s.includes('resizeMode="contain"'));
 assert.ok(s.includes("Gesture.Pinch()"));assert.ok(s.includes("Gesture.Pan()"));
 assert.ok(s.includes("onRequestClose={close}"));assert.ok(s.includes("watchAttachmentScope(()=>scope.current,close)"));
 assert.ok(s.includes("await assertMessageScope(captured)"));assert.ok(s.includes("captured.owner!==viewer"));
 assert.ok(s.includes("photos.length-FEED_VISIBLE_PHOTOS"));
 const p=read("src/components/HomePublishedPosts.tsx");assert.ok(p.includes("key={identity} active={ready} viewer={viewer}"));
 const nav=read("src/components/NavigationFade.tsx");assert.ok(nav.includes("height-inset.bottom-NAVIGATION_ROW_HEIGHT"));assert.ok(nav.includes('offset={opaqueStart} stopColor={colors.paper} stopOpacity={1}'));
});
test("Photo limit and per-photo progress agree in client, picker and schema",()=>{
 const editor=read("src/app/post/create.tsx"),api=read("src/lib/social-content.ts");
 assert.ok(editor.includes("selectionLimit:POST_PHOTO_LIMIT-photos.length"));assert.ok(editor.includes("false,POST_PHOTO_LIMIT-photos.length"));
 assert.ok(editor.includes("if(liveScope(scope))setPhotoProgress({done,total})"));
 assert.ok(api.includes("photoCount>POST_PHOTO_LIMIT"));assert.ok(api.includes("await assertMessageScope(scope);onPhotoProgress?.(i+1,photoCount)"));
 const migration=read("supabase/migrations/20261124010000_jobeen_feed_ten_photos.sql");
 assert.ok(migration.includes("cardinality(photo_paths) between 1 and 10"));
 assert.ok(!/drop policy|disable row level security|drop constraint jobeen_feed_paths/i.test(migration));
});

test("Photo viewer uses centralized media palette and legacy mentions remain reachable inline",()=>{
 const gallery=read("src/components/PostPhotoGallery.tsx"),caption=read("src/components/PostCaption.tsx");
 assert.ok(gallery.includes("backgroundColor:colors.mediaDisc"));
 assert.ok(gallery.includes("backgroundColor:colors.mediaSoftSurface"));
 assert.ok(gallery.includes("color:colors.mediaText"));
 assert.ok(caption.includes("overflow||expanded||mentions.length>0"));
 assert.ok(caption.includes("expanded&&mentions.length>0"));
 assert.ok(caption.includes("Profesionales y empresas etiquetados"));
 assert.ok(!caption.includes("<BottomSheet"));
});
