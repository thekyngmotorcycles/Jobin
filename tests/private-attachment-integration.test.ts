import assert from "node:assert/strict";
import {createCipheriv,createDecipheriv,randomBytes,randomUUID} from "node:crypto";
import test from "node:test";
import {createPrivateFileVault} from "../src/lib/private-file-vault.ts";
import {assertEvidenceSession,createPrivateAttachments,PRIVATE_ATTACHMENT_LIMIT} from "../src/lib/private-attachment.ts";
import type {MessageScope} from "../src/lib/session-continuity.ts";

const owner="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const other="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const scope=(id:string,session:string)=>({owner:id,session:"jobeen.session.started.v3."+id+"."+session});
const a=scope(owner,"one"),a2=scope(owner,"two"),b=scope(other,"one");
const jpeg=Uint8Array.of(255,216,255,4,5,6),pdf=Uint8Array.of(37,80,68,70,45,5,6);
function fixture(){
 let current=a,oversized=false,changeDuringRead=false;
 const buffers=new Map<string,Uint8Array>(),keys=new Map<string,Buffer>(),cleaned:string[]=[],reads:string[]=[];
 const verify=async(s:MessageScope)=>assert.deepEqual(s,current);
 const getKey=(id:string)=>{const key=keys.get(id)??randomBytes(32);keys.set(id,key);return key;};
 const vault=createPrivateFileVault({
  async randomId(){return randomUUID();},
  async seal(user,plain,aad){
   const nonce=randomBytes(12),cipher=createCipheriv("aes-256-gcm",getKey(user),nonce);
   cipher.setAAD(Buffer.from(aad));
   return Buffer.concat([nonce,cipher.update(plain),cipher.final(),cipher.getAuthTag()]);
  },
  async open(user,cipher,aad){
   const opener=createDecipheriv("aes-256-gcm",keys.get(user)!,cipher.subarray(0,12));
   opener.setAAD(Buffer.from(aad));opener.setAuthTag(cipher.subarray(-16));
   return Buffer.concat([opener.update(cipher.subarray(12,-16)),opener.final()]);
  },
 },{
  async create(location,cipher){buffers.set(location.owner+"/"+location.id,new Uint8Array(cipher));},
  async read(location,max){
   const cipher=buffers.get(location.owner+"/"+location.id)!;
   assert.ok(cipher.length<=max);return new Uint8Array(cipher);
  },
 },verify);
 const client=createPrivateAttachments({...vault,
  readPicked(uri,output,shouldNormalize){
   reads.push(uri);
   assert.equal(output.length,PRIVATE_ATTACHMENT_LIMIT);
   const content=uri.endsWith(".pdf")?pdf:jpeg;
   assert.equal(shouldNormalize,uri.startsWith("file:"));
   output.set(content);
   return oversized?-1:content.length;
  },
  discardImagePickerCopy(uri){cleaned.push(uri);},
 },async actor=>{
  await verify(actor);
  if(changeDuringRead){changeDuringRead=false;current=b;}
 });
 return {client,buffers,reads,cleaned,switchTo(next:MessageScope){current=next;},
  tooBig(){oversized=true;},switchDuringRead(){changeDuringRead=true;}};
}

test("selection stores ciphertext, recovers for the same owner after sign-in, and cleans only picker copies",async()=>{
 const f=fixture(),asset={uri:"file:///cache/ImagePicker/synthetic.jpg"};
 const [file]=await f.client.protect(a,"draft-photo",[asset],"image");
 assert.deepEqual(f.cleaned,[asset.uri]);
 assert.ok(!JSON.stringify(file).includes(asset.uri));
 const encrypted=f.buffers.get(owner+"/"+file.ref.id)!;
 assert.notDeepEqual(encrypted,jpeg);
 f.switchTo(b);
 await assert.rejects(f.client.use(b,"draft-photo",file,()=>assert.fail("different owner read")));
 await assert.rejects(f.client.use(a,"draft-photo",file,()=>assert.fail("closed session read")));
 f.switchTo(a2);
 let used:Uint8Array|undefined;
 await f.client.use(a2,"draft-photo",file,bytes=>{assert.deepEqual(Array.from(bytes),Array.from(jpeg));used=bytes;});
 assert.ok(used?.every(byte=>byte===0));
 encrypted[13]^=2;
 await assert.rejects(f.client.use(a2,"draft-photo",file,()=>assert.fail("corrupt ciphertext reached preview")));
});

test("oversize or switched session leaves no usable reference and cleans every returned cache copy",async()=>{
 const photos=[{uri:"file:///first.jpg"},{uri:"file:///second.jpg"}];
 const f=fixture();f.tooBig();
 await assert.rejects(f.client.protect(a,"draft-photo",photos,"image"),/2 MiB/);
 assert.deepEqual(f.cleaned,photos.map(x=>x.uri));
 assert.equal(f.buffers.size,0);
 const g=fixture();g.switchDuringRead();
 await assert.rejects(g.client.protect(a,"draft-photo",photos,"image"));
 assert.deepEqual(g.cleaned,photos.map(x=>x.uri));
 assert.equal(g.buffers.size,0);
});

test("evidence never unlinks a provider original and stays assigned to its selected session",async()=>{
 const f=fixture();
 const [file]=await f.client.protect(a,"report-evidence",[{uri:"content://provider/test.pdf"}],"document",["application/pdf"]);
 assert.equal(file.mime,"application/pdf");
 assert.deepEqual(f.cleaned,[]);
 const pending={...file,session:a.session,name:"Test document"};
 assert.doesNotThrow(()=>assertEvidenceSession(pending,a));
 assert.throws(()=>assertEvidenceSession(pending,a2));
 assert.throws(()=>assertEvidenceSession(pending,b));
});
