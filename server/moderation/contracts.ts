export const SAFETY_CATEGORIES = ["nudity","sexual_content","minors","blood","violence"] as const;
export type SafetyCategory=typeof SAFETY_CATEGORIES[number];
export interface Finding { category:SafetyCategory; confidence:number }
export interface ModerationResult { jobId:string;eventId:string;assetId:string;coverage:SafetyCategory[];findings:Finding[];observedAt:string }
export interface ModerationInput { jobId:string;mediaId:string;assetId:string;kind:"live"|"video";sourceUrl:string;callbackUrl:string }
export interface ModerationHealth { ready:boolean;coverage:SafetyCategory[];liveMonitoring:boolean }
export interface PreparedVideo { assetId:string;playbackUrl:string;durationMs:number }
export interface PreparedLive { assetId:string;playbackUrl:string;publisherUrl:string }
export interface ModerationProvider {
 health():Promise<ModerationHealth>;
 analyzeVideo(input:ModerationInput):Promise<ModerationResult|{pending:true;providerJobId:string}>;
 watchLive(input:ModerationInput):Promise<{watchId:string}>;
}
export interface VideoProvider {
 health():Promise<{ready:boolean;failClosedLeases:boolean}>;
 prepareVideo(input:{sourceUrl:string;startMs:number;endMs:number;mediaId:string}):Promise<PreparedVideo>;
 prepareLive(input:{mediaId:string;visibility:string;staging:true;maximumUnsupervisedSeconds:15}):Promise<PreparedLive>;
 renewLiveLease(assetId:string,expiresAt:string):Promise<void>;
 stopLive(assetId:string):Promise<void>;
 publishVideo(assetId:string):Promise<void>;
 disableVideo(assetId:string):Promise<void>;
}
export function record(value:unknown):Record<string,unknown>{
 if(!value||typeof value!=="object"||Array.isArray(value))throw new Error("Expected an object");
 return value as Record<string,unknown>;
}
export function requiredText(value:unknown,label:string,max=500):string {
 if(typeof value!=="string"||!value.trim()||value.length>max)throw new Error("Invalid "+label);
 return value;
}
export function secureUrl(value:unknown,label="provider URL"):string {
 const text=requiredText(value,label,4000);const url=new URL(text);
 if(url.protocol!=="https:"||url.username||url.password)throw new Error(label+" must use HTTPS without embedded credentials");
 return text;
}
export function parseCoverage(value:unknown):SafetyCategory[] {
 if(!Array.isArray(value)||value.length!==5||new Set(value).size!==5||!SAFETY_CATEGORIES.every(category=>value.includes(category)))throw new Error("All five categories must be evaluated");
 return [...value] as SafetyCategory[];
}
export function parseModerationResult(value:unknown):ModerationResult {
 const r=record(value);
 if(r.status!=="complete")throw new Error("An incomplete analysis cannot be treated as clean");
 const jobId=requiredText(r.jobId,"job ID",36);
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(jobId))throw new Error("Invalid job ID");
 const coverage=parseCoverage(r.coverage);
 if(!Array.isArray(r.findings)||r.findings.length>5)throw new Error("Invalid findings");
 const findings=r.findings.map(value=>{
  const f=record(value);
  if(!SAFETY_CATEGORIES.includes(f.category as SafetyCategory)||typeof f.confidence!=="number"||!Number.isFinite(f.confidence)||f.confidence<0||f.confidence>1)throw new Error("Invalid category or confidence");
  return {category:f.category as SafetyCategory,confidence:f.confidence};
 });
 if(new Set(findings.map(f=>f.category)).size!==findings.length)throw new Error("Duplicate category");
 const observedAt=requiredText(r.observedAt,"observation time",50);
 if(!Number.isFinite(Date.parse(observedAt)))throw new Error("Invalid observation time");
 return {jobId,eventId:requiredText(r.eventId,"event ID",200),assetId:requiredText(r.assetId,"asset ID"),coverage,findings,observedAt};
}
