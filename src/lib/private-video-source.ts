import {isPrivateVideoMime,VIDEO_CHUNK_BYTES,VIDEO_MAX_BYTES,type SelectedVideoSource} from "./private-video-transfer.ts";

export type PickedVideo = {uri:string;fileSize?:number;mimeType?:string|null;file?:Blob};
export type VideoFileHandle = {offset:number|null;readBytes(size:number):Uint8Array;close():void};
export type CachedVideoFile = {
 readonly size:number|null;
 readonly modificationTime:number|null;
 validatePath():void;
 open():VideoFileHandle;
};
export type VideoFileSystem = {cacheDirectory:string;FileSystemFile:new(uri:string)=>CachedVideoFile};

function source(size:number,mime:string,read:(offset:number,length:number)=>Promise<Uint8Array>):SelectedVideoSource {
 if(!Number.isSafeInteger(size)||size<1||size>VIDEO_MAX_BYTES)throw Error("Selecciona un video de hasta 500 MB.");
 if(!isPrivateVideoMime(mime))throw Error("Selecciona un video MP4, MOV o WebM.");
 return {size,mime,async read(offset,length){
  if(!Number.isSafeInteger(offset)||!Number.isSafeInteger(length)||offset<0||
   length<1||length>VIDEO_CHUNK_BYTES||offset>size-length)throw Error("Segmento de video inválido.");
  return read(offset,length);
 }};
}

/** The browser picker supplies an immutable Blob. An old blob URL alone is insufficient. */
export function selectedBrowserVideo(asset:PickedVideo):SelectedVideoSource{
 const file=asset.file;
 if(!asset.uri.startsWith("blob:")||typeof Blob!=="function"||!(file instanceof Blob))throw Error("Vuelve a seleccionar el video.");
 return source(file.size,file.type||asset.mimeType||"",async(offset,length)=>
  new Uint8Array(await file.slice(offset,offset+length).arrayBuffer()));
}

/** Limit native reads to a freshly picked cached file and re-open it only for one slice. */
export function selectedCachedVideo(asset:PickedVideo,fs:VideoFileSystem):SelectedVideoSource{
 const cache=fs.cacheDirectory.endsWith("/")?fs.cacheDirectory:fs.cacheDirectory+"/";
 if(!cache.startsWith("file:///")||!asset.uri.startsWith(cache))throw Error("Vuelve a seleccionar un video local compatible.");
 const relative=asset.uri.slice(cache.length);
 // The Expo picker generates cache names. Reject traversal and encoded separators.
 if(!relative.split("/").every(part=>/^[\w.-]+$/.test(part)&&part!=="."&&part!==".."))throw Error("Archivo de video inválido.");
 const file=new fs.FileSystemFile(asset.uri);
 file.validatePath();
 const size=file.size,modified=file.modificationTime;
 if(size===null||typeof modified!=="number"||!Number.isFinite(modified)||
  (asset.fileSize!==undefined&&asset.fileSize!==size))throw Error("No se pudo verificar el video seleccionado.");
 const extension=relative.split(".").at(-1)?.toLowerCase();
 const mime=asset.mimeType||(extension==="mp4"?"video/mp4":extension==="mov"?"video/quicktime":extension==="webm"?"video/webm":"");
 const unchanged=()=>file.size===size&&file.modificationTime===modified;
 return source(size,mime,async(offset,length)=>{
  if(!unchanged())throw Error("El video cambió. Vuelve a seleccionarlo.");
  const handle=file.open();
  let bytes:Uint8Array|undefined;
  try{
   handle.offset=offset;
   bytes=handle.readBytes(length);
   if(bytes.byteLength!==length||!unchanged())throw Error("No se pudo leer el segmento de video.");
   handle.close();
   return bytes;
  }catch(error){
   bytes?.fill(0);
   try{handle.close();}catch{/* The handle may already be closed. */}
   throw error;
  }
 });
}
