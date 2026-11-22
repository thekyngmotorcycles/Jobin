import assert from "node:assert/strict";
import test from "node:test";
import {createPrivateMetadataVault,METADATA_MAX_PARTS,METADATA_PART_BYTES} from "../src/lib/private-metadata-vault.ts";
import type {NativeSecretBackend} from "../src/lib/credential-vault.ts";
import {readFileSync} from "node:fs";
const ownerA="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",ownerB="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const scope=(owner:string,id:string)=>({owner,session:"jobeen.session.started.v3."+owner+"."+id});
const a=scope(ownerA,"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1"),b=scope(ownerB,"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1");
const anew=scope(ownerA,"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2");
function fixture(){
 const values=new Map<string,string>();
 let current=a,available=true,fail:(key:string)=>boolean=()=>false,hook:(key:string)=>void=()=>{};
 const backend:NativeSecretBackend={
  async isAvailableAsync(){return available},
  async getItemAsync(key){hook(key);return values.get(key)??null},
  async setItemAsync(key,value){if(fail(key))throw Error("fixture secret");values.set(key,value);hook(key)},
  async deleteItemAsync(key){values.delete(key)}
 };
 const verify=async(s:typeof a)=>{assert.deepEqual(s,current)};
 return {values,backend,verify,vault:()=>createPrivateMetadataVault(backend,verify),switchTo(s:typeof a){current=s},availability(v:boolean){available=v},failWith(f:(key:string)=>boolean){fail=f},onAccess(f:(key:string)=>void){hook=f}};
}
test("owner and category remain isolated across sign-out and a new verified session",async()=>{
 const f=fixture(),v=f.vault();
 await v.write("post-drafts",a,"A draft");await v.write("jshop-drafts",a,"A shop");
 f.switchTo(b);assert.equal(await v.read("post-drafts",b),null);await v.write("post-drafts",b,"B draft");
 await assert.rejects(v.read("post-drafts",a));await assert.rejects(v.write("post-drafts",a,"stale"));
 f.switchTo(anew);const restarted=f.vault();
 assert.equal(await restarted.read("post-drafts",anew),"A draft");
 assert.equal(await restarted.read("jshop-drafts",anew),"A shop");
});
test("interrupted replacement preserves the prior committed snapshot after restart",async()=>{
 const f=fixture(),v=f.vault(),value="á漢🙂".repeat(1400);
 await v.write("post-drafts",a,value);
 f.failWith(key=>key.endsWith(".bank.1.part.1"));
 await assert.rejects(v.write("post-drafts",a,"next".repeat(1000)),/almacenamiento privado/);
 f.failWith(()=>false);const restarted=f.vault();
 assert.equal(await restarted.read("post-drafts",a),value);
 await restarted.write("post-drafts",a,"[]");
 assert.equal(await restarted.read("post-drafts",a),"[]");
 for(const [key,stored] of f.values){assert.ok(Buffer.byteLength(stored,"utf8")<=METADATA_PART_BYTES);assert.ok(!key.includes(".bank.0."))}
});
test("session changes during staging cannot commit a stale edit",async()=>{
 const f=fixture(),v=f.vault();await v.write("jshop-drafts",a,"original");
 f.onAccess(key=>{if(key.endsWith(".bank.1.part.0"))f.switchTo(b)});
 await assert.rejects(v.write("jshop-drafts",a,"stale edit"),/almacenamiento privado/);
 f.onAccess(()=>{});assert.equal(await v.read("jshop-drafts",b),null);
 f.switchTo(anew);assert.equal(await f.vault().read("jshop-drafts",anew),"original");
});
test("no fallback when storage unavailable, active chunk missing, or input oversized",async()=>{
 const f=fixture(),v=f.vault();await v.write("post-drafts",a,"original");
 await assert.rejects(v.write("post-drafts",a,"x".repeat(METADATA_MAX_PARTS*METADATA_PART_BYTES+1)),/almacenamiento privado/);
 assert.equal(await v.read("post-drafts",a),"original");
 f.availability(false);await assert.rejects(v.read("post-drafts",a),/almacenamiento privado/);f.availability(true);
 const part=[...f.values.keys()].find(key=>key.endsWith(".part.0"))!;
 f.values.delete(part);await assert.rejects(v.read("post-drafts",a),/almacenamiento privado/);
});
test("native draft metadata uses a separate SecureStore service and no legacy fallback",()=>{
 const read=(p:string)=>readFileSync(p,"utf8");
 const native=read("src/lib/private-metadata-storage.native.ts");
 assert.ok(native.includes('keychainService:"jobeen.private.metadata.v1"'));
 assert.ok(native.includes("createPrivateMetadataVault(backend,assertMessageScope)"));
 assert.ok(!native.includes("AsyncStorage"));
 for(const p of ["src/lib/post-drafts.ts","src/lib/jshop-local.ts"]){
  const source=read(p);
  assert.ok(source.includes("privateMetadataStorage.read("));
  assert.ok(source.includes("privateMetadataStorage.write("));
  assert.ok(!source.includes("AsyncStorage"));
 }
 assert.ok(read("src/lib/private-metadata-storage.ts").includes('if(Platform.OS!=="web")throw'));
});
