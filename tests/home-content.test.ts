import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";

const read=(path:string)=>readFileSync(path,"utf8");

test("Create menu contains exactly post, story, Flash and live actions",()=>{
 const menu=read("src/components/JobeenCreateMenu.tsx");
 const actions=menu.match(/const actions=\[([\s\S]*?)\] as const;/)?.[1]??"";
 assert.equal((actions.match(/\{id:/g)??[]).length,4);
 for(const id of ['id:"post"','id:"story"','id:"flash"','id:"live"'])assert.ok(actions.includes(id),id);
 assert.ok(!actions.includes('name:"Video"'));
 assert.ok(menu.includes("<JobeenFlashIcon"));
});

test("Home and Messages share stories while Home offers an optional quick composer",()=>{
 const home=read("src/app/(tabs)/index.tsx");
 const inbox=read("src/app/(tabs)/inbox.tsx");
 const header=read("src/components/SocialHeader.tsx");
 const strip=read("src/components/StoryStrip.tsx");
 assert.ok(home.includes("<SocialHeader showComposer/>"));
 assert.ok(inbox.includes("<SocialHeader />"));
 assert.ok(header.includes("showComposer&&composerVisible&&<PostQuickComposer"));
 assert.ok(header.includes("<StoryStrip"));
 assert.ok(strip.includes("loadActiveStories"));
 assert.ok(!strip.includes("STORIES"));
 assert.ok(strip.includes('/story/create'));
});

test("Post and story editors use real publishing, not simulated success",()=>{
 const posts=read("src/app/post/create.tsx");
 const stories=read("src/app/story/create.tsx");
 const api=read("src/lib/social-content.ts");
 assert.ok(posts.includes("publishHomePost("));
 assert.ok(stories.includes("publishStory("));
 assert.ok(api.includes('from("jobeen_feed_posts"'));
 assert.ok(api.includes('from("jobeen_stories"'));
 assert.ok(api.includes('shareApprovedMedia'));
 assert.ok(!api.includes("FEED_POSTS"));
});

test("Story storage is private and public read expires",()=>{
 const migration=read("supabase/migrations/20261117030000_jobeen_home_posts_stories.sql");
 assert.ok(migration.includes("'jobeen-story-media',false"));
 assert.ok(migration.includes("expires_at>now()"));
 assert.ok(migration.includes("enable row level security"));
 assert.ok(migration.includes("author_id=(select auth.uid())"));
});
