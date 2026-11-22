import test from "node:test";
import assert from "node:assert/strict";
import {createPrivateVideoTransfer,VIDEO_CHUNK_BYTES,VIDEO_MAX_BYTES,type PrivateVideoTransport,type SelectedVideoSource} from "../src/lib/private-video-transfer.ts";
const a={owner:"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",session:"jobeen.session.started.v3.aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.a"};
const b={owner:"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",session:"jobeen.session.started.v3.bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb.b"};
const id="dddddddd-dddd-4ddd-8ddd-dddddddddddd";
function fixture(size=VIDEO_CHUNK_BYTES*2+11){
 let current=a,offset=0,created=0,confirmed=0,fail=false;
 const reads:number[][]=[],writes:number[][]=[];
 const source:SelectedVideoSource={size,mime:"video/mp4",async read(start,length){reads.push([start,length]);return new Uint8Array(length).fill(7)}};
 const transport:PrivateVideoTransport={
  async create(req,scope){
   assert.deepEqual(scope,a);assert.equal(req.bucket,"video-originals");assert.equal(req.path,a.owner+"/"+id+".mp4");assert.equal(req.upsert,false);assert.equal(req.cacheControl,"0");created++;return "fixture-handle";
  },
  async offset(handle,scope){assert.equal(handle,"fixture-handle");assert.deepEqual(scope,a);return offset},
  async append(handle,start,bytes,scope){
   assert.equal(handle,"fixture-handle");assert.deepEqual(scope,a);assert.equal(start,offset);assert.ok(bytes.every(v=>v===7));
   writes.push([start,bytes.length]);offset+=bytes.length;
   if(fail){fail=false;throw Error("simulated lost response")}
   return offset;
  },
  async confirm(handle,req,scope){assert.equal(handle,"fixture-handle");assert.equal(offset,req.size);assert.deepEqual(scope,a);confirmed++}
 };
 const verify=async(scope:typeof a)=>{assert.deepEqual(scope,current)};
 const create=()=>createPrivateVideoTransfer(source,a,transport,verify,async()=>id);
 return {source,transport,reads,writes,create,switchTo(s:typeof a){current=s},failResponse(){fail=true},setOffset(n:number){offset=n},counts(){return {created,confirmed}}};
}
test("private upload retains one bounded chunk and confirms total before returning",async()=>{
 const f=fixture(),v=f.create();
 assert.deepEqual(await v.transfer(),{owner:a.owner,path:a.owner+"/"+id+".mp4",size:f.source.size,mime:"video/mp4"});
 assert.deepEqual(f.reads,[[0,VIDEO_CHUNK_BYTES],[VIDEO_CHUNK_BYTES,VIDEO_CHUNK_BYTES],[VIDEO_CHUNK_BYTES*2,11]]);
 assert.deepEqual(f.writes,f.reads);assert.deepEqual(f.counts(),{created:1,confirmed:1});
 await assert.rejects(v.transfer());
});
test("lost response resumes with server offset, no duplicate chunk and no new ticket",async()=>{
 const f=fixture(),v=f.create();f.failResponse();
 await assert.rejects(v.transfer(),/transferencia privada/);
 assert.equal(f.counts().confirmed,0);
 await v.transfer();assert.deepEqual(f.writes,[[0,VIDEO_CHUNK_BYTES],[VIDEO_CHUNK_BYTES,VIDEO_CHUNK_BYTES],[VIDEO_CHUNK_BYTES*2,11]]);
 assert.deepEqual(f.counts(),{created:1,confirmed:1});
});
test("session switch during source read denies sending; no other account can resume",async()=>{
 const f=fixture(),v=f.create(),read=f.source.read;
 f.source.read=async(...args)=>{const bytes=await read(...args);f.switchTo(b);return bytes};
 await assert.rejects(v.transfer());assert.equal(f.writes.length,0);assert.equal(f.counts().confirmed,0);
 await assert.rejects(v.transfer());assert.equal(f.writes.length,0);
});
test("cancellation during append never confirms, and concurrent transfer is rejected",async()=>{
 const f=fixture(),v=f.create(),append=f.transport.append;
 f.transport.append=async(...args)=>{const result=await append(...args);v.stop();return result};
 const running=v.transfer();await assert.rejects(v.transfer());
 await assert.rejects(running);assert.equal(f.writes.length,1);assert.equal(f.counts().confirmed,0);
 await assert.rejects(v.transfer());
});
test("unexpected partial or out-of-range offsets and oversized sources fail closed",async()=>{
 for(const offset of [-1,1,VIDEO_CHUNK_BYTES*4,NaN]){
  const f=fixture();f.setOffset(offset);await assert.rejects(f.create().transfer());assert.equal(f.reads.length,0);
 }
 assert.throws(()=>fixture(VIDEO_MAX_BYTES+1).create(),/Video no admitido/);
});
