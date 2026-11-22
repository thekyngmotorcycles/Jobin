
import {Platform} from "react-native";
import {requireOptionalNativeModule} from "expo";
import {createPrivateFileVault,type PrivateFileCrypto,type PrivateCiphertextFiles} from "./private-file-vault";
import {assertMessageScope} from "./message-session";

export const ANDROID_PRIVATE_FILE_PILOT_LIMIT=2*1024*1024;
const overhead=28;
type NativePrivateFiles={
 randomId():string;
 seal(owner:string,input:Uint8Array,aad:string,output:Uint8Array):void;
 open(owner:string,input:Uint8Array,aad:string,output:Uint8Array):void;
 createCiphertext(owner:string,id:string,input:Uint8Array):void;
 ciphertextSize(owner:string,id:string):number;
 readCiphertext(owner:string,id:string,output:Uint8Array):void;
};
// Do not import/instantiate on unsupported platforms, or use a fallback.
// Consumers must be explicitly wired after physical native tests.
export function createAndroidPrivateFileStorage(){
 if(Platform.OS!=="android")throw Error("Almacenamiento de archivos no disponible.");
 const native=requireOptionalNativeModule<NativePrivateFiles>("JobeenPrivateFiles");
 if(!native)throw Error("Se necesita una aplicación compatible con almacenamiento privado.");
 const crypto:PrivateFileCrypto={
  async randomId(){return native.randomId()},
  async seal(owner,bytes,aad){
   if(bytes.byteLength<1||bytes.byteLength>ANDROID_PRIVATE_FILE_PILOT_LIMIT)throw Error("Archivo demasiado grande.");
   const output=new Uint8Array(bytes.byteLength+overhead);
   native.seal(owner,bytes,aad,output);return output;
  },
  async open(owner,bytes,aad){
   if(bytes.byteLength<=overhead||bytes.byteLength>ANDROID_PRIVATE_FILE_PILOT_LIMIT+overhead)throw Error("Archivo inválido.");
   const output=new Uint8Array(bytes.byteLength-overhead);
   try{native.open(owner,bytes,aad,output);return output;}catch{output.fill(0);throw Error("Archivo privado no disponible.");}
  }
 };
 const files:PrivateCiphertextFiles={
  async create(location,bytes){native.createCiphertext(location.owner,location.id,bytes)},
  async read(location,max){
   const size=native.ciphertextSize(location.owner,location.id);
   if(!Number.isInteger(size)||size<=overhead||size>max||size>ANDROID_PRIVATE_FILE_PILOT_LIMIT+overhead)throw Error("Archivo inválido.");
   const output=new Uint8Array(size);
   native.readCiphertext(location.owner,location.id,output);return output;
  }
 };
 return createPrivateFileVault(crypto,files,assertMessageScope);
}
