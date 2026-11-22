
import test from "node:test";
import assert from "node:assert/strict";
import {createTextPostRecovery,validateRecoveryTextPosts} from "../src/lib/recover-private-text-posts.ts";
const owner="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",scope={owner,session:"jobeen.session.started.v3."+owner+".a"};
const grant="dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const draft={id:"fixture-1",updatedAt:123,body:"fixture text",kind:"text",photos:[],mediaId:"",audience:"private",audienceFollowers:false,audienceContacts:false,consent:false,mentionedProfileIds:[],businessMentions:[]};
const payload=JSON.stringify([draft]);
test("Recovery accepts text only with private defaults and no restored grants or media references",()=>{
 validateRecoveryTextPosts(payload);
 for(const patch of [{photos:[{uri:"file:///fixture"}]},{audience:"public"},{consent:true},{audienceContacts:true},{mediaId:"other"},{mentionedProfileIds:["other"]},{extra:1}]){
  assert.throws(()=>validateRecoveryTextPosts(JSON.stringify([{...draft,...patch}])));
 }
 assert.throws(()=>validateRecoveryTextPosts(JSON.stringify([draft,draft])));
});
test("Explicit recovery uses exact server bytes, renewed twice, and never overwrites a conflict",async()=>{
 let read=0,writes=0;
 const recover=createTextPostRecovery(async()=>{read++;return payload},async(s,p,check)=>{
  assert.deepEqual(s,scope);assert.equal(p,payload);await check();await check();writes++;return false;
 },async s=>assert.deepEqual(s,scope));
 await assert.rejects(recover(grant,scope,false));assert.equal(read,0);
 assert.equal(await recover(grant,scope,true),"conflict");assert.equal(read,3);assert.equal(writes,1);
});
test("Changed, revoked, malformed or absent response cannot restore",async()=>{
 let reads=0,commits=0;
 const recover=createTextPostRecovery(async()=>++reads===1?payload:null,async(_s,_p,check)=>{await check();commits++;return true},async()=>{});
 await assert.rejects(recover(grant,scope,true));assert.equal(commits,0);
 const malformed=createTextPostRecovery(async()=>JSON.stringify([{...draft,audience:"public"}]),async()=>{commits++;return true},async()=>{});
 await assert.rejects(malformed(grant,scope,true));assert.equal(commits,0);
});
