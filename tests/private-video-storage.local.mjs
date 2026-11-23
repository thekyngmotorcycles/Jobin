/** Standalone synthetic integration. Use a disposable Supabase stack on loopback. */
import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {createPrivateVideoGateway} from "../server/moderation/private-video-gateway.ts";
import {createPrivateVideoTransfer,VIDEO_CHUNK_BYTES} from "../src/lib/private-video-transfer.ts";
import {createPrivateVideoTus} from "../src/lib/private-video-tus.ts";

const {PILOT_AUTH,PILOT_STORAGE,PILOT_REST,PILOT_ANON_KEY,PILOT_SERVICE_KEY}=process.env;
for(const origin of [PILOT_AUTH,PILOT_STORAGE,PILOT_REST]){
 const url=new URL(origin);
 assert.equal(url.hostname,"127.0.0.1");
 assert.equal(url.pathname,"/");
}
assert.ok(PILOT_ANON_KEY&&PILOT_SERVICE_KEY);
const publicOrigin="https://sec03-isolated.example";
const root="/v1/private-video-uploads",protocol="jobeen-private-tus-v1";
const submit={title:"Video sintético",profession:"electricista",activity:"work",consent:true,start_ms:0,end_ms:1_000};
const mime="video/mp4",size=VIDEO_CHUNK_BYTES+7;

const gateway=createPrivateVideoGateway({
 publicOrigin,authUserUrl:PILOT_AUTH+"/auth/v1/user",
 ticketRpcUrl:PILOT_REST+"/rest/v1/rpc/jobin_private_video_gateway",
 storageTusUrl:PILOT_STORAGE+"/upload/resumable",publishableKey:PILOT_ANON_KEY,serviceKey:PILOT_SERVICE_KEY,
},async(url,init)=>{
 const target=new URL(typeof url==="string"?url:url.url??url.href);
 if(target.origin===PILOT_AUTH)target.pathname=target.pathname.replace(/^\/auth\/v1/,"");
 if(target.origin===PILOT_REST)target.pathname=target.pathname.replace(/^\/rest\/v1/,"");
 assert.ok([PILOT_AUTH,PILOT_REST,PILOT_STORAGE].includes(target.origin));
 return fetch(target,init);
});

async function provision(){
 const email=randomUUID()+"@example.com",password=randomUUID();
 const response=await fetch(PILOT_AUTH+"/admin/users",{method:"POST",headers:{
  Authorization:"Bearer "+PILOT_SERVICE_KEY,"Content-Type":"application/json",
 },body:JSON.stringify({email,password,email_confirm:true,user_metadata:{
  display_name:"SEC-03 fixture",account_type:"personal",profession_code:"electricista",
 }})});
 assert.equal(response.status,200,"fixture identity created");
 return {email,password};
}
async function login(credentials){
 const response=await fetch(PILOT_AUTH+"/token?grant_type=password",{method:"POST",
  headers:{"Content-Type":"application/json"},body:JSON.stringify(credentials)});
 assert.equal(response.status,200,"fixture authenticated");
 return response.json();
}
function source(){
 const reads=[];
 return {size,mime,reads,async read(offset,length){
  reads.push([offset,length]);
  return new Uint8Array(length);
 }};
}
function scopeOf(user){
 const session=JSON.parse(Buffer.from(user.access_token.split(".")[1],"base64url").toString()).session_id;
 return {owner:user.user.id,session:"jobeen.session.started.v3."+user.user.id+"."+session};
}
function send(user,path,method,body,headers={}){
 return gateway(new Request(publicOrigin+path,{method,body,headers:{
  Authorization:"Bearer "+user.access_token,"Jobeen-Video-Protocol":protocol,...headers,
 }}));
}
async function allocate(user){
 const allocated=await send(user,root,"POST",JSON.stringify({kind:"work-video",size,mime}));
 assert.equal(allocated.status,201,"ticket allocated");
 return allocated.headers.get("Jobeen-Upload-Id");
}
const aLogin=await provision();
const [a,a2,b]=await Promise.all([login(aLogin),login(aLogin),provision().then(login)]);
const scope=scopeOf(a),selected=source();
let ticketId;
const channel=createPrivateVideoTus({
 origin:publicOrigin,scope,source:selected,submission:submit,
 async authorize(actual){assert.deepEqual(actual,scope);return a.access_token;},
 async request(url,init){
  const response=await gateway(new Request(url,init));
  ticketId=response.headers.get("Jobeen-Upload-Id")??ticketId;
  return response;
 },
});
const transfer=createPrivateVideoTransfer(selected,scope,channel.transport,async actual=>assert.deepEqual(actual,scope),channel.allocate);
const uploaded=await transfer.transfer();
assert.deepEqual(selected.reads,[[0,VIDEO_CHUNK_BYTES],[VIDEO_CHUNK_BYTES,7]]);
assert.equal(uploaded.path,scope.owner+"/"+ticketId+".mp4");
const receipt=channel.receipt();
assert.ok(receipt);
const confirmations=await Promise.all([1,2].map(()=>send(a,root+"/"+ticketId+"/complete","POST",JSON.stringify(submit))));
for(const verified of confirmations){
 assert.equal(verified.status,200,"confirmation is replay safe");
 assert.equal(verified.headers.get("Jobeen-Media-Id"),receipt);
}
const changed=await send(a,root+"/"+ticketId+"/complete","POST",JSON.stringify({...submit,title:"metadata changed"}));
assert.equal(changed.status,403,"confirmation does not accept changed metadata");

