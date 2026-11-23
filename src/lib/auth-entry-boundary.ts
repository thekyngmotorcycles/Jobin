/**
 * One active authentication entry per process. Pending Google callbacks are
 * accepted only within the live, intentionally started flow. PKCE and the
 * server remain responsible for cryptographic verification.
 */
const TTL=5*60*1000;
export const authRedirectScheme=process.env.EXPO_PUBLIC_JOBEEN_SECURITY_PILOT==="1"?"jobeen-security-pilot":"jobin";
export function parseGoogleCallback(url:string|null,scheme=authRedirectScheme):string|null{
 if(!url||url.length>4096)return null;
 // Exact configured empty-host redirect, no arbitrary app path or fragment.
 if(scheme!=="jobin"&&scheme!=="jobeen-security-pilot")return null;
 const prefix=scheme+"://";
 if(!url.startsWith(prefix))return null;
 const query=url.slice(prefix.length);
 const match=/^\/?\?code=([A-Za-z0-9_%.-]{1,2048})$/.exec(query);
 if(!match)return null;
 try{
  const code=decodeURIComponent(match[1]);
  return /^[A-Za-z0-9_-]{1,512}$/.test(code)?code:null;
 }catch{return null;}
}
export function createAuthEntryBoundary(now=Date.now){
 let active:{kind:"exclusive"|"google-start"|"google-pending"|"google-exchange";deadline:number}|null=null;
 function begin(kind:"exclusive"|"google-start"){
  if(active?.kind==="google-pending"&&active.deadline<=now())active=null;
  if(active)throw Error("Hay un acceso en proceso. Finalízalo o vuelve a intentar cuando caduque.");
  const lease={kind:kind as "exclusive"|"google-start"|"google-pending"|"google-exchange",deadline:0};
  active=lease;return lease;
 }
 return {
  async exclusive<T>(action:()=>Promise<T>):Promise<T>{
   const lease=begin("exclusive");
   try{return await action();}finally{if(active===lease)active=null;}
  },
  async google(action:(ready:()=>void)=>Promise<void>){
   const lease=begin("google-start");
   try{await action(()=>{
    if(active!==lease||lease.kind!=="google-start")throw Error("Acceso no disponible.");
    lease.deadline=now()+TTL;lease.kind="google-pending";
   });
   if(lease.kind==="google-start")throw Error("Acceso no disponible.");
   }catch(e){if(active===lease&&lease.kind!=="google-exchange")active=null;throw e;}
  },
  async exchange<T>(url:string|null,action:(code:string)=>Promise<T>):Promise<T|null>{
   const code=parseGoogleCallback(url);
   if(!code||active?.kind!=="google-pending"||active.deadline<=now())return null;
   const lease=active;lease.kind="google-exchange";
   try{return await action(code);}finally{if(active===lease)active=null;}
  },
  restorePendingGoogle(deadline:number){
   if(active||!Number.isFinite(deadline)||deadline<=now()||deadline>now()+TTL)return false;
   active={kind:"google-pending",deadline};
   return true;
  },
  cancelPendingGoogle(){
   if(active?.kind==="google-pending")active=null;
  }
 };
}
