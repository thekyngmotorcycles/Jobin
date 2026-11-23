import assert from "node:assert/strict";
import {once} from "node:events";
import {readFileSync} from "node:fs";
import {createServer} from "node:http";
import test from "node:test";
import {selectedBrowserVideo,selectedCachedVideo,type VideoFileHandle} from "../src/lib/private-video-source.ts";
import {createPrivateVideoTransfer,VIDEO_CHUNK_BYTES,type SelectedVideoSource} from "../src/lib/private-video-transfer.ts";
import {createPrivateVideoTus} from "../src/lib/private-video-tus.ts";

const owner="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const scope={owner,session:"jobeen.session.started.v3."+owner+".cccccccc-cccc-4ccc-8ccc-cccccccccccc"};
const ticket="dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const media="eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";
const origin="https://isolated-video.example",root="/v1/private-video-uploads";
const tusPath=root+"/"+ticket+"/tus",protocol="jobeen-private-tus-v1";
const submission={title:"Synthetic video",profession:"fixture",activity:"work",consent:true,start_ms:0,end_ms:1000};
const mime="video/mp4",size=VIDEO_CHUNK_BYTES+7;
const cacheDirectory="file:///application/cache/";
const selectedUri=cacheDirectory+"ImagePicker/fixture.mp4";

test("a native picker asset opens and closes a bounded handle per segment",async()=>{
 let modified=1,closed=0;
 const calls:[number|null,number][]=[];
 class File{
  size=size;
  get modificationTime(){return modified;}
  validatePath(){}
  open():VideoFileHandle{return {
   offset:null,
   readBytes(length){calls.push([this.offset,length]);return new Uint8Array(length).fill(9);},
   close(){closed++;},
  };}
 }
 const fs={cacheDirectory,FileSystemFile:File};
 const video=selectedCachedVideo({uri:selectedUri,fileSize:size,mimeType:mime},fs);
 assert.equal((await video.read(0,VIDEO_CHUNK_BYTES)).byteLength,VIDEO_CHUNK_BYTES);
 assert.deepEqual(Array.from(await video.read(VIDEO_CHUNK_BYTES,7)),Array(7).fill(9));
 assert.equal(closed,2);
 assert.deepEqual(calls,[[0,VIDEO_CHUNK_BYTES],[VIDEO_CHUNK_BYTES,7]]);
 await assert.rejects(video.read(0,VIDEO_CHUNK_BYTES+1),/Segmento/);
 await assert.rejects(video.read(size,1),/Segmento/);
 modified++;
 await assert.rejects(video.read(0,50),/cambió/);
 assert.equal(calls.length,2);
 for(const uri of ["file:///outside.mp4",cacheDirectory+"../outside.mp4",
  cacheDirectory+"%2e%2e/outside.mp4","content://recording/1","https://example.invalid/video.mp4"]){
  assert.throws(()=>selectedCachedVideo({uri,mimeType:mime},fs));
 }
 assert.throws(()=>selectedCachedVideo({uri:selectedUri,fileSize:size+1,mimeType:mime},fs));
});

test("web reads only the selected browser Blob slice and refuses restored URI-only assets",async()=>{
 class BlobFixture extends Blob{
  arrayBuffer():Promise<ArrayBuffer>{throw Error("The original Blob must not be materialized.");}
 }
 const file=new BlobFixture([Uint8Array.from([1,2,3,4,5])],{type:mime});
 const source=selectedBrowserVideo({uri:"blob:https://example.invalid/synthetic",file});
 assert.deepEqual(Array.from(await source.read(1,3)),[2,3,4]);
 assert.throws(()=>selectedBrowserVideo({uri:"blob:https://example.invalid/old"}),/seleccionar/);
 assert.throws(()=>selectedBrowserVideo({uri:"https://example.invalid/video",file}),/seleccionar/);
});

