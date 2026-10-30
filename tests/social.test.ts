import assert from "node:assert/strict";
import test from "node:test";
import { FEED_POSTS,feedClip,formatCount,visiblePosts } from "../src/lib/feed.ts";
import { browseStreams } from "../src/lib/streams.ts";
test("Following includes only followed creators while For You remains discoverable",()=>{
 assert.equal(visiblePosts("Following",[]).length,0);
 const followed=visiblePosts("Following",["ana"]);
 assert.ok(followed.length>0);
 assert.ok(followed.every(post=>post.creatorId==="ana"));
 assert.equal(visiblePosts("For You",["ana"]).length,FEED_POSTS.length);
});
test("repeated feed cards share a post identity but have distinct list keys",()=>{
 const first=feedClip("For You",0),repeat=feedClip("For You",FEED_POSTS.length);
 assert.equal(first.postId,repeat.postId);
 assert.notEqual(first.id,repeat.id);
});
test("search matches handles and professions independent of case",()=>{
 assert.ok(visiblePosts("For You",[],"  INTERIOR  ").every(post=>post.creatorId==="ana"));
 assert.ok(visiblePosts("For You",[],"  INTERIOR  ").length>0);
 assert.equal(visiblePosts("For You",[],"no-such-creator").length,0);
});
test("Nearby filters by city, and Games and Shop show their own categories",()=>{
 const nearby=browseStreams("Nearby","Miami");
 assert.ok(nearby.length>0&&nearby.every(room=>room.city==="Miami"));
 assert.ok(browseStreams("Games","Todas").every(room=>room.category==="Games"));
 assert.ok(browseStreams("Shop","Todas").every(room=>room.category==="Shop"));
 assert.equal(browseStreams("Popular","Todas","unknown-room").length,0);
 assert.equal(browseStreams("Nearby","Unknown").length,0);
});
test("popular rooms are sorted by viewer counts; compact counts remain readable",()=>{
 const rooms=browseStreams("Popular","Todas");
 assert.ok(rooms.every((room,index)=>index===0||rooms[index-1].viewers>=room.viewers));
 assert.equal(formatCount(1300000),"1.3M");
 assert.equal(formatCount(30900),"30.9K");
 assert.equal(formatCount(24),"24");
 assert.equal(formatCount(-1),"0");
 assert.equal(formatCount(NaN),"0");
});
