/** Local continuity barrier, not a substitute for server revocation. */
export function createSessionExitFence(){
 let active:string|null=null;
 const listeners=new Set<()=>void>();
 function notify(){for(const listener of listeners)listener();}
 return {
  current:()=>active,
  assertOpen(scope:string){if(active===scope)throw Error("La sesión se está cerrando.");},
  subscribe(listener:()=>void){listeners.add(listener);return ()=>{listeners.delete(listener);};},
  async close<T>(scope:string,action:()=>Promise<T>):Promise<T>{
   if(!scope||active!==null)throw Error("Hay un cierre de sesión en proceso.");
   active=scope;notify();
   try{return await action();}finally{active=null;notify();}
  }
 };
}
export const sessionExitFence=createSessionExitFence();