async function fixture(){
 let offset=0,files=0,confirmations=0,brokenPatch=true,brokenCommit=false,revoked=false,invalidLocation=false;
 let bearer="fixture-session-a";
 const routes:string[]=[],blocks:[number,number][]=[];
 const server=createServer(async(req,res)=>{
  const headers:Record<string,string>={"Jobeen-Video-Protocol":protocol,"Cache-Control":"no-store","Tus-Resumable":"1.0.0"};
  routes.push(req.method+" "+req.url);
  if(revoked||req.headers.authorization!=="Bearer "+bearer){
   req.resume();res.writeHead(403,headers).end();return;
  }
  let count=0;
  for await(const bytes of req)count+=bytes.length;
  if(req.method==="POST"&&req.url===root){
   res.writeHead(201,{...headers,"Jobeen-Upload-Id":ticket}).end();
  }else if(req.method==="POST"&&req.url===tusPath&&req.headers["upload-length"]===String(size)){
   files++;
   res.writeHead(201,{...headers,Location:invalidLocation?"https://untrusted.example/other":origin+tusPath}).end();
  }else if(req.method==="HEAD"&&req.url===tusPath){
   res.writeHead(200,{...headers,"Upload-Offset":String(offset)}).end();
  }else if(req.method==="PATCH"&&req.url===tusPath&&req.headers["upload-offset"]===String(offset)&&
           count===Math.min(size-offset,VIDEO_CHUNK_BYTES)){
   blocks.push([offset,count]);offset+=count;
   if(brokenPatch){brokenPatch=false;res.destroy();return;}
   res.writeHead(204,{...headers,"Upload-Offset":String(offset)}).end();
  }else if(req.method==="POST"&&req.url===root+"/"+ticket+"/complete"&&offset===size){
   if(!confirmations)confirmations++;
   if(brokenCommit){brokenCommit=false;res.destroy();return;}
   res.writeHead(200,{...headers,"Jobeen-Media-Id":media,"Jobeen-Confirmed-Path":owner+"/"+ticket+".mp4",
    "Jobeen-Confirmed-Type":mime,"Jobeen-Confirmed-Length":String(size)}).end();
  }else res.writeHead(404,headers).end();
 });
 const listening=once(server,"listening");
 server.listen(0,"127.0.0.1");
 await listening;
 const address=server.address();
 if(!address||typeof address==="string")throw Error("Missing loopback server.");
 const base="http://127.0.0.1:"+address.port;
 let selectedSession=scope.session;
 const reads:number[][]=[];
 const source:SelectedVideoSource={size,mime,async read(start:number,length:number){
  reads.push([start,length]);return new Uint8Array(length).fill(12);
 }};
 const channel=createPrivateVideoTus({
  origin,scope,source,submission,async authorize(actor){assert.deepEqual(actor,scope);return bearer;},
  async request(url,init){
   assert.equal(new URL(url).origin,origin);
   assert.equal(init.redirect,"error");
   assert.equal(init.credentials,"omit");
   return fetch(base+new URL(url).pathname,init);
  },
 });
 const controller=createPrivateVideoTransfer(source,scope,channel.transport,async actor=>{
  assert.equal(actor.session,selectedSession);
 },channel.allocate);
 return {channel,controller,reads,blocks,routes,
  disconnectOnComplete(){brokenCommit=true;},
  changeSession(){selectedSession=scope.session+".different";},
  refresh(){bearer="fixture-session-a-refreshed";},
  revoke(){revoked=true;},
  returnUnexpectedLocation(){invalidLocation=true;},
  counts(){return {files,confirmations};},
  close:()=>new Promise<void>(resolve=>server.close(()=>resolve())),
 };
}

test("real HTTP resumes at the confirmed offset after loss and uses the same finalization receipt",async()=>{
 const f=await fixture();
 try{
  await assert.rejects(f.controller.transfer(),/transferencia privada/);
  f.refresh();
  f.disconnectOnComplete();
  await assert.rejects(f.controller.transfer(),/transferencia privada/);
  const result=await f.controller.transfer();
  assert.deepEqual(result,{owner,path:owner+"/"+ticket+".mp4",size,mime});
  assert.equal(f.channel.receipt(),media);
  assert.deepEqual(f.reads,[[0,VIDEO_CHUNK_BYTES],[VIDEO_CHUNK_BYTES,7]]);
  assert.deepEqual(f.blocks,f.reads);
  assert.deepEqual(f.counts(),{files:1,confirmations:1});
  assert.equal(f.routes.filter(route=>route==="HEAD "+tusPath).length,3);
 }finally{await f.close();}
});

test("a replaced or revoked session cannot resume or finalize a partial transfer",async()=>{
 const f=await fixture();
 try{
  await assert.rejects(f.controller.transfer());
  f.revoke();
  await assert.rejects(f.controller.transfer());
  assert.equal(f.reads.length,1);
  assert.equal(f.counts().confirmations,0);
  f.changeSession();
  const requestCount=f.routes.length;
  await assert.rejects(f.controller.transfer());
  assert.equal(f.routes.length,requestCount);
 }finally{await f.close();}
});

test("an unexpected upload Location never receives a credential or a chunk",async()=>{
 const f=await fixture();
 try{
  f.returnUnexpectedLocation();
  await assert.rejects(f.controller.transfer());
  assert.equal(f.reads.length,0);
  assert.deepEqual(f.routes,["POST "+root,"POST "+tusPath]);
  f.controller.stop();
  f.channel.stop();
  await assert.rejects(f.controller.transfer());
  assert.ok(f.routes.slice(2).every(route=>route==="DELETE "+tusPath));
 }finally{await f.close();}
});

test("the professional editor uses the segmented flow and Flash stays local",()=>{
 const editor=readFileSync("src/app/(tabs)/create.tsx","utf8");
 const flash=readFileSync("src/components/FlashComposer.tsx","utf8");
 const integration=readFileSync("src/lib/private-work-video.ts","utf8");
 assert.match(editor,/rememberWorkVideoSelection\(a,scope\)/);
 assert.match(editor,/createWorkVideoUpload\(asset,input,scope\)/);
 assert.doesNotMatch(editor,/uploadWorkVideo\(/);
 assert.match(integration,/!=="1"\|\|!origin/);
 assert.doesNotMatch(integration,/arrayBuffer|createSignedUploadUrl|\.upload\(/);
 assert.match(flash,/No se enviará como un video normal/);
});
