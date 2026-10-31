import { secureUrl } from "./contracts.ts";
export type ServiceRpc="jobin_configure_safety"|"jobin_claim_moderation_jobs"|"jobin_moderation_job_failed"|"jobin_complete_media_preparation"|"jobin_record_moderation_result"|"jobin_finish_media_stop"|"jobin_expire_live_leases"|"jobin_moderation_job_waiting"|"jobin_moderation_target"|"jobin_finish_video_publish";
export class SafetyBackend {
 private readonly url:string;private readonly key:string;
 constructor(url:string,key:string){secureUrl(url);if(!key)throw new Error("SUPABASE_SERVICE_ROLE_KEY is required on the worker only");this.url=url;this.key=key;}
 async rpc(name:ServiceRpc,args:Record<string,unknown>={}):Promise<unknown>{
  const response=await fetch(this.url+"/rest/v1/rpc/"+name,{method:"POST",headers:{apikey:this.key,Authorization:"Bearer "+this.key,"Content-Type":"application/json"},body:JSON.stringify(args),signal:AbortSignal.timeout(30000)});
  if(!response.ok){const body=await response.json().catch(()=>({}));throw new Error(typeof body.message==="string"?body.message:"Safety backend request failed");}
  if(response.status===204)return null;return response.json();
 }
 async reviewerArtifact(media:string,jwt:string):Promise<unknown>{
  const response=await fetch(this.url+"/rest/v1/rpc/jobin_moderation_review_artifact",{method:"POST",headers:{apikey:this.key,Authorization:"Bearer "+jwt,"Content-Type":"application/json"},body:JSON.stringify({media}),signal:AbortSignal.timeout(30000)});
  if(!response.ok)throw new Error("Moderator authorization required");return response.json();
 }
 async sourceUrl(path:string):Promise<string>{
  const encoded=path.split("/").map(encodeURIComponent).join("/");
  const response=await fetch(this.url+"/storage/v1/object/sign/video-originals/"+encoded,{method:"POST",headers:{apikey:this.key,Authorization:"Bearer "+this.key,"Content-Type":"application/json"},body:JSON.stringify({expiresIn:300}),signal:AbortSignal.timeout(30000)});
  if(!response.ok)throw new Error("Unable to sign quarantined source");
  const result=await response.json();
  return secureUrl(this.url+"/storage/v1"+result.signedURL,"private source URL");
 }
}
