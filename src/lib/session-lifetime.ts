/** A persisted lifetime marker belongs only to its exact authenticated account.
 * It is metadata, not proof of authentication. Supabase remains authoritative.
 */
export const SESSION_LIFETIME_MS=7*24*60*60*1000;
export function sessionMarkerKey(owner:string){
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(owner))throw new Error("Cuenta inválida.");
 return "jobeen.session.started.v2."+owner;
}
export function sessionLifetimeState(raw:string|null,now=Date.now()):"missing"|"active"|"expired"{
 if(raw===null)return "missing";
 if(!/^\d+$/.test(raw))return "expired";
 const started=Number(raw);
 return Number.isSafeInteger(started)&&started>0&&started<=now&&now-started<SESSION_LIFETIME_MS?"active":"expired";
}
