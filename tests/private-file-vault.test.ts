import test from "node:test";
import assert from "node:assert/strict";
import {randomUUID,randomBytes,createCipheriv,createDecipheriv} from "node:crypto";
import {createPrivateFileVault,PRIVATE_FILE_MAX_BYTES,type PrivateFileCrypto,type PrivateCiphertextFiles} from "../src/lib/private-file-vault.ts";
const a={owner:"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",session:"jobeen.session.started.v3.aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.a"};
const b={owner:"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",session:"jobeen.session.started.v3.bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb.b"};
function fixture(){
 let active=a;
 const data=new Map<string,Uint8Array>(),keys=new Map<string,Buffer>();
 const address=(l:{owner:string;id:string})=>l.owner+"/"+l.id;
 const crypto:PrivateFileCrypto={
  async randomId(){return randomUUID()},
  async seal(owner,plaintext,aad){
   let key=keys.get(owner);
   if(!key){key=randomBytes(32);keys.set(owner,key)}
   const nonce=randomBytes(12),cipher=createCipheriv("aes-256-gcm",key,nonce);
   cipher.setAAD(Buffer.from(aad));
   const body=Buffer.concat([cipher.update(plaintext),cipher.final()]);
   return Buffer.concat([nonce,body,cipher.getAuthTag()]);
  },
  async open(owner,sealed,aad){
   const key=keys.get(owner);if(!key)throw Error("Missing key");
   const buffer=Buffer.from(sealed);
   const cipher=createDecipheriv("aes-256-gcm",key,buffer.subarray(0,12));
   cipher.setAAD(Buffer.from(aad));
   cipher.setAuthTag(buffer.subarray(-16));
   return Buffer.concat([cipher.update(buffer.subarray(12,-16)),cipher.final()]);
  }
 };
 const files:PrivateCiphertextFiles={
  async create(l,v){const k=address(l);assert.ok(!data.has(k));data.set(k,new Uint8Array(v))},
  async read(l,max){const v=data.get(address(l));if(!v||v.byteLength>max)throw Error("Missing or oversized");return new Uint8Array(v)}
 };
 const verify=async(s:typeof a)=>{assert.deepEqual(s,active)};
 const vault=()=>createPrivateFileVault(crypto,files,verify);
 return {data,keys,crypto,files,vault,verify,address,switchTo(s:typeof a){active=s}};
}
test("Real AES-GCM fixture round trips binary bytes; stored file is not plaintext",async()=>{
 const f=fixture(),bytes=new Uint8Array(Buffer.from("fixture private photo"));
 const ref=await f.vault().save(a,"draft-photo",bytes);
 assert.equal(ref.owner,a.owner);assert.equal(ref.size,bytes.length);
 assert.ok(!Buffer.from(f.data.get(f.address(ref))!).includes(Buffer.from(bytes)));
 assert.deepEqual(Buffer.from(await f.vault().read(a,ref)),Buffer.from(bytes));
 assert.equal(Buffer.from(bytes).toString(),"fixture private photo");
 const ref2=await f.vault().save(a,"draft-photo",bytes);
 assert.notEqual(ref.id,ref2.id);
 assert.notDeepEqual(f.data.get(f.address(ref)),f.data.get(f.address(ref2)));
});
test("Other account, tampered ciphertext, moved record, changed category and missing key fail closed",async()=>{
 const f=fixture(),v=f.vault(),ref=await v.save(a,"draft-photo",new Uint8Array([1,2,3,4]));
 f.switchTo(b);await assert.rejects(v.read(b,ref));
 const forged={...ref,owner:b.owner};
 f.data.set(f.address(forged),f.data.get(f.address(ref))!);
 await assert.rejects(v.read(b,forged));
 f.switchTo(a);await assert.rejects(v.read(a,{...ref,kind:"report-evidence"}));
 const moved={...ref,id:randomUUID()};
 f.data.set(f.address(moved),f.data.get(f.address(ref))!);
 await assert.rejects(v.read(a,moved));
 const before=f.data.get(f.address(ref))!,tampered=new Uint8Array(before);tampered[12]^=1;
 f.data.set(f.address(ref),tampered);await assert.rejects(v.read(a,ref));
 f.data.set(f.address(ref),before);f.keys.delete(a.owner);await assert.rejects(v.read(a,ref));
});
test("Never commit a file after a session switch during encryption; reject oversized files",async()=>{
 const f=fixture(),old=f.crypto.seal;
 f.crypto.seal=async(...args)=>{const v=await old(...args);f.switchTo(b);return v};
 const v=f.vault();
 await assert.rejects(v.save(a,"draft-photo",new Uint8Array([7,8,9])));
 assert.equal(f.data.size,0);
 f.switchTo(a);
 await assert.rejects(v.save(a,"draft-photo",new Uint8Array(PRIVATE_FILE_MAX_BYTES+1)));
 assert.equal(f.data.size,0);
});
test("Never return decrypted bytes when session changes during read",async()=>{
 const f=fixture(),v=f.vault(),ref=await v.save(a,"report-evidence",new Uint8Array([10,20,30]));
 const old=f.crypto.open;
 let transient:Uint8Array|undefined;
 f.crypto.open=async(...args)=>{transient=await old(...args);f.switchTo(b);return transient};
 await assert.rejects(v.read(a,ref));
 assert.deepEqual([...transient!],[0,0,0]);
});
