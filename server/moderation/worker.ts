import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { SafetyBackend } from "./backend.ts";
import { HttpModerationProvider,HttpVideoProvider } from "./http-providers.ts";
import { record,requiredText,secureUrl,type ModerationResult } from "./contracts.ts";
import { verifyWebhook } from "./webhook.ts";

interface Job {id:string;lease_token:string;kind:string;media:{id:string;kind:string;status:string;storage_path:string;trim_start_ms:number;trim_end_ms:number;provider_asset_id:string;playback_url:string;visibility:string}}
const pause=(ms:number)=>new Promise(resolve=>setTimeout(resolve,ms));

/** Run on a trusted Node 22 host, never in Expo. Missing providers fail closed. */
export async function startSafetyWorker(env:NodeJS.ProcessEnv=process.env){
 const backend=new SafetyBackend(requiredText(env.SUPABASE_URL,"SUPABASE_URL"),requiredText(env.SUPABASE_SERVICE_ROLE_KEY,"service role key",5000));
 const configured=!!(env.MODERATION_PROVIDER_URL&&env.MODERATION_API_KEY&&env.VIDEO_PROVIDER_URL&&env.VIDEO_API_KEY&&env.MODERATION_WEBHOOK_SECRET&&env.MODERATION_CALLBACK_URL);
 const moderation=configured?new HttpModerationProvider(env.MODERATION_PROVIDER_URL!,env.MODERATION_API_KEY!):null;
 const video=configured?new HttpVideoProvider(env.VIDEO_PROVIDER_URL!,env.VIDEO_API_KEY!):null;
 const callback=configured?secureUrl(env.MODERATION_CALLBACK_URL!):"";
 let running=true;let probing=false;
 async function health(){
  if(probing)return;probing=true;
  try {
   if(!moderation||!video){await backend.rpc("jobin_configure_safety",{moderation_ready:false,video_ready:false,live_lease_supported:false,coverage:[]});return;}
   const [m,v]=await Promise.all([moderation.health(),video.health()]);
   await backend.rpc("jobin_configure_safety",{moderation_ready:m.ready,video_ready:v.ready,live_lease_supported:m.liveMonitoring&&v.failClosedLeases,coverage:m.coverage});
  }catch{
   await backend.rpc("jobin_configure_safety",{moderation_ready:false,video_ready:false,live_lease_supported:false,coverage:[]}).catch(()=>{});
  }finally{probing=false;}
 }
 async function result(r:ModerationResult){
  await backend.rpc("jobin_record_moderation_result",{job:r.jobId,event_key:r.eventId,asset:r.assetId,coverage:r.coverage,findings:r.findings,observed_at:r.observedAt});
  const target=record(await backend.rpc("jobin_moderation_target",{job:r.jobId}));
  if(video&&target.kind==="live"){
   const asset=requiredText(target.assetId,"asset ID");
   if(target.status==="live"&&typeof target.leaseUntil==="string"&&Date.parse(target.leaseUntil)>Date.now())await video.renewLiveLease(asset,target.leaseUntil);
   else if(["blocked","held","ended"].includes(String(target.status)))await video.stopLive(asset);
  }
 }
 async function processJob(j:Job){
  if(!moderation||!video)throw new Error("Provider configuration pending");
  const m=j.media;
  if(j.kind==="stop_live"||j.kind==="disable_video"){
   if(j.kind==="stop_live")await video.stopLive(m.provider_asset_id);else await video.disableVideo(m.provider_asset_id);
   await backend.rpc("jobin_finish_media_stop",{job:j.id,token:j.lease_token});return;
  }
  if(j.kind==="publish_video"){
   await video.publishVideo(m.provider_asset_id);
   try {await backend.rpc("jobin_finish_video_publish",{job:j.id,token:j.lease_token});}
   catch(cause){await video.disableVideo(m.provider_asset_id).catch(()=>{});throw cause;}return;
  }
  if(j.kind==="prepare_video"){
   const sourceUrl=await backend.sourceUrl(m.storage_path);
   const prepared=await video.prepareVideo({sourceUrl,startMs:m.trim_start_ms,endMs:m.trim_end_ms,mediaId:m.id});
   try {await backend.rpc("jobin_complete_media_preparation",{job:j.id,token:j.lease_token,asset:prepared.assetId,playback:prepared.playbackUrl,duration_ms:prepared.durationMs});}
   catch(cause){await video.disableVideo(prepared.assetId).catch(()=>{});throw cause;}return;
  }
  if(j.kind==="prepare_live"){
   const prepared=await video.prepareLive({mediaId:m.id,visibility:m.visibility,staging:true,maximumUnsupervisedSeconds:15});
   try {
    const watch=await moderation.watchLive({jobId:j.id,mediaId:m.id,assetId:prepared.assetId,kind:"live",sourceUrl:prepared.playbackUrl,callbackUrl:callback});
    await backend.rpc("jobin_complete_media_preparation",{job:j.id,token:j.lease_token,asset:prepared.assetId,playback:prepared.playbackUrl,publisher_url:prepared.publisherUrl,watch_id:watch.watchId});
   }catch(cause){await video.stopLive(prepared.assetId).catch(()=>{});throw cause;}return;
  }
  if(j.kind==="scan_video"){
   const outcome=await moderation.analyzeVideo({jobId:j.id,mediaId:m.id,assetId:m.provider_asset_id,kind:"video",sourceUrl:secureUrl(m.playback_url),callbackUrl:callback});
   if("pending" in outcome)await backend.rpc("jobin_moderation_job_waiting",{job:j.id,token:j.lease_token,provider_job:outcome.providerJobId});
   else {if(outcome.jobId!==j.id||outcome.assetId!==m.provider_asset_id)throw new Error("Provider returned an unrelated artifact");await result(outcome);}
  }
 }
 const server=createServer(async(req,res)=>{
  if(req.method==="GET"&&req.url==="/health"){res.writeHead(200,{"Content-Type":"application/json"});res.end(JSON.stringify({configured}));return;}
  if(req.method!=="POST"||!["/moderation/webhook","/moderation/review-url"].includes(req.url??"")){res.writeHead(404);res.end();return;}
  const chunks:Buffer[]=[];let size=0;
  try {
   for await(const chunk of req){const bytes=Buffer.isBuffer(chunk)?chunk:Buffer.from(chunk);size+=bytes.length;if(size>65536)throw new Error("Payload too large");chunks.push(bytes);}
   if(req.url==="/moderation/review-url"){
    const authorization=req.headers.authorization;if(!authorization?.startsWith("Bearer ")||!video)throw new Error("Moderator service unavailable");
    const body=record(JSON.parse(Buffer.concat(chunks).toString("utf8")));
    const artifact=record(await backend.reviewerArtifact(requiredText(body.media,"media ID",36),authorization.slice(7)));
    const url=await video.reviewUrl(requiredText(artifact.assetId,"asset ID"),120);
    res.writeHead(200,{"Content-Type":"application/json","Cache-Control":"no-store"});res.end(JSON.stringify({url}));return;
   }
   const timestamp=req.headers["x-jobin-timestamp"];const signature=req.headers["x-jobin-signature"];
   const parsed=verifyWebhook(Buffer.concat(chunks),typeof timestamp==="string"?timestamp:undefined,typeof signature==="string"?signature:undefined,env.MODERATION_WEBHOOK_SECRET??"");
   await result(parsed);res.writeHead(204);res.end();
  }catch{res.writeHead(400);res.end("Webhook rejected; do not treat this response as approval.");}
 });
 const port=Number(env.SAFETY_WORKER_PORT??3001);
 if(!Number.isInteger(port)||port<1||port>65535)throw new Error("Invalid worker port");
 await new Promise<void>(resolve=>{server.listen(port,resolve);});
 await health();
 const healthTimer=setInterval(()=>{void health();},5000);
 const stop=()=>{running=false;clearInterval(healthTimer);server.close();};
 process.once("SIGTERM",stop);process.once("SIGINT",stop);
 while(running){
  try {
   await backend.rpc("jobin_expire_live_leases");
   const payload=await backend.rpc("jobin_claim_moderation_jobs");
   if(!Array.isArray(payload))throw new Error("Invalid job response");
   await Promise.all(payload.map(async raw=>{
    const j=raw as Job;
    try{await processJob(j);}
    catch(cause){await backend.rpc("jobin_moderation_job_failed",{job:j.id,token:j.lease_token,reason:cause instanceof Error?cause.message:"Provider failure"}).catch(()=>{});}
   }));
  }catch{ /* Connectivity failure does not publish or renew any live lease. */ }
  await pause(1000);
 }
 await backend.rpc("jobin_configure_safety",{moderation_ready:false,video_ready:false,live_lease_supported:false,coverage:[]}).catch(()=>{});
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1]){
 void startSafetyWorker().catch(()=>{process.stderr.write("Safety worker could not start. Check server-only configuration.\n");process.exitCode=1;});
}
