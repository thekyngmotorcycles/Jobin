/**
 * Candidate for small private binary records. The native adapter must supply
 * reviewed authenticated encryption (AES-256-GCM), a CSPRNG, per-owner
 * device-protected keys and atomic immutable ciphertext file publication.
 * No native integration yet. No plaintext disk staging or external URI access.
 * Large video is intentionally excluded; use a reviewed streaming solution.
 */
import type {MessageScope} from "./session-continuity";
export const PRIVATE_FILE_MAX_BYTES=10*1024*1024;
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
export type PrivateFileKind="draft-photo"|"report-evidence";
export type PrivateFileRef={version:1;owner:string;id:string;kind:PrivateFileKind;size:number};
type Location={owner:string;id:string};
export interface PrivateFileCrypto {
 /** Must return a fresh unpredictable UUID from a CSPRNG. */
 randomId():Promise<string>;
 /** AEAD with a fresh nonce per encryption and 128-bit tag. Keys are scoped
  * to owner; decryption MUST fail if key is missing, never generate a new one. */
 seal(owner:string,plaintext:Uint8Array,aad:string):Promise<Uint8Array>;
 open(owner:string,ciphertext:Uint8Array,aad:string):Promise<Uint8Array>;
}
export interface PrivateCiphertextFiles {
 /** Atomically create, never overwrite, in app-private storage. The adapter
  * constructs the path from validated owner/id, not a caller-supplied URI.
  * A failed or ambiguous write must not delete another file. */
 create(location:Location,ciphertext:Uint8Array):Promise<void>;
 /** Adapter must enforce limit BEFORE allocating/reading the file. */
 read(location:Location,maxBytes:number):Promise<Uint8Array>;
}
const validKind=(kind:unknown):kind is PrivateFileKind=>kind==="draft-photo"||kind==="report-evidence";
function validate(scope:MessageScope,ref?:PrivateFileRef){
 if(!uuid.test(scope.owner)||!scope.session.startsWith("jobeen.session.started.v3."+scope.owner+"."))
  throw Error("Cuenta inválida.");
 if(ref&&(ref.version!==1||ref.owner!==scope.owner||!uuid.test(ref.id)||!validKind(ref.kind)
  ||!Number.isInteger(ref.size)||ref.size<1||ref.size>PRIVATE_FILE_MAX_BYTES))
  throw Error("Referencia de archivo privado inválida.");
}
function associatedData(ref:PrivateFileRef){
 // Canonical order, binds ciphertext to account, record, category and size.
 return JSON.stringify(["jobeen.private.file",ref.version,ref.owner,ref.id,ref.kind,ref.size]);
}
const failure=()=>Error("No se pudo completar la operación del archivo privado.");
export function createPrivateFileVault(crypto:PrivateFileCrypto,files:PrivateCiphertextFiles,verify:(scope:MessageScope)=>Promise<unknown>){
 return {
  async save(scope:MessageScope,kind:PrivateFileKind,bytes:Uint8Array):Promise<PrivateFileRef>{
   validate(scope);
   if(!validKind(kind)||!(bytes instanceof Uint8Array)||bytes.byteLength<1||bytes.byteLength>PRIVATE_FILE_MAX_BYTES)
    throw Error("Archivo privado no admitido.");
   // Snapshot caller bytes before any await. Never erase the caller's original.
   const plain=new Uint8Array(bytes);
   try{
    await verify(scope);
    const id=await crypto.randomId();
    const ref:PrivateFileRef={version:1,owner:scope.owner,id,kind,size:plain.byteLength};
    validate(scope,ref);
    await verify(scope);
    const sealed=await crypto.seal(scope.owner,plain,associatedData(ref));
    if(!(sealed instanceof Uint8Array)||sealed.byteLength<=plain.byteLength||
      sealed.byteLength>plain.byteLength+1024)throw Error("Invalid sealed data");
    await verify(scope);
    await files.create({owner:scope.owner,id},sealed);
    await verify(scope);
    return ref;
   }catch{throw failure();}
   finally{plain.fill(0);}
  },
  async read(scope:MessageScope,ref:PrivateFileRef):Promise<Uint8Array>{
   // Copy reference so the caller cannot mutate the address/AAD during awaits.
   const target={...ref};
   validate(scope,target);
   let plain:Uint8Array|undefined,delivered=false;
   try{
    await verify(scope);
    const sealed=await files.read({owner:target.owner,id:target.id},target.size+1024);
    if(!(sealed instanceof Uint8Array)||sealed.byteLength<=target.size||sealed.byteLength>target.size+1024)
     throw Error("Invalid ciphertext length");
    await verify(scope);
    plain=await crypto.open(scope.owner,sealed,associatedData(target));
    if(!(plain instanceof Uint8Array)||plain.byteLength!==target.size)throw Error("Invalid plaintext length");
    await verify(scope);
    delivered=true;
    return plain;
   }catch{throw failure();}
   finally{if(!delivered)plain?.fill(0);}
  }
 };
}
// Deliberately no generic remove(uri), automatic recovery from a legacy path,
// or file listing API. Orphan cleanup needs a verified reference inventory.
