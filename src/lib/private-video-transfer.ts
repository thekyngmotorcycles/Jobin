/**
 * Candidate bounded, foreground-only video transfer orchestration.
 * Transport adapter MUST use an audited TUS client/HTTPS, trusted storage
 * origin, exact JWT scope, no redirects, no upsert and private quarantine.
 * No URL or credentials in checkpoints. No persistent upload queue yet.
 */
import type {MessageScope} from "./session-continuity";
export const VIDEO_CHUNK_BYTES=6*1024*1024;
export const VIDEO_MAX_BYTES=500*1024*1024;
type Mime="video/mp4"|"video/quicktime"|"video/webm";
const extension:Record<Mime,string>={"video/mp4":"mp4","video/quicktime":"mov","video/webm":"webm"};
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
export interface SelectedVideoSource{
 readonly size:number;
 readonly mime:Mime;
 /** Immutable selected file snapshot, no persisted URI or automatic restore.
  * Read one bounded slice, never load the whole source into memory. */
 read(offset:number,length:number):Promise<Uint8Array>;
}
type UploadRequest={bucket:"video-originals";path:string;size:number;mime:Mime;cacheControl:"0";upsert:false};
export interface PrivateVideoTransport{
 /** An opaque, in-memory handle bound to this request and exact scope.
  * It must not contain or return an unrestricted external URL. */
 create(request:UploadRequest,scope:MessageScope):Promise<string>;
 offset(handle:string,scope:MessageScope):Promise<number>;
 append(handle:string,offset:number,bytes:Uint8Array,scope:MessageScope):Promise<number>;
 /** Verify completed object identity/size/ticket before publication RPC. */
 confirm(handle:string,request:UploadRequest,scope:MessageScope):Promise<void>;
}
export function createPrivateVideoTransfer(
 source:SelectedVideoSource,scope:MessageScope,transport:PrivateVideoTransport,
 verify:(s:MessageScope)=>Promise<unknown>,randomId:()=>Promise<string>
){
 const origin={...scope},size=source.size,mime=source.mime;
 if(!uuid.test(origin.owner)||!origin.session.startsWith("jobeen.session.started.v3."+origin.owner+".")
 ||!Number.isSafeInteger(size)||size<1||size>VIDEO_MAX_BYTES||!Object.hasOwn(extension,mime))
  throw Error("Video no admitido.");
 let request:UploadRequest|undefined,handle:string|undefined,busy=false,complete=false,stopped=false;
 async function check(){
  if(stopped)throw Error();
  await verify(origin);
  if(stopped||source.size!==size||source.mime!==mime)throw Error();
 }
 function validOffset(offset:number){
  return Number.isSafeInteger(offset)&&offset>=0&&offset<=size&&(offset===size||offset%VIDEO_CHUNK_BYTES===0);
 }
 return {
  // Cancellation is permanent for this controller. In-flight bytes may finish
  // in private quarantine under the original account; never finalize them.
  stop(){stopped=true;},
  async transfer(){
   if(busy||complete||stopped)throw Error("Transferencia no disponible.");
   busy=true;
   try{
    await check();
    if(!request){
     const id=await randomId();
     if(!uuid.test(id))throw Error();
     await check();
     request={bucket:"video-originals",path:origin.owner+"/"+id+"."+extension[mime],size,mime,cacheControl:"0",upsert:false};
    }
    if(!handle){
     await check();
     const created=await transport.create({...request},origin);
     if(typeof created!=="string"||!created||created.length>2048)throw Error();
     await check();handle=created;
    }
    // Always ask server on retry: response loss may have committed a chunk.
    let offset=await transport.offset(handle,origin);
    if(!validOffset(offset))throw Error();
    await check();
    while(offset<size){
     const length=Math.min(VIDEO_CHUNK_BYTES,size-offset);
     let bytes:Uint8Array|undefined;
     try{
      bytes=await source.read(offset,length);
      if(!(bytes instanceof Uint8Array)||bytes.byteLength!==length)throw Error();
      await check();
      const next=await transport.append(handle,offset,bytes,origin);
      await check();
      if(next!==offset+length)throw Error();
      offset=next;
     }finally{bytes?.fill(0);}
    }
    await check();
    await transport.confirm(handle,{...request},origin);
    await check();complete=true;
    return {path:request.path,size,mime,owner:origin.owner};
   }catch{throw Error("No se pudo completar la transferencia privada. Verifica tu sesión y conexión.");}
   finally{busy=false;}
  }
 };
}
