/**
 * Candidate adapter for the future native build. Native backend MUST be backed
 * by Keystore/Keychain. Not wired to Supabase until isolated Android tests pass.
 * No plaintext fallback, no automatic import from legacy AsyncStorage.
 */
export interface NativeSecretBackend {
 isAvailableAsync():Promise<boolean>;
 getItemAsync(key:string):Promise<string|null>;
 setItemAsync(key:string,value:string):Promise<void>;
 deleteItemAsync(key:string):Promise<void>;
}
export function createCredentialVault(backend:NativeSecretBackend,authStorageKey:string){
 if(!/^sb-[a-zA-Z0-9.-]+-auth-token$/.test(authStorageKey))throw Error("Identificador de almacenamiento inválido.");
 const allowed=new Set([authStorageKey,authStorageKey+"-code-verifier",authStorageKey+"-user"]);
 function secureKey(key:string){
  if(!allowed.has(key))throw Error("Clave de credenciales no permitida.");
  return "jobeen.native.auth.v1."+key;
 }
 let tail:Promise<void>=Promise.resolve();
 function run<T>(key:string,operation:(name:string)=>Promise<T>):Promise<T>{
  const name=secureKey(key);
  const task=tail.then(async()=>{
   try{
    if(!await backend.isAvailableAsync())throw Error();
    return await operation(name);
   }catch{throw Error("Almacenamiento seguro no disponible. No se guardaron credenciales en almacenamiento alternativo.");}
  });
  tail=task.then(()=>{},()=>{});
  return task;
 }
 return {
  getItem(key:string){return run(key,name=>backend.getItemAsync(name));},
  setItem(key:string,value:string){return run(key,name=>backend.setItemAsync(name,value));},
  removeItem(key:string){return run(key,name=>backend.deleteItemAsync(name));}
 };
}
