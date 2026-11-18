import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";

const source=(path:string)=>readFileSync(path,"utf8");

test("A single Publish press starts the upload without a second confirmation",()=>{
 const editor=source("src/app/post/create.tsx");
 assert.ok(editor.includes("onPress={()=>void submit()}"));
 assert.ok(editor.includes("Publicando..."));
 assert.ok(!editor.includes('Alert.alert("Publicar"'));
 assert.ok(editor.includes("await publishHomePost("));
});

test("Real Home posts have a paginated photo gallery and working social controls",()=>{
 const card=source("src/components/HomePublishedPosts.tsx");
 assert.ok(card.includes("<PhotoCarousel post="));
 assert.ok(card.includes("<PostEngagementRow likes="));
 assert.ok(!card.includes("toLocaleDateString"));
 assert.ok(!card.includes("feedPhotoCounterBg"));
 assert.ok(card.includes("setHomePostLike("));
 assert.ok(card.includes("loadHomePostComments("));
 assert.ok(card.includes("addHomePostComment("));
 assert.ok(card.includes("recordHomePostShare("));
 assert.ok(card.includes("Share.sharedAction"));
 const demo=source("src/components/PostCard.tsx");
 assert.ok(demo.includes("export function PostEngagementRow("));
 assert.ok(demo.includes('justifyContent: "flex-start"'));
 assert.ok(demo.includes('gap: 20, paddingHorizontal: 16'));
 assert.ok(demo.includes('name="heart-outline"') || demo.includes('"heart-outline"'));
 assert.ok(demo.includes('name="chatbubble-outline"'));
 assert.ok(demo.includes('name="arrow-redo-outline"'));
 assert.ok(demo.includes("Share.share("));
 assert.ok(source("src/app/(tabs)/index.tsx").includes("shares={card.post.shares}"));
});

test("Home counters come from RLS-secured database rows, never demo counts",()=>{
 const sourceApi=source("src/lib/social-content.ts");
 const sql=source("supabase/migrations/20261118193123_jobeen_feed_engagement.sql");
 assert.ok(sourceApi.includes('from("jobeen_feed_engagement"'));
 assert.ok(sourceApi.includes('from("jobeen_feed_likes"'));
 assert.ok(sourceApi.includes('from("jobeen_feed_comments"'));
 assert.ok(sourceApi.includes('from("jobeen_feed_shares"'));
 assert.ok(!sourceApi.includes("FEED_POSTS"));
 assert.ok(sql.includes("security_invoker=true"));
 for(const table of ["jobeen_feed_likes","jobeen_feed_comments","jobeen_feed_shares"])
  assert.ok(sql.includes("alter table public."+table+" enable row level security"));
});

test("Home three-dot menu has no delete action; only the profile manages deletion",()=>{
 const home=source("src/components/HomePublishedPosts.tsx");
 const menu=source("src/components/FeedPostOptions.tsx");
 const profile=source("src/components/ProfileOwnedPosts.tsx");
 const profileScreen=source("src/app/(tabs)/profile.tsx");
 const api=source("src/lib/social-content.ts");
 assert.ok(home.includes("FeedPostOptions"));
 assert.ok(!home.includes("deleteHomePost"));
 assert.ok(!menu.includes("deleteHomePost"));
 assert.ok(!menu.includes("Eliminar publicación"));
 assert.ok(menu.includes("Guardar publicación"));
 assert.ok(menu.includes("Compartir enlace"));
 assert.ok(menu.includes("Ocultar publicación"));
 assert.ok(menu.includes("¿Por qué veo esta publicación?"));
 assert.ok(profile.includes("deleteHomePost("));
 assert.ok(profile.includes('Alert.alert("Eliminar publicación"'));
 assert.ok(profileScreen.includes("<ProfileOwnedPosts/>"));
 assert.ok(api.includes('authorId?query.eq("author_id",authorId)'));
});
test("Saved posts can be revisited and shared links have a detail route",()=>{
 const prefs=source("src/lib/feed-preferences.ts");
 const profile=source("src/components/ProfileOwnedPosts.tsx");
 const home=source("src/components/HomePublishedPosts.tsx");
 const route=source("src/app/post/[id].tsx");
 assert.ok(prefs.includes("getSavedPostIds"));
 assert.ok(prefs.includes("getHiddenPostIds"));
 assert.ok(prefs.includes("setSavedPost"));
 assert.ok(profile.includes("Guardadas"));
 assert.ok(profile.includes('pathname:"/post/[id]"'));
 assert.ok(route.includes("loadHomePosts(user,undefined,id)"));
 assert.ok(home.includes('Linking.createURL("post/"+post.id)'));
});
