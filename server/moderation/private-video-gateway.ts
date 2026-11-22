import {VIDEO_CHUNK_BYTES} from "../../src/lib/private-video-transfer.ts";

const protocol="jobeen-private-tus-v1",tusVersion="1.0.0";
const root="/v1/private-video-uploads";
const uuid=/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/;
const uploadId=/^[A-Za-z0-9_-]{1,320}$/;

type Actor={owner:string;session:string};
type Action="allocate"|"read"|"bind"|"cancel"|"complete";
type Ticket={id:string;path:string;size:number;mime:string;upstream:string|null;media:string|null};
type Config={
 publicOrigin:string;authUserUrl:string;ticketRpcUrl:string;storageTusUrl:string;
 publishableKey:string;serviceKey:string;
};
class Rejected extends Error{
 readonly status:number;
 constructor(status:number){super("Private video request denied");this.status=status;}
}

function serviceUrl(value:string,path:string){
 const url=new URL(value);
 if((url.protocol!=="https:"&&!(url.protocol==="http:"&&url.hostname==="127.0.0.1"))||
  url.username||url.password||url.search||url.hash||url.pathname!==path)throw Error("Invalid private video service URL");
 return url.href;
}

async function readBounded(request:Request,limit:number,exact=false){
 const rawLength=request.headers.get("Content-Length");
 if(rawLength!==null){
  const length=Number(rawLength);
  if(!/^\d+$/.test(rawLength)||!Number.isSafeInteger(length)||length>limit||(exact&&length!==limit))throw new Rejected(400);
 }
 if(!request.body)throw new Rejected(400);
 const reader=request.body.getReader();
 const output=new Uint8Array(limit);
 let offset=0;
 try{
  for (;;) {
   const {value,done}=await reader.read();
   if(done)break;
   if(offset+value.length>limit)throw new Rejected(413);
   output.set(value,offset);
   offset+=value.length;
  }
  if(exact&&offset!==limit)throw new Rejected(400);
  return output.subarray(0,offset);
 }catch(error){
  output.fill(0);
  await reader.cancel().catch(()=>{});
  throw error;
 }finally{reader.releaseLock();}
}

async function submissionBody(request:Request):Promise<unknown>{
 try{return JSON.parse(new TextDecoder().decode(await readBounded(request,4096)));}
 catch(error){throw error instanceof Rejected?error:new Rejected(400);}
}

/**
 * Stage only on an isolated backend with a private upstream origin and the
 * matching SQL. The framework must honor TLS, CORS and the request abort signal.
 */
