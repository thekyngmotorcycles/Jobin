import {spawnSync} from "node:child_process";
import {existsSync,readFileSync} from "node:fs";
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
 await assert.rejects(f.client.protect(a,"draft-photo",photos,"image"),/No se pudo comprimir la fotografía/);
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

test("EAS upload ignore rules keep every tracked source of the local private Android module",()=>{
 // EAS applies ignore patterns even to tracked files. --no-index models that distinction.
 const files=["modules/jobeen-private-files/package.json","modules/jobeen-private-files/expo-module.config.json",
  "modules/jobeen-private-files/android/build.gradle",
  "modules/jobeen-private-files/android/src/main/AndroidManifest.xml",
  "modules/jobeen-private-files/android/src/main/java/expo/modules/jobeenprivatefiles/JobeenPrivateFilesModule.kt"];
 for(const path of files){
  assert.ok(existsSync(path),path+" must exist");
  const result=spawnSync("git",["check-ignore","--no-index","-q","--",path]);
  assert.equal(result.status,1,path+" must NOT be excluded from EAS upload");
 }
 for(const path of ["android/app/build.gradle","ios/Podfile",".env","node_modules/expo/package.json"]){
  assert.equal(spawnSync("git",["check-ignore","--no-index","-q","--",path]).status,0,path+" must remain ignored");
 }
 assert.equal(existsSync(".easignore"),false,"If a separate EAS ignore file is added, update this test to verify the actual EAS archive.");
});

// Source-level regression for the actual native adapter. Runtime BitmapFactory
// decoding and Android Keystore still require the next binary/device test.
test("native photo normalization happens before enforcing the two MiB encrypted limit",()=>{
 const source=readFileSync("modules/jobeen-private-files/android/src/main/java/expo/modules/jobeenprivatefiles/JobeenPrivateFilesModule.kt","utf8");
 assert.match(source,/PHOTO_SOURCE_LIMIT = 32 \* 1024 \* 1024/);
 assert.match(source,/private const val LIMIT = 2 \* 1024 \* 1024/);
 const read=source.slice(source.indexOf("  private fun readPicked("),source.indexOf("  private fun <T> safe"));
 assert.match(read,/val maximum = if \(normalize\) PHOTO_SOURCE_LIMIT else LIMIT/);
 assert.match(read,/val prepared = if \(normalize\) ByteArray\(LIMIT\) else bytes/);
 assert.match(read,/val written = if \(normalize\) normalizePhoto\(bytes, count, prepared\) else count[\s\S]*?if \(written !in 1\.\.LIMIT\) return@use -1[\s\S]*?output.write\(prepared/);
 assert.match(read,/if \(count == capacity && it.read\(\) != -1\) return@use -1/);
 assert.match(read,/options.inSampleSize = sample/);
 assert.match(read,/for \(quality in intArrayOf\(76, 64, 50\)\)/);
 assert.match(read,/compressed && !overflow && written in 1\.\.LIMIT/);
 assert.match(read,/bytes.fill\(0\)[\s\S]*?prepared.fill\(0\)/);
 assert.doesNotMatch(read,/FileOutputStream|createTempFile/);
});

test("publication picker accepts ten distinct photos while other callers retain their five-file bound",async()=>{
 const photos=Array.from({length:10},(_,i)=>({uri:"file:///"+i+".jpg"}));
 const f=fixture();const files=await f.client.protect(a,"draft-photo",photos,"image",undefined,10);
 assert.equal(files.length,10);assert.equal(new Set(files.map(x=>x.ref.id)).size,10);assert.equal(f.cleaned.length,10);
 const g=fixture();await assert.rejects(g.client.protect(a,"draft-photo",photos,"image"),/5 archivos/);assert.equal(g.buffers.size,0);
 const h=fixture();await assert.rejects(h.client.protect(a,"draft-photo",[...photos,{uri:"file:///11.jpg"}],"image",undefined,10),/10 archivos/);assert.equal(h.buffers.size,0);
 const j=fixture();await assert.rejects(j.client.protect(a,"report-evidence",photos,"image",undefined,10),/5 archivos/);assert.equal(j.buffers.size,0);
});
