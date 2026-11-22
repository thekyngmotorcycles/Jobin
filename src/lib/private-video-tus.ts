import {VIDEO_CHUNK_BYTES,type PrivateVideoTransport,type PrivateVideoUploadRequest,type SelectedVideoSource} from "./private-video-transfer.ts";
import type {MessageScope} from "./session-continuity";

const version="1.0.0",contract="jobeen-private-tus-v1";
const uuid=/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/;
export type WorkVideoSubmission={
 title:string;profession:string;activity:string;employer?:string;consent:boolean;start_ms:number;end_ms:number;
};

export type VideoRequest=(url:string,init:RequestInit)=>Promise<Response>;
type VideoOptions={
 origin:string;scope:MessageScope;source:SelectedVideoSource;submission:WorkVideoSubmission;
 authorize:(scope:MessageScope)=>Promise<string>;request:VideoRequest;
};

/** The security-pilot gateway owns TUS locations, live authorization and commit receipts. */
export function createPrivateVideoTus(options:VideoOptions){
 const origin=new URL(options.origin);
 if(origin.protocol!=="https:"||origin.username||origin.password||origin.port||
  origin.pathname!=="/"||origin.search||origin.hash||origin.hostname.endsWith(".supabase.co"))
  throw Error("El servicio de transferencia privada no está configurado.");
 const root=origin.origin+"/v1/private-video-uploads";
 const scope={...options.scope},submission={...options.submission};
 const lifetime=new AbortController();
 let ticket:string|undefined,path:string|undefined,mediaId:string|undefined;

 function same(value:MessageScope,signal:AbortSignal){
  if(signal.aborted||value.owner!==scope.owner||value.session!==scope.session)throw Error("La sesión cambió.");
 }
 async function send(url:string,method:string,scopeToCheck:MessageScope,headers:Record<string,string>={},body?:BodyInit,signal=lifetime.signal){
  same(scopeToCheck,signal);
  const token=await options.authorize(scope);
  same(scopeToCheck,signal);
  if(!token)throw Error("La sesión cambió.");
  const timeout=new AbortController();
  const abort=()=>timeout.abort();
  const timer=setTimeout(abort,method==="PATCH"?120_000:30_000);
  signal.addEventListener("abort",abort,{once:true});
  try{
   const response=await options.request(url,{
    method,redirect:"error",credentials:"omit",headers:{
     Authorization:"Bearer "+token,"Cache-Control":"no-store","Jobeen-Video-Protocol":contract,...headers,
    },body,signal:timeout.signal,
   });
   same(scopeToCheck,signal);
   if(response.redirected||response.headers.get("Jobeen-Video-Protocol")!==contract)throw Error("Servicio de transferencia no verificado.");
   return response;
  }finally{
   clearTimeout(timer);
   signal.removeEventListener("abort",abort);
  }
 }
 async function allocate(){
  if(ticket)return ticket;
  const response=await send(root,"POST",scope,{"Content-Type":"application/json"},
   JSON.stringify({kind:"work-video",size:options.source.size,mime:options.source.mime}));
  const id=response.headers.get("Jobeen-Upload-Id");
  if(response.status!==201||!id||!uuid.test(id))throw Error("Transferencia privada no disponible.");
  ticket=id;
  return id;
 }
 function resource(handle:string){
  if(!ticket||handle!==ticket)throw Error("Transferencia privada no disponible.");
  return root+"/"+handle;
 }
 function checkRequest(request:PrivateVideoUploadRequest){
  if(!ticket||request.bucket!=="video-originals"||request.cacheControl!=="0"||request.upsert||
   request.size!==options.source.size||request.mime!==options.source.mime||
   !request.path.startsWith(scope.owner+"/"+ticket+"."))throw Error("Transferencia privada inválida.");
 }
 function offsetOf(response:Response,status:number){
  const raw=response.headers.get("Upload-Offset")??"";
  const value=Number(raw);
  if(response.status!==status||response.headers.get("Tus-Resumable")!==version||
   !/^(0|[1-9][0-9]*)$/.test(raw)||!Number.isSafeInteger(value)||value>options.source.size)
   throw Error("No se pudo comprobar el segmento confirmado.");
  return value;
 }
 const transport:PrivateVideoTransport={
  async create(request,actor){
   checkRequest(request);
   const id=ticket;
   if(!id)throw Error("Transferencia privada no disponible.");
   const url=resource(id)+"/tus";
   const response=await send(url,"POST",actor,{"Tus-Resumable":version,"Upload-Length":String(request.size)});
   if(response.status!==201||response.headers.get("Tus-Resumable")!==version||
    response.headers.get("Location")!==url)throw Error("El servicio devolvió una ruta de transferencia inválida.");
   path=request.path;
   return id;
  },
  async offset(handle,actor){
   return offsetOf(await send(resource(handle)+"/tus","HEAD",actor,{"Tus-Resumable":version}),200);
  },
  async append(handle,offset,bytes,actor){
   if(!Number.isSafeInteger(offset)||offset<0||offset%VIDEO_CHUNK_BYTES!==0||
    bytes.byteLength!==Math.min(VIDEO_CHUNK_BYTES,options.source.size-offset)||
    !bytes.byteLength||!(bytes.buffer instanceof ArrayBuffer))throw Error("Segmento inválido.");
   return offsetOf(await send(resource(handle)+"/tus","PATCH",actor,{
    "Tus-Resumable":version,"Upload-Offset":String(offset),"Content-Type":"application/offset+octet-stream",
   },bytes as Uint8Array<ArrayBuffer>),204);
  },
  async confirm(handle,request,actor){
   checkRequest(request);
   if(path!==request.path)throw Error("Transferencia privada inválida.");
   const response=await send(resource(handle)+"/complete","POST",actor,{"Content-Type":"application/json"},JSON.stringify(submission));
   const media=response.headers.get("Jobeen-Media-Id");
   if(response.status!==200||!media||!uuid.test(media)||
    response.headers.get("Jobeen-Confirmed-Path")!==request.path||
    response.headers.get("Jobeen-Confirmed-Length")!==String(request.size)||
    response.headers.get("Jobeen-Confirmed-Type")!==request.mime)throw Error("El servidor no confirmó el video.");
   mediaId=media;
  },
 };
 return {allocate,transport,receipt:()=>mediaId,stop(){
  if(lifetime.signal.aborted)return;
  lifetime.abort();
  // Best effort with the original live session only. Revoked or offline
  // sessions cannot cancel remotely. Their quarantine ticket still expires.
  if(ticket&&!mediaId){
   void send(resource(ticket)+"/tus","DELETE",scope,{"Tus-Resumable":version},undefined,new AbortController().signal).catch(()=>{});
  }
 }};
}
