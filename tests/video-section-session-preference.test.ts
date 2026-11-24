import assert from "node:assert/strict";
import test from "node:test";
import {createVideoSectionPreference,videoSectionForPath,videoSectionRoute,videoSectionKey} from "../src/lib/video-section-preference.ts";
const A={owner:"a1111111-1111-4111-8111-111111111111",session:"A-1"};
const B={owner:"b2222222-2222-4222-8222-222222222222",session:"B-1"};
const A2={...A,session:"A-2"};
test("First entry is Live; last visited section persists separately per account on this device",async()=>{
 const values=new Map<string,string>();let active=A;
 const p=createVideoSectionPreference({getItem:async k=>values.get(k)??null,setItem:async(k,v)=>{values.set(k,v);}},async s=>{assert.deepEqual(s,active);});
 assert.equal(await p.read(A),"streams");
 await p.write(A,"videos");
 active=B;assert.equal(await p.read(B),"streams");
 await p.write(B,"streams");
 active=A2;assert.equal(await p.read(A2),"videos");
 assert.notEqual(videoSectionKey(A.owner),videoSectionKey(B.owner));
 await assert.rejects(p.write(A,"streams"));assert.equal(await p.read(A2),"videos");
 await assert.rejects(p.read(B));
});
test("An in-flight read cannot navigate using a previous session or account",async()=>{
 for(const next of [B,A2]){
  let active=A,release!:()=>void,entered!:()=>void;
  const gate=new Promise<void>(r=>{release=r;}),started=new Promise<void>(r=>{entered=r;});
  const p=createVideoSectionPreference({getItem:async()=>{entered();await gate;return "videos";},setItem:async()=>{}},async s=>{assert.deepEqual(s,active);});
  const pending=p.read(A);await started;active=next;release();await assert.rejects(pending);
 }
});
test("Only actual Videos sections are remembered and corrupt values use Live",async()=>{
 assert.equal(videoSectionForPath("/streams"),"streams");
 assert.equal(videoSectionForPath("/(tabs)/videos"),"videos");
 for(const path of ["/stream/1","/search","/live","/","/jcard"])assert.equal(videoSectionForPath(path),null);
 assert.equal(videoSectionRoute("streams"),"/(tabs)/streams");
 assert.equal(videoSectionRoute("videos"),"/(tabs)/videos");
 const p=createVideoSectionPreference({getItem:async()=>"post-123",setItem:async()=>{}},async()=>{});
 assert.equal(await p.read(A),"streams");await assert.rejects(p.read({owner:"guest",session:""}));
});
