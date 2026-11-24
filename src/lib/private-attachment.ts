import type {PrivateFileKind,PrivateFileRef} from "./private-file-vault";
import type {MessageScope} from "./session-continuity";
import {POST_PHOTO_LIMIT} from "./feed-photo-layout";

export const PRIVATE_ATTACHMENT_LIMIT=2*1024*1024;
export type AttachmentMime="image/jpeg"|"image/png"|"image/webp"|"application/pdf";
export type PrivateAttachment={ref:PrivateFileRef;mime:AttachmentMime};
export type PendingEvidence=PrivateAttachment&{name:string;session:string};
export function assertEvidenceSession(file:PendingEvidence,scope:MessageScope){
 if(file.session!==scope.session||file.ref.owner!==scope.owner)throw Error("Vuelve a seleccionar el archivo en esta sesión.");
}
const uuid=/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/;
export const attachmentExtension={ "image/jpeg":"jpg","image/png":"png","image/webp":"webp","application/pdf":"pdf" } as const;

export function parsePrivateAttachment(value:unknown,owner:string,kind:PrivateFileKind):PrivateAttachment{
 const item=value as PrivateAttachment|undefined;
 if(!item?.ref||item.ref.owner!==owner||item.ref.version!==1||!uuid.test(item.ref.id)||
  item.ref.kind!==kind||!Number.isInteger(item.ref.size)||item.ref.size<1||
  item.ref.size>PRIVATE_ATTACHMENT_LIMIT||!Object.hasOwn(attachmentExtension,item.mime)||
  (kind==="draft-photo"&&item.mime==="application/pdf"))throw Error("Archivo privado no disponible.");
 const {version,id,size}=item.ref;
 return {ref:{version,id,owner,kind,size},mime:item.mime};
}

export function attachmentMime(bytes:Uint8Array):AttachmentMime{
 const at=(offset:number,...prefix:number[])=>prefix.every((byte,i)=>bytes[offset+i]===byte);
 if(at(0,255,216,255))return "image/jpeg";
 if(at(0,137,80,78,71,13,10,26,10))return "image/png";
 if(at(0,82,73,70,70)&&at(8,87,69,66,80))return "image/webp";
 if(at(0,37,80,68,70,45))return "application/pdf";
 throw Error("Selecciona JPEG, PNG, WebP o PDF.");
}

type Storage={
 readPicked(uri:string,output:Uint8Array,normalize:boolean):number;
 discardImagePickerCopy(uri:string):void;
 save(scope:MessageScope,kind:PrivateFileKind,bytes:Uint8Array):Promise<PrivateFileRef>;
 read(scope:MessageScope,ref:PrivateFileRef):Promise<Uint8Array>;
};

export function createPrivateAttachments(storage:Storage,verify:(scope:MessageScope)=>Promise<unknown>){
 return {
  async protect(scope:MessageScope,kind:PrivateFileKind,assets:readonly {uri:string}[],source:"image"|"document",allowed?:readonly string[],maxFiles=5){
   const secured:PrivateAttachment[]=[];
   try{
    const limit=kind==="draft-photo"&&source==="image"&&Number.isInteger(maxFiles)&&maxFiles>=1?Math.min(maxFiles,POST_PHOTO_LIMIT):5;
    if(assets.length>limit)throw Error("Puedes adjuntar hasta "+limit+" archivos.");
    for(const asset of assets){
     await verify(scope);
     const memory=new Uint8Array(PRIVATE_ATTACHMENT_LIMIT);
     try{
      const count=storage.readPicked(asset.uri,memory,kind==="draft-photo");
      if(!Number.isInteger(count)||count<1||count>PRIVATE_ATTACHMENT_LIMIT)throw Error(kind==="draft-photo"?"No se pudo comprimir la fotografía. Selecciona otra imagen.":"El archivo no puede superar 2 MB.");
      const bytes=memory.subarray(0,count),mime=attachmentMime(bytes);
      if((source==="image"||kind==="draft-photo")&&mime==="application/pdf")throw Error("Selecciona una fotografía.");
      if(allowed&&!allowed.includes(mime))throw Error("El formato del archivo no coincide con la selección solicitada.");
      const ref=await storage.save(scope,kind,bytes);
      await verify(scope);
      secured.push({ref,mime});
     }finally{memory.fill(0);}
    }
    return secured;
   }finally{
    if(source==="image"){
     let removed=true;
     for(const asset of assets){
      try{storage.discardImagePickerCopy(asset.uri);}catch{removed=false;}
     }
     if(!removed)throw Error("No se pudo limpiar la copia temporal de la selección.");
    }
   }
  },
  async use<T>(scope:MessageScope,kind:PrivateFileKind,input:unknown,consume:(bytes:Uint8Array,mime:AttachmentMime)=>Promise<T>|T){
   const attachment=parsePrivateAttachment(input,scope.owner,kind);
   await verify(scope);
   const bytes=await storage.read(scope,attachment.ref);
   try{
    if(attachmentMime(bytes)!==attachment.mime)throw Error("Archivo privado no disponible.");
    await verify(scope);
    const result=await consume(bytes,attachment.mime);
    await verify(scope);
    return result;
   }finally{bytes.fill(0);}
  },
 };
}