export function createPrivateVideoGateway(config:Config,fetcher:typeof fetch=fetch){
 const publicOrigin=new URL(serviceUrl(config.publicOrigin,"/")).origin;
 const authUrl=serviceUrl(config.authUserUrl,"/auth/v1/user");
 const rpcUrl=serviceUrl(config.ticketRpcUrl,"/rest/v1/rpc/jobin_private_video_gateway");
 const storagePath=new URL(config.storageTusUrl).pathname;
 if(!["/storage/v1/upload/resumable","/upload/resumable"].includes(storagePath))throw Error("Invalid private Storage path");
 const storageUrl=serviceUrl(config.storageTusUrl,storagePath);
 if(!config.publishableKey||!config.serviceKey)throw Error("Private video configuration unavailable");

 function respond(status:number,headers:Record<string,string>={}){
  return new Response(null,{status,headers:{
   "Cache-Control":"private, no-store","Jobeen-Video-Protocol":protocol,"Tus-Resumable":tusVersion,...headers,
  }});
 }
 function request(url:string,init:RequestInit,signal:AbortSignal){
  return fetcher(url,{...init,signal:AbortSignal.any([signal,AbortSignal.timeout(30_000)]),
   redirect:"error",credentials:"omit",cache:"no-store"});
 }
 async function actor(input:Request):Promise<Actor>{
  const bearer=input.headers.get("Authorization");
  if(!bearer?.startsWith("Bearer ")||bearer.length>8192)throw new Rejected(403);
  const checked=await request(authUrl,{headers:{Authorization:bearer,apikey:config.publishableKey}},input.signal);
  if(!checked.ok)throw new Rejected(403);
  const user=await checked.json();
  const claims=JSON.parse(Buffer.from(bearer.slice(7).split(".")[1],"base64url").toString());
  if(!uuid.test(user.id)||user.id!==claims.sub||claims.role!=="authenticated"||!uuid.test(claims.session_id)||
   user.is_anonymous===true||claims.is_anonymous===true)throw new Rejected(403);
  return {owner:user.id,session:claims.session_id};
 }
 async function ticket(input:Request,who:Actor,action:Action,id?:string,value?:unknown):Promise<Ticket>{
  const response=await request(rpcUrl,{method:"POST",headers:{
   Authorization:"Bearer "+config.serviceKey,apikey:config.serviceKey,"Content-Type":"application/json",
  },body:JSON.stringify({p_actor:who.owner,p_session:who.session,p_action:action,p_ticket:id,p_value:value})},input.signal);
  if(!response.ok){
   const {code}=await response.json().catch(()=>({}));
   throw new Rejected(code==="42501"?403:response.status>=500?503:409);
  }
  return response.json();
 }
 function storage(input:Request,method:string,id?:string,headers:Record<string,string>={},body?:BodyInit){
  return request(storageUrl+(id?"/"+id:""),{method,headers:{
   Authorization:"Bearer "+config.serviceKey,apikey:config.serviceKey,"Tus-Resumable":tusVersion,...headers,
  },body},input.signal);
 }

 return async function handle(input:Request){
  try{
   const url=new URL(input.url);
   if(url.origin!==publicOrigin||url.search||input.headers.get("Jobeen-Video-Protocol")!==protocol)return respond(404);
   const parts=url.pathname.slice(root.length+1).split("/");
   const method=input.method;
   const allocation=method==="POST"&&url.pathname===root;
   const transfer=url.pathname.startsWith(root+"/")&&parts.length===2&&uuid.test(parts[0]);
   const tus=transfer&&parts[1]==="tus"&&["POST","HEAD","PATCH"].includes(method);
   const complete=transfer&&parts[1]==="complete"&&method==="POST";
   const cancel=transfer&&parts[1]==="tus"&&method==="DELETE";
   if(!allocation&&!tus&&!complete&&!cancel)return respond(404);
   const who=await actor(input);
   if(allocation){
    const issued=await ticket(input,who,"allocate",undefined,await submissionBody(input));
    return respond(201,{"Jobeen-Upload-Id":issued.id});
   }
   const id=parts[0];
   if(complete){
    const receipt=await ticket(input,who,"complete",id,await submissionBody(input));
    if(!receipt.media)return respond(409);
    return respond(200,{"Jobeen-Media-Id":receipt.media,"Jobeen-Confirmed-Path":receipt.path,
     "Jobeen-Confirmed-Length":String(receipt.size),"Jobeen-Confirmed-Type":receipt.mime});
   }
   if(input.headers.get("Tus-Resumable")!==tusVersion)return respond(412);
   if(cancel){await ticket(input,who,"cancel",id);return respond(204);}
   const current=await ticket(input,who,"read",id);
   if(method==="POST"){
    if(input.headers.get("Upload-Length")!==String(current.size))return respond(400);
    if(!current.upstream){
     const metadata=Object.entries({
      bucketName:"video-originals",objectName:current.path,contentType:current.mime,cacheControl:"0",
     }).map(([key,value])=>key+" "+Buffer.from(value).toString("base64")).join(",");
     const created=await storage(input,"POST",undefined,{"Upload-Metadata":metadata,"Upload-Length":String(current.size)});
     const raw=created.headers.get("Location");
     if(created.status!==201||!raw)return respond(503);
     const location=new URL(raw,storageUrl);
     const upstream=location.pathname.slice(storagePath.length+1);
     if(location.origin!==new URL(storageUrl).origin||location.search||location.hash||
      !location.pathname.startsWith(storagePath+"/")||!uploadId.test(upstream))return respond(503);
     await ticket(input,who,"bind",id,{upstream});
    }
    return respond(201,{Location:publicOrigin+root+"/"+id+"/tus"});
   }
   if(!current.upstream||!uploadId.test(current.upstream))return respond(404);
   if(method==="HEAD"){
    if(current.media)return respond(200,{"Upload-Offset":String(current.size)});
    const result=await storage(input,"HEAD",current.upstream);
    const offset=result.headers.get("Upload-Offset");
    if(!result.ok||!offset)return respond(503);
    return respond(200,{"Upload-Offset":offset});
   }
   const offsetHeader=input.headers.get("Upload-Offset")??"";
   const offset=Number(offsetHeader);
   if(current.media||!(/^(0|[1-9][0-9]*)$/.test(offsetHeader))||!Number.isSafeInteger(offset)||
    offset%VIDEO_CHUNK_BYTES!==0||offset>=current.size||
    input.headers.get("Content-Type")!=="application/offset+octet-stream")return respond(409);
   const bytes=await readBounded(input,Math.min(VIDEO_CHUNK_BYTES,current.size-offset),true);
   try{
    // Recheck after body read. A revoked session may leave bytes in quarantine,
    // but cannot admit another operation or finalize them.
    await ticket(input,who,"read",id);
    const result=await storage(input,"PATCH",current.upstream,{
     "Upload-Offset":offsetHeader,"Content-Type":"application/offset+octet-stream",
    },bytes);
    const confirmed=result.headers.get("Upload-Offset");
    if(result.status!==204||!confirmed)return respond(result.status===409?409:503);
    await ticket(input,who,"read",id);
    return respond(204,{"Upload-Offset":confirmed});
   }finally{bytes.fill(0);}
  }catch(error){return respond(error instanceof Rejected?error.status:503);}
 };
}
