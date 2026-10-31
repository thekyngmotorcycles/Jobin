import { parseCoverage,parseModerationResult,record,requiredText,secureUrl,type ModerationInput,type ModerationProvider,type VideoProvider,type PreparedVideo,type PreparedLive } from "./contracts.ts";
type Fetcher=typeof fetch;
/** Adapter contract only. Configure a real vendor bridge; this class never invents findings. */
class HttpProvider {
 constructor(readonly base:string,private readonly key:string,private readonly request:Fetcher=fetch){secureUrl(base);}
 async call(path:string,body?:unknown):Promise<unknown>{
  const response=await this.request(this.base.replace(/\/$/,"")+path,{method:body===undefined?"GET":"POST",headers:{"Authorization":"Bearer "+this.key,"Content-Type":"application/json"},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(30000)});
  if(!response.ok)throw new Error("Provider request failed ("+response.status+")");
  if(response.status===204)return {};
  return response.json();
 }
}
export class HttpModerationProvider extends HttpProvider implements ModerationProvider {
 async health(){const r=record(await this.call("/health"));return {ready:r.ready===true,coverage:parseCoverage(r.coverage),liveMonitoring:r.liveMonitoring===true};}
 async analyzeVideo(input:ModerationInput){
  const result=record(await this.call("/video/analyze",input));
  if(result.status==="pending")return {pending:true as const,providerJobId:requiredText(result.providerJobId,"provider job ID")};
  return parseModerationResult(result);
 }
 async watchLive(input:ModerationInput){const r=record(await this.call("/live/watch",input));return {watchId:requiredText(r.watchId,"watch ID")};}
}
export class HttpVideoProvider extends HttpProvider implements VideoProvider {
 async health(){const r=record(await this.call("/health"));return {ready:r.ready===true,failClosedLeases:r.failClosedLeases===true};}
 async prepareVideo(input:{sourceUrl:string;startMs:number;endMs:number;mediaId:string}):Promise<PreparedVideo>{
  const r=record(await this.call("/video/prepare",input));
  if(typeof r.durationMs!=="number"||!Number.isInteger(r.durationMs)||r.durationMs<1||r.durationMs>180000)throw new Error("Processed video exceeds the permitted duration or is not measured");
  return {assetId:requiredText(r.assetId,"asset ID"),playbackUrl:secureUrl(r.playbackUrl),durationMs:r.durationMs};
 }
 async prepareLive(input:{mediaId:string;visibility:string;staging:true;maximumUnsupervisedSeconds:15}):Promise<PreparedLive>{
  const r=record(await this.call("/live/prepare",input));
  return {assetId:requiredText(r.assetId,"asset ID"),playbackUrl:secureUrl(r.playbackUrl),publisherUrl:secureUrl(r.publisherUrl)};
 }
 async renewLiveLease(assetId:string,expiresAt:string){await this.call("/live/lease",{assetId,expiresAt});}
 async stopLive(assetId:string){await this.call("/live/stop",{assetId});}
 async reviewUrl(assetId:string,expiresIn:number){const r=record(await this.call("/media/review-url",{assetId,expiresIn}));return secureUrl(r.url);}
 async publishVideo(assetId:string){await this.call("/video/publish",{assetId});}
 async disableVideo(assetId:string){await this.call("/video/disable",{assetId});}
}
