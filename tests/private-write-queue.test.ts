import assert from "node:assert/strict";
import test from "node:test";
import {serializePrivateWrite} from "../src/lib/private-write-queue.ts";
test("same owner writes serialize while other owner is independent",async()=>{
 const seen:string[]=[];let release!:()=>void;
 const gate=new Promise<void>(resolve=>{release=resolve;});
 const a=serializePrivateWrite("A",async()=>{seen.push("A1");await gate;seen.push("A1 finished");});
 const b=serializePrivateWrite("A",async()=>{seen.push("A2");});
 await serializePrivateWrite("B",async()=>{seen.push("B");});
 assert.deepEqual(seen,["A1","B"]);release();await Promise.all([a,b]);
 assert.deepEqual(seen,["A1","B","A1 finished","A2"]);
});
test("rejected stale operation does not poison a subsequent write",async()=>{
 await assert.rejects(serializePrivateWrite("A",async()=>{throw Error("session changed");}));
 assert.equal(await serializePrivateWrite("A",async()=>42),42);
});
