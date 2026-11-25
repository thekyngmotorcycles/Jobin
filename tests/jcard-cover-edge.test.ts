import assert from "node:assert/strict";
import test from "node:test";
import {createCoverReader} from "../supabase/functions/jcard-cover-read/handler.ts";
const owner="a1000000-1111-4111-8111-111111111111",visitor="b2000000-2222-4222-8222-222222222222";
const selected=owner+"/cover-1795600000000-abc123.jpg";
const jpeg=new Uint8Array([255,216,255,224,255,217]);
const env={url:"https://pilot.example/",publishable:"publishable-test",service:"service-test"};
const bearer="Bearer header.payload.signature";
function scenario(){
 let path:string|null=selected,denyAfterDownload=false,validUser=true,bytes=jpeg,fetches=0;
 const requests:string[]=[];
 const send:typeof fetch=async(input,init)=>{
  const req=new Request(input,init),url=new URL(req.url);
  requests.push(url.pathname);
  assert.equal(url.origin,"https://pilot.example");assert.equal(req.headers.get("Cache-Control"),"no-store");
  assert.equal(req.redirect,"error");
  if(url.pathname==="/auth/v1/user"){
   assert.equal(req.headers.get("Authorization"),bearer);
   return validUser?Response.json({id:visitor}):Response.json({}, {status:401});
  }
  if(url.pathname==="/rest/v1/rpc/jobeen_current_jcard_cover"){
   assert.equal(req.method,"POST");assert.deepEqual(await req.json(),{target:owner});
   assert.equal(req.headers.get("apikey"),env.publishable);
   assert.equal(req.headers.get("Authorization"),bearer);
   return Response.json(path);
  }
  assert.equal(url.pathname,"/storage/v1/object/authenticated/jobeen-jcard-covers/"+selected);
  assert.ok(url.searchParams.get("cacheNonce"));assert.equal(req.headers.get("Authorization"),"Bearer "+env.service);
  fetches++;
  if(denyAfterDownload)path=null;
  return new Response(bytes);
 };
 const handler=createCoverReader(env,send);
 const request=(authorization=bearer,target=owner,extra={})=>handler(new Request("https://pilot.example/functions/v1/jcard-cover-read",{method:"POST",headers:{Authorization:authorization},body:JSON.stringify({target,...extra})}));
 return {request,requests,setPath:(p:string|null)=>{path=p;},denyDuringDownload:()=>{denyAfterDownload=true;},invalidAuth:()=>{validUser=false;},setBytes:(b:Uint8Array<ArrayBuffer>)=>{bytes=b;},count:()=>fetches};
}
test("Cover Edge reads only RLS-selected bytes, disables shared caching, and rechecks each request",async()=>{
 const s=scenario(),first=await s.request();
 assert.equal(first.status,200);assert.match(first.headers.get("Cache-Control")??"",/no-store/);
 assert.equal(first.headers.get("CDN-Cache-Control"),"no-store");assert.equal(first.headers.get("Cloudflare-CDN-Cache-Control"),"no-store");
 assert.deepEqual(await first.json(),{path:selected,url:"data:image/jpeg;base64,"+Buffer.from(jpeg).toString("base64")});
 assert.equal(s.requests.filter(p=>p.includes("/rpc/")).length,2);
 s.setPath(null);const blocked=await s.request();
 assert.equal(blocked.status,404);assert.equal(s.count(),1);
 assert.match(blocked.headers.get("Cache-Control")??"",/no-store/);
});
test("Cover Edge denies anonymous, invalid auth, caller paths and a concurrent withdrawal",async()=>{
 const s=scenario();assert.equal((await s.request("")).status,401);
 assert.equal((await s.request(bearer,owner,{path:selected})).status,400);
 assert.equal(s.count(),0);s.invalidAuth();assert.equal((await s.request()).status,401);
 const concurrent=scenario();concurrent.denyDuringDownload();assert.equal((await concurrent.request()).status,404);
 const foreign=scenario();foreign.setPath(visitor+"/cover-1795600000000-abc123.jpg");assert.equal((await foreign.request()).status,503);assert.equal(foreign.count(),0);
 const oversized=scenario();oversized.setBytes(new Uint8Array(2*1024*1024+1));assert.equal((await oversized.request()).status,503);
 const malformed=scenario();malformed.setBytes(new Uint8Array([0,1,2]));assert.equal((await malformed.request()).status,503);
});
