import {uploadSecuredFile} from "./private-attachment-android";
import type {PendingEvidence} from "./private-attachment";
import { requireSupabase } from "./supabase";
import {captureMessageScope,assertMessageScope,type MessageScope} from "./message-session";
import type { Database,Json } from "./database.types";
export interface SafetyIncident {id:string;counter:"content"|"employer";category:string;reason:string;issued_at:string;voided_at:string|null}
export interface SafetyAppeal {id:string;incident_id:string;status:"pending"|"accepted"|"rejected";decision_reason:string|null}
export interface SafetyStatus {
 contentCount:number;employerCount:number;permanent:boolean;accountBlocked:boolean;mediaBlocked:boolean;
 contentUntil:string|null;employerUntil:string|null;reason:string|null;moderator:boolean;providersReady:boolean;incidents:SafetyIncident[];appeals:SafetyAppeal[];
}
export interface WorkMedia {id:string;title:string;kind:"live"|"video";status:string;publisherUrl:string|null;studioReady?:boolean;creator_id:string;employer_id:string|null}
export interface MediaView {id:string;creatorId:string;author:string;title:string;kind:"live"|"video";status:string;employerId:string|null;playbackUrl:string|null}
export interface PublishedMedia {id:string;title:string;kind:"live"|"video";creator_id:string}
export interface SafetyQueue {
 reports:{id:string;company_id:string;accused_id:string;work_media_id:string;description:string;evidence_path:string}[];
 appeals:(SafetyAppeal&{user_id:string;reason:string})[];
 held:{id:string;creator_id:string;title:string;kind:string}[];
}
type F=Database["public"]["Functions"];
type Mutation="jobin_clear_held_media"|"jobin_request_work_live"|"jobin_submit_work_video"|"jobin_end_work_live"|"jobin_report_employer"|"jobin_review_employer_report"|"jobin_appeal_safety"|"jobin_review_safety_appeal"|"jobin_confirm_held_media";
export async function safetyMutation<N extends Mutation>(name:N,args:F[N]["Args"],expectedScope?:MessageScope){
 const scope=await captureMessageScope(expectedScope);
 const {data,error}=await requireSupabase().rpc(name,args);if(error)throw new Error(error.message);await assertMessageScope(scope);return data;
}
function decode<T>(data:Json|null,error:{message:string}|null):T {if(error)throw new Error(error.message);if(data===null)throw new Error("Contenido no disponible.");return data as unknown as T;}
export async function loadSafety(expectedScope?:MessageScope):Promise<SafetyStatus|null>{
 const scope=await captureMessageScope(expectedScope),client=requireSupabase();
 const {data,error}=await client.rpc("jobin_safety_status");await assertMessageScope(scope);return decode<SafetyStatus>(data,error);
}
export async function loadMyMedia(expectedScope?:MessageScope):Promise<WorkMedia[]>{
 const scope=await captureMessageScope(expectedScope),client=requireSupabase();
 const {data,error}=await client.rpc("jobin_my_work_media");await assertMessageScope(scope);
 const media=decode<WorkMedia[]>(data,error);if(media.some(row=>row.creator_id!==scope.owner))throw Error("No se pudo verificar la titularidad del contenido.");return media;
}
function privateHttpsLink(value:unknown):string {
 if(typeof value!=="string"||value.length>4000)throw Error("Enlace privado no disponible.");
 const parsed=new URL(value);
 if(parsed.protocol!=="https:"||parsed.username||parsed.password)throw Error("Enlace privado inválido.");
 return value;
}
export async function loadStudioLink(media:string,expectedScope:MessageScope):Promise<string>{
 const scope=await captureMessageScope(expectedScope);
 const {data,error}=await requireSupabase().rpc("jobin_work_studio_link",{media});
 await assertMessageScope(scope);if(error)throw Error(error.message);
 return privateHttpsLink(data);
}
export async function loadMedia(id:string,expectedScope?:MessageScope):Promise<MediaView>{
 const scope=await captureMessageScope(expectedScope);const {data,error}=await requireSupabase().rpc("jobin_work_media",{media:id});await assertMessageScope(scope);
 const media=decode<MediaView>(data,error);if(media.id!==id)throw Error("Contenido no disponible.");
 if(media.playbackUrl&&!/^https:\/\//i.test(media.playbackUrl))throw Error("Enlace de reproducción inválido.");return media;
}
export async function loadPublishedMedia(expectedScope?:MessageScope):Promise<PublishedMedia[]>{const scope=await captureMessageScope(expectedScope);const {data,error}=await requireSupabase().rpc("jobin_published_work_media");await assertMessageScope(scope);return decode<PublishedMedia[]>(data,error);}
export async function loadSafetyQueue(expectedScope?:MessageScope):Promise<SafetyQueue>{const scope=await captureMessageScope(expectedScope);const {data,error}=await requireSupabase().rpc("jobin_safety_review_queue");await assertMessageScope(scope);return decode<SafetyQueue>(data,error);}
export async function loadTrustMark(worker:string):Promise<{marked:boolean;reason:string|null}>{
 const scope=await captureMessageScope();const {data,error}=await requireSupabase().rpc("jobin_public_trust_mark",{worker});await assertMessageScope(scope);return decode(data,error);
}
export async function uploadWorkVideo(asset:{uri:string;fileSize?:number;mimeType?:string},input:{title:string;profession:string;activity:string;employer?:string;consent:boolean;start_ms:number;end_ms:number},expectedScope?:MessageScope){
 const scope=await captureMessageScope(expectedScope),client=requireSupabase();
 const safety=await loadSafety(scope);if(!safety||safety.mediaBlocked)throw new Error("La publicación está restringida. Consulta tus sanciones.");
 if(asset.fileSize&&asset.fileSize>524288000)throw new Error("El archivo supera 500 MB.");
 const response=await fetch(asset.uri);if(!response.ok)throw new Error("No se pudo leer el video.");
 const mime=asset.mimeType||"video/mp4";const extension=mime==="video/quicktime"?"mov":mime==="video/webm"?"webm":"mp4";
 const bytes=await response.arrayBuffer();if(bytes.byteLength>524288000)throw Error("El archivo supera 500 MB.");
 const path=scope.owner+"/"+Date.now()+"-"+Math.random().toString(36).slice(2)+"."+extension;
 await assertMessageScope(scope);
 const uploaded=await client.storage.from("video-originals").upload(path,bytes,{contentType:mime,upsert:false,cacheControl:"0"});
 if(uploaded.error)throw new Error(uploaded.error.message);
 await assertMessageScope(scope);
 return safetyMutation("jobin_submit_work_video",{...input,path},scope);
}
export async function submitEmployerReport(media:string,description:string,file:PendingEvidence,expectedScope?:MessageScope){
 const scope=await captureMessageScope(expectedScope);
 const path=await uploadSecuredFile(scope,"report-evidence",file,"employer-report-evidence");
 return safetyMutation("jobin_report_employer",{media,path,description},scope);
}
export const WORK_ACTIVITIES=[
 {value:"work",label:"Mi trabajo profesional"},{value:"artist_performance",label:"Trabajando como músico, cantante o DJ"},
 {value:"academy",label:"Actor estudiando en su academia"},{value:"film_set",label:"Actor graduado en una filmación"},
 {value:"consultation",label:"Consulta profesional, sin procedimientos gráficos"},{value:"office_calls",label:"Atendiendo llamadas de mi consultorio"},
 {value:"security_outside",label:"Seguridad, fuera del local"},{value:"interview",label:"Entrevista privada"},
] as const;
export const SAFETY_LABELS:Record<string,string>={nudity:"Desnudos",sexual_content:"Material sexual",minors:"Menores de edad",blood:"Sangre",violence:"Violencia",employer_impersonation:"Suplantación de empleador"};
export function safetyEnd(value:string|null){return value?new Date(value).toLocaleString():"Sin restricción temporal";}

export interface WorkOptions {professions:{code:string;label:string}[];employers:{id:string;name:string;approved:boolean;representative:boolean}[]}
export async function loadWorkOptions(expectedScope?:MessageScope):Promise<WorkOptions|null>{
 const scope=await captureMessageScope(expectedScope),client=requireSupabase();
 const {data,error}=await client.rpc("jobin_work_options");await assertMessageScope(scope);return decode<WorkOptions>(data,error);
}
export async function moderationPreview(media:string,expectedScope?:MessageScope):Promise<string>{
 const scope=await captureMessageScope(expectedScope);
 const base=process.env.EXPO_PUBLIC_SAFETY_API_URL;
 if(!base)throw new Error("El servicio privado de revisión está pendiente de configuración.");
 const client=requireSupabase();const {data:{session}}=await client.auth.getSession();if(!session)throw new Error("Inicia sesión.");
 await assertMessageScope(scope);
 if(session.user.id!==scope.owner)throw Error("La sesión cambió.");
 const response=await fetch(base.replace(/\/$/,"")+"/moderation/review-url",{method:"POST",headers:{Authorization:"Bearer "+session.access_token,"Content-Type":"application/json"},body:JSON.stringify({media})});
 if(!response.ok)throw new Error("No se pudo autorizar la vista privada del contenido.");
 const value=await response.json();if(typeof value.url!=="string"||!value.url.startsWith("https://"))throw new Error("Enlace de revisión inválido.");await assertMessageScope(scope);return privateHttpsLink(value.url);
}
export async function reportEvidencePreview(path:string,expectedScope?:MessageScope):Promise<string>{
 const scope=await captureMessageScope(expectedScope);
 const {data,error}=await requireSupabase().storage.from("employer-report-evidence").createSignedUrl(path,120);
 if(error)throw new Error(error.message);await assertMessageScope(scope);return privateHttpsLink(data.signedUrl);
}
