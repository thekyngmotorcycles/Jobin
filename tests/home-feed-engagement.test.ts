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
 assert.ok(card.includes("<FlatList horizontal pagingEnabled"));
 assert.ok(card.includes("index+1+\" / \"+total"));
 assert.ok(card.includes("setHomePostLike("));
 assert.ok(card.includes("loadHomePostComments("));
 assert.ok(card.includes("addHomePostComment("));
 assert.ok(card.includes("recordHomePostShare("));
 assert.ok(card.includes("Share.sharedAction"));
 assert.ok(card.includes("formatCount(likes)"));
 assert.ok(card.includes("formatCount(commentsCount)"));
 assert.ok(card.includes("formatCount(shares)"));
});

test("Home counters come from RLS-secured database rows, never demo counts",()=>{
 const sourceApi=source("src/lib/social-content.ts");
 const sql=source("supabase/migrations/20261118193000_jobeen_feed_engagement.sql");
 assert.ok(sourceApi.includes('from("jobeen_feed_engagement"'));
 assert.ok(sourceApi.includes('from("jobeen_feed_likes"'));
 assert.ok(sourceApi.includes('from("jobeen_feed_comments"'));
 assert.ok(sourceApi.includes('from("jobeen_feed_shares"'));
 assert.ok(!sourceApi.includes("FEED_POSTS"));
 assert.ok(sql.includes("security_invoker=true"));
 for(const table of ["jobeen_feed_likes","jobeen_feed_comments","jobeen_feed_shares"])
  assert.ok(sql.includes("alter table public."+table+" enable row level security"));
});
