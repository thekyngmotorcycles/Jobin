/**
 * Bounded metadata in native system-protected entries, not media bytes.
 * Write the inactive bank before committing the manifest; interrupted writes
 * leave the last saved snapshot intact. Native durability needs device tests.
 */
import type {NativeSecretBackend} from "./credential-vault";
import type {MessageScope} from "./session-continuity";
export type PrivateMetadataKind="post-drafts"|"jshop-drafts"|"jshop-favorites"|"flash-draft"|"reel-draft";
const KINDS=new Set<PrivateMetadataKind>(["post-drafts","jshop-drafts","jshop-favorites","flash-draft","reel-draft"]);
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
export const METADATA_PART_BYTES=1200;
export const METADATA_MAX_PARTS=80;
type Bank=0|1;
type Manifest={bank:Bank;count:number};
type Verify=(scope:MessageScope)=>Promise<unknown>;
function count(raw:string|null):number{
 if(raw===null)return 0;
 if(!/^\d+$/.test(raw))throw Error("Invalid bank count");
 const n=Number(raw);
 if(!Number.isInteger(n)||n<1||n>METADATA_MAX_PARTS)throw Error("Invalid bank count");
 return n;
}
function manifest(raw:string|null):Manifest|null{
 if(raw===null)return null;
 const m=JSON.parse(raw) as Partial<Manifest>|null;
 if(!m||(m.bank!==0&&m.bank!==1)||!Number.isInteger(m.count)||m.count!<1||m.count!>METADATA_MAX_PARTS)throw Error("Invalid manifest");
 return {bank:m.bank,count:m.count!};
}
function split(value:string):string[]{
 const chunks:string[]=[];let chunk="",bytes=0;
 for(const ch of value){
  const code=ch.codePointAt(0)!;
  if(code>=0xd800&&code<=0xdfff)throw Error("Invalid Unicode");
  const size=code<=127?1:code<=2047?2:code<=65535?3:4;
  if(bytes+size>METADATA_PART_BYTES){chunks.push(chunk);chunk="";bytes=0;}
  if(chunks.length>=METADATA_MAX_PARTS)throw Error("Metadata limit exceeded");
  chunk+=ch;bytes+=size;
 }
 chunks.push(chunk);return chunks;
}
export function createPrivateMetadataVault(backend:NativeSecretBackend,verify:Verify){
 const tails=new Map<string,Promise<void>>();
 function name(kind:PrivateMetadataKind,scope:MessageScope){
  if(!KINDS.has(kind)||!UUID.test(scope.owner)||!scope.session.startsWith("jobeen.session.started.v3."+scope.owner+"."))throw Error("Cuenta o categoría inválida.");
  return "jobeen.native.metadata.v1."+scope.owner+"."+kind;
 }
 function run<T>(kind:PrivateMetadataKind,scope:MessageScope,op:(root:string)=>Promise<T>){
  const root=name(kind,scope);
  const previous=tails.get(root)??Promise.resolve();
  const result=previous.then(async()=>{
   await verify(scope);
   try{
    if(!await backend.isAvailableAsync())throw Error("Unavailable");
    const value=await op(root);
    await verify(scope);
    return value;
   }catch{throw Error("No se pudo acceder al almacenamiento privado. No se utilizará una copia sin cifrar.");}
  });
  const tail=result.then(()=>{},()=>{});tails.set(root,tail);
  void tail.then(()=>{if(tails.get(root)===tail)tails.delete(root);});
  return result;
 }
 const bankKey=(root:string,bank:Bank)=>root+".bank."+bank;
 const chunkKey=(root:string,bank:Bank,i:number)=>bankKey(root,bank)+".part."+i;
 async function cleanup(root:string,bank:Bank){
  const total=count(await backend.getItemAsync(bankKey(root,bank)+".count"));
  for(let i=0;i<total;i++)await backend.deleteItemAsync(chunkKey(root,bank,i));
  await backend.deleteItemAsync(bankKey(root,bank)+".count");
 }
 async function commit(root:string,scope:MessageScope,value:string,recovery?:()=>Promise<void>){
   const chunks=split(value);
   const active=manifest(await backend.getItemAsync(root+".manifest"));
   if(recovery){
    // An existing manifest includes empty collections and discard tombstones.
    // Staging without a manifest may be an interrupted save, not absence.
    if(active||await backend.getItemAsync(bankKey(root,0)+".count")!==null||
       await backend.getItemAsync(bankKey(root,1)+".count")!==null)return false;
    await recovery();
    await verify(scope);
   }
   const target:Bank=active?.bank===0?1:0;
   const oldCount=count(await backend.getItemAsync(bankKey(root,target)+".count"));
   // Keep a cleanup bound even if the process dies halfway through staging.
   await backend.setItemAsync(bankKey(root,target)+".count",String(Math.max(oldCount,chunks.length)));
   for(let i=0;i<chunks.length;i++)await backend.setItemAsync(chunkKey(root,target,i),chunks[i]);
   for(let i=chunks.length;i<oldCount;i++)await backend.deleteItemAsync(chunkKey(root,target,i));
   await backend.setItemAsync(bankKey(root,target)+".count",String(chunks.length));
   if(recovery)await recovery();
   await verify(scope);
   await backend.setItemAsync(root+".manifest",JSON.stringify({bank:target,count:chunks.length}));
   // Never expose the old bank once committed. A failed cleanup leaves
   // encrypted entries that can be reconciled on the next write.
   if(active)try{await cleanup(root,active.bank);}catch{/* still encrypted, no fallback */}
   return true;
 }
 return {
  read(kind:PrivateMetadataKind,scope:MessageScope){return run(kind,scope,async root=>{
   const active=manifest(await backend.getItemAsync(root+".manifest"));
   if(!active)return null;
   const total=count(await backend.getItemAsync(bankKey(root,active.bank)+".count"));
   if(total!==active.count)throw Error("Bank mismatch");
   const chunks:string[]=[];
   for(let i=0;i<active.count;i++){
    const raw=await backend.getItemAsync(chunkKey(root,active.bank,i));
    if(raw===null||split(raw).length!==1)throw Error("Missing or malformed chunk");
    chunks.push(raw);
   }
   return chunks.join("");
  });},
  async write(kind:PrivateMetadataKind,scope:MessageScope,value:string):Promise<void>{
   await run(kind,scope,root=>commit(root,scope,value));
  },
  // Recovery must share the normal write queue. Never overwrite ANY prior
  // snapshot. The caller is responsible for independent authenticated server
  // proof and consent; this guard is not itself proof of ownership.
  restoreIfNeverInitialized(kind:PrivateMetadataKind,scope:MessageScope,value:string,revalidate:()=>Promise<void>){
   return run(kind,scope,root=>commit(root,scope,value,revalidate));
  }}
 };
}
