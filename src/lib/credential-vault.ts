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
// Keep each native value small; this is an app limit, not a platform guarantee.
export const VAULT_PART_BYTES=1200;
export const VAULT_MAX_PARTS=64;
function splitValue(value:string):string[]{
 const parts:string[]=[];let part="",bytes=0;
 for(const character of value){
  const code=character.codePointAt(0)!;
  if(code>=0xd800&&code<=0xdfff)throw Error("Invalid Unicode");
  const size=code<=0x7f?1:code<=0x7ff?2:code<=0xffff?3:4;
  if(bytes+size>VAULT_PART_BYTES){parts.push(part);part="";bytes=0;}
  part+=character;bytes+=size;
  if(parts.length>=VAULT_MAX_PARTS)throw Error("Credential too large");
 }
 parts.push(part);return parts;
}
type Manifest={state:"ready"|"pending";count:number};
function parseManifest(raw:string):Manifest{
 const data=JSON.parse(raw) as Partial<Manifest>;
 if(!data||(data.state!=="ready"&&data.state!=="pending")||!Number.isInteger(data.count)||data.count!<1||data.count!>VAULT_MAX_PARTS)
  throw Error("Invalid credential manifest");
 return {state:data.state,count:data.count!};
}
export function createCredentialVault(backend:NativeSecretBackend,authStorageKey:string){
 if(!/^sb-[a-zA-Z0-9.-]+-auth-token$/.test(authStorageKey))throw Error("Identificador de almacenamiento inválido.");
 const allowed=new Set([authStorageKey,authStorageKey+"-code-verifier",authStorageKey+"-user",authStorageKey+"-flows-code-verifier"]);
 function secureKey(key:string){
  const suffix=key.startsWith(authStorageKey)?key.slice(authStorageKey.length):"";
  if(!allowed.has(key)&&!(/^-flow-[a-zA-Z0-9_-]{8,64}-code-verifier$/.test(suffix)))throw Error("Clave de credenciales no permitida.");
  return "jobeen.native.auth.v2."+key;
 }
 // One adapter instance per app runtime; the native backend must acknowledge durable writes.
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
 async function readManifest(name:string){
  const raw=await backend.getItemAsync(name+".manifest");
  return raw===null?null:parseManifest(raw);
 }
 async function mark(name:string,state:Manifest["state"],count:number){
  await backend.setItemAsync(name+".manifest",JSON.stringify({state,count}));
 }
 function partKey(name:string,i:number){return name+".part."+i;}
 return {
  getItem(key:string){return run(key,async name=>{
   const manifest=await readManifest(name);
   if(!manifest)return null;
   if(manifest.state!=="ready")throw Error("Interrupted credential operation");
   const parts:string[]=[];
   for(let i=0;i<manifest.count;i++){
    const part=await backend.getItemAsync(partKey(name,i));
    if(part===null||splitValue(part).length!==1)throw Error("Invalid credential part");
    parts.push(part);
   }
   return parts.join("");
  });},
  setItem(key:string,value:string){return run(key,async name=>{
   const parts=splitValue(value),previous=await readManifest(name);
   const count=Math.max(previous?.count??0,parts.length);
   // Fail closed across a process restart: invalidate the old manifest BEFORE
   // touching parts. No rollback to an earlier refresh token or partial value.
   await mark(name,"pending",count);
   for(let i=0;i<parts.length;i++)await backend.setItemAsync(partKey(name,i),parts[i]);
   for(let i=parts.length;i<count;i++)await backend.deleteItemAsync(partKey(name,i));
   await mark(name,"ready",parts.length);
  });},
  removeItem(key:string){return run(key,async name=>{
   const manifest=await readManifest(name);
   if(!manifest)return;
   // An interrupted sign-out cannot restore a readable old credential.
   await mark(name,"pending",manifest.count);
   for(let i=0;i<manifest.count;i++)await backend.deleteItemAsync(partKey(name,i));
   await backend.deleteItemAsync(name+".manifest");
  });}
 };
}
