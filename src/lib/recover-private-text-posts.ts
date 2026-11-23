/**
 * Candidate: server-reconstructed text only. No reads of legacy device data.
 * The reviewed source must issue exact authorized bytes after reauthentication
 * and consent. No automatic execution or generic media recovery.
 */
import type {MessageScope} from "./session-continuity";
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const fields=["id","updatedAt","body","kind","photos","mediaId","audience","audienceFollowers","audienceContacts","consent","mentionedProfileIds","businessMentions"];
const empty=(v:unknown)=>Array.isArray(v)&&v.length===0;
export function validateRecoveryTextPosts(payload:string){
 if(typeof payload!=="string"||payload.length>96000)throw Error("Datos de recuperación inválidos.");
 const values:unknown=JSON.parse(payload);
 if(!Array.isArray(values)||values.length<1||values.length>10)throw Error("Datos de recuperación inválidos.");
 const ids=new Set<string>();
 for(const v of values){
  if(!v||typeof v!=="object"||Object.keys(v).length!==fields.length||fields.some(k=>!Object.hasOwn(v,k))
   ||typeof v.id!=="string"||!/^[a-zA-Z0-9_-]{1,80}$/.test(v.id)||ids.has(v.id)
   ||!Number.isSafeInteger(v.updatedAt)||v.updatedAt<0
   ||typeof v.body!=="string"||!v.body.trim()||v.body.length>2000
   ||v.kind!=="text"||!empty(v.photos)||v.mediaId!==""
   ||v.audience!=="private"||v.audienceFollowers!==false||v.audienceContacts!==false||v.consent!==false
   ||!empty(v.mentionedProfileIds)||!empty(v.businessMentions))
   throw Error("Datos de recuperación inválidos.");
  ids.add(v.id);
 }
}
type Restore=(scope:MessageScope,payload:string,revalidate:()=>Promise<void>)=>Promise<boolean>;
export function createTextPostRecovery(
 fetchApproved:(grant:string,scope:MessageScope)=>Promise<string|null>,
 restore:Restore,
 verify:(scope:MessageScope)=>Promise<unknown>
){
 return async function recover(grant:string,expected:MessageScope,confirmed:boolean){
  const scope={...expected};
  if(confirmed!==true||!uuid.test(grant)||!uuid.test(scope.owner))throw Error("Recuperación no autorizada.");
  try{
   await verify(scope);
   const payload=await fetchApproved(grant,scope);
   await verify(scope);
   if(typeof payload!=="string")throw Error();
   validateRecoveryTextPosts(payload);
   // Recheck exact server-owned bytes before staging and before commit.
   const revalidate=async()=>{
    await verify(scope);
    if(await fetchApproved(grant,scope)!==payload)throw Error();
    await verify(scope);
   };
   const result=await restore(scope,payload,revalidate);
   await verify(scope);
   return result?"restored":"conflict";
  }catch{throw Error("No se pudo autorizar la recuperación privada.");}
 };
}
