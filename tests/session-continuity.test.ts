import test from "node:test";
import assert from "node:assert/strict";
import {verifyMessageSession,type MessageScope} from "../src/lib/session-continuity.ts";
const A={owner:"a1111111-1111-4111-8111-111111111111",session:"A-1"};
const B={owner:"b2222222-2222-4222-8222-222222222222",session:"B-1"};
const A2={...A,session:"A-2"};
function fixture(initial:MessageScope|null=A){
 let current=initial;
 let calls=0;
 const read=async()=>{if(!current)throw Error("Signed out");return {...current};};
 const verify=async()=>{calls++;return current?.owner??null;};
 const check=async(owner:string,session:string)=>{
  if(current?.owner!==owner||current.session!==session)throw Error("Session changed");
 };
 return {read,verify,check,set:(value:MessageScope|null)=>{current=value;},calls:()=>calls};
}
function deferred(){
 let release!:()=>void;
 const promise=new Promise<void>(resolve=>{release=resolve;});
 return {promise,release};
}
test("The starting session is accepted and a refresh of the same session stays valid",async()=>{
 const f=fixture();
 assert.deepEqual(await verifyMessageSession(f.read,f.verify,f.check),A);
 f.set({...A});
 assert.deepEqual(await verifyMessageSession(f.read,f.verify,f.check,A),A);
});
test("An A→B→A login cannot reuse scope A-1",async()=>{
 const f=fixture();
 const old=await verifyMessageSession(f.read,f.verify,f.check);
 f.set(B);
 await assert.rejects(verifyMessageSession(f.read,f.verify,f.check,old));
 f.set(A2);
 await assert.rejects(verifyMessageSession(f.read,f.verify,f.check,old));
 assert.deepEqual(await verifyMessageSession(f.read,f.verify,f.check,A2),A2);
});
test("An expected scope mismatch is rejected before the server user lookup",async()=>{
 const f=fixture(B);
 await assert.rejects(verifyMessageSession(f.read,f.verify,f.check,A));
 assert.equal(f.calls(),0);
});
test("A response for the old account cannot complete after sign-out or account switch",async()=>{
 for(const next of [null,B,A2]){
  const f=fixture();
  const entered=deferred(),resume=deferred();
  const pending=verifyMessageSession(f.read,async()=>{
   entered.release();await resume.promise;return A.owner;
  },f.check,A);
  await entered.promise;
  f.set(next);resume.release();
  await assert.rejects(pending);
 }
});
test("Missing or mismatched verified user fails closed even with a matching local session",async()=>{
 const f=fixture();
 for(const user of [null,B.owner])await assert.rejects(verifyMessageSession(f.read,async()=>user,f.check,A));
 await assert.rejects(verifyMessageSession(f.read,async()=>{throw Error("Auth unavailable");},f.check,A));
 f.set(null);
 await assert.rejects(verifyMessageSession(f.read,f.verify,f.check,A));
});
