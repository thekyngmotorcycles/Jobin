/** Scope local lifetime metadata to the exact Supabase session, not just the device.
 * A decoded claim is used only for the storage key, never as authentication.
 */
export const SESSION_LIFETIME_MS=7*24*60*60*1000;
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function sessionMarkerKey(owner:string,accessToken:string){
 if(!uuid.test(owner))throw new Error("Cuenta inválida.");
 try{
  const payload=accessToken.split(".")[1];
  const normalized=payload.replace(/-/g,"+").replace(/_/g,"/");
  const decoded=JSON.parse(atob(normalized.padEnd(Math.ceil(normalized.length/4)*4,"="))) as {sub?:string;session_id?:string};
  if(decoded.sub!==owner||!decoded.session_id||!uuid.test(decoded.session_id))throw new Error();
  return "jobeen.session.started.v3."+owner+"."+decoded.session_id;
 }catch{throw new Error("No se pudo identificar la sesión. Vuelve a iniciar sesión.");}
}
export function sessionLifetimeState(raw:string|null,now=Date.now()):"missing"|"active"|"expired"{
 if(raw===null)return "missing";
 if(!/^\d+$/.test(raw))return "expired";
 const started=Number(raw);
 return Number.isSafeInteger(started)&&started>0&&started<=now&&now-started<SESSION_LIFETIME_MS?"active":"expired";
}