for(const user of [a2,b]){
 const response=await send(user,root+"/"+ticketId+"/tus","HEAD",undefined,{"Tus-Resumable":"1.0.0"});
 assert.equal(response.status,403,"ticket denied to another identity or session");
 const finalize=await send(user,root+"/"+ticketId+"/complete","POST",JSON.stringify(submit));
 assert.equal(finalize.status,403,"finalization denied to another identity or session");
}
for(const user of [a,b]){
 const direct=await fetch(PILOT_STORAGE+"/object/authenticated/video-originals/"+uploaded.path,
  {headers:{Authorization:"Bearer "+user.access_token}});
 assert.ok(direct.status>=400&&direct.status<500,"raw Storage originals remain private");
 const sign=await fetch(PILOT_STORAGE+"/object/sign/video-originals/"+uploaded.path,{method:"POST",
  headers:{Authorization:"Bearer "+user.access_token,"Content-Type":"application/json"},
  body:JSON.stringify({expiresIn:60}),
 });
 assert.ok(sign.status>=400&&sign.status<500,"actor cannot issue an alternate signed original link");
}
const oldRpc=await fetch(PILOT_REST+"/rpc/jobin_submit_work_video",{method:"POST",headers:{
 Authorization:"Bearer "+a.access_token,"Content-Type":"application/json",
},body:JSON.stringify({...submit,path:uploaded.path})});
assert.ok(oldRpc.status>=400&&oldRpc.status<500,"legacy upload submission cannot bypass gateway");

const pending=await allocate(a),pendingPath=root+"/"+pending+"/tus",tus={"Tus-Resumable":"1.0.0"};
assert.equal((await send(a,pendingPath,"POST",undefined,{...tus,"Upload-Length":String(size)})).status,201);
assert.equal((await send(a,root+"/"+pending+"/complete","POST",JSON.stringify(submit))).status,403,
 "incomplete upload cannot enter moderation");
assert.equal((await send(a,pendingPath,"DELETE",undefined,tus)).status,204,"cancel the unconfirmed ticket");
assert.equal((await send(a,pendingPath,"HEAD",undefined,tus)).status,403,"cancel invalidates the ticket");

const revoked=await allocate(a);
assert.equal((await fetch(PILOT_AUTH+"/logout?scope=local",{
 method:"POST",headers:{Authorization:"Bearer "+a.access_token},
})).status,204);
assert.equal((await send(a,root+"/"+revoked+"/tus","POST",undefined,{
 ...tus,"Upload-Length":String(size),
})).status,403,"the issued JWT cannot reopen the ticket after logout");
console.log("PASS SEC-03 isolated GoTrue/PostgREST/Storage TUS, scoped transfer, idempotent moderation, cancellation and revocation.");
