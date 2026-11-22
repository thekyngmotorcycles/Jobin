import assert from "node:assert/strict";
import test from "node:test";
import {createCredentialVault,VAULT_PART_BYTES,VAULT_MAX_PARTS,type NativeSecretBackend} from "../src/lib/credential-vault.ts";
const key="sb-test-project-auth-token";
function fixture(){
 const values=new Map<string,string>(),calls:string[]=[];
 let available=true,fail=false;
 const backend:NativeSecretBackend={
  async isAvailableAsync(){return available;},
  async getItemAsync(name){calls.push("read:"+name);if(fail)throw Error("synthetic secret");return values.get(name)??null;},
  async setItemAsync(name,value){calls.push("write:"+name);if(fail)throw Error(value);values.set(name,value);},
  async deleteItemAsync(name){calls.push("delete:"+name);if(fail)throw Error("synthetic secret");values.delete(name);}
 };
 return {backend,calls,values,available(v:boolean){available=v;},fail(v:boolean){fail=v;}};
}
test("candidate vault isolates configured credential namespace and never consults legacy keys",async()=>{
 const f=fixture(),vault=createCredentialVault(f.backend,key);
 f.values.set(key,"legacy-fixture");
 assert.equal(await vault.getItem(key),null);
 await vault.setItem(key,"new-test-value");await vault.setItem(key+"-code-verifier","pkce-test");
 assert.equal(await vault.getItem(key),"new-test-value");
 assert.equal(await vault.getItem(key+"-code-verifier"),"pkce-test");
 assert.throws(()=>vault.getItem("sb-other-auth-token"),/no permitida/);
 assert.equal(f.values.get(key),"legacy-fixture");
 await vault.removeItem(key);assert.equal(await vault.getItem(key),null);
 assert.equal(f.values.get(key),"legacy-fixture");
});
test("unavailable or failing native store fails closed and redacts backend errors",async()=>{
 const f=fixture(),vault=createCredentialVault(f.backend,key);
 f.available(false);await assert.rejects(vault.setItem(key,"test-secret"),/Almacenamiento seguro/);
 assert.deepEqual(f.calls,[]);
 f.available(true);f.fail(true);
 await assert.rejects(vault.setItem(key,"test-secret"),e=>e instanceof Error&&/Almacenamiento seguro/.test(e.message)&&!e.message.includes("test-secret"));
 f.fail(false);await vault.setItem(key,"recovery-fixture");assert.equal(await vault.getItem(key),"recovery-fixture");
});
test("queued sign-out removes credentials after earlier writes",async()=>{
 const f=fixture(),vault=createCredentialVault(f.backend,key);
 await Promise.all([vault.setItem(key,"fixture"),vault.removeItem(key)]);
 assert.equal(await vault.getItem(key),null);
});

test("large Unicode session values fit bounded native entries and survive adapter restart",async()=>{
 const f=fixture(),vault=createCredentialVault(f.backend,key);
 const large=JSON.stringify({token:"fixture",name:"á漢🙂".repeat(1400)});
 await vault.setItem(key,large);
 assert.ok(f.values.size>2);
 for(const value of f.values.values())assert.ok(Buffer.byteLength(value,"utf8")<=VAULT_PART_BYTES);
 const restarted=createCredentialVault(f.backend,key);
 assert.equal(await restarted.getItem(key),large);
 await restarted.setItem(key,"smaller");
 assert.equal(await restarted.getItem(key),"smaller");
 assert.equal(f.values.size,2,"old chunks must be removed on shrink");
 await restarted.removeItem(key);assert.equal(f.values.size,0);
});
test("interrupted credential replacement never returns an older or mixed session",async()=>{
 const f=fixture(),initial=createCredentialVault(f.backend,key);
 await initial.setItem(key,"old-fixture");
 const failing:NativeSecretBackend={...f.backend,async setItemAsync(name,value){
  if(name.endsWith(".part.1"))throw Error("fixture failure");
  await f.backend.setItemAsync(name,value);
 }};
 await assert.rejects(createCredentialVault(failing,key).setItem(key,"new".repeat(1000)),/Almacenamiento seguro/);
 const restarted=createCredentialVault(f.backend,key);
 await assert.rejects(restarted.getItem(key),/Almacenamiento seguro/);
 await restarted.removeItem(key);
 assert.equal(await restarted.getItem(key),null);assert.equal(f.values.size,0);
});
test("interrupted sign-out is unreadable after restart and can be retried safely",async()=>{
 const f=fixture(),vault=createCredentialVault(f.backend,key);
 await vault.setItem(key,"fixture".repeat(900));
 const failing:NativeSecretBackend={...f.backend,async deleteItemAsync(name){
  if(name.endsWith(".part.1"))throw Error("fixture failure");
  await f.backend.deleteItemAsync(name);
 }};
 await assert.rejects(createCredentialVault(failing,key).removeItem(key),/Almacenamiento seguro/);
 const restarted=createCredentialVault(f.backend,key);
 await assert.rejects(restarted.getItem(key),/Almacenamiento seguro/);
 await restarted.removeItem(key);
 assert.equal(await restarted.getItem(key),null);assert.equal(f.values.size,0);
});
test("corrupt or oversized values cannot silently load or overwrite credentials",async()=>{
 const f=fixture(),vault=createCredentialVault(f.backend,key);
 await vault.setItem(key,"valid-fixture");
 await assert.rejects(vault.setItem(key,"x".repeat(VAULT_PART_BYTES*VAULT_MAX_PARTS+1)),/Almacenamiento seguro/);
 assert.equal(await vault.getItem(key),"valid-fixture");
 const part=[...f.values.keys()].find(name=>name.endsWith(".part.0"))!;
 f.values.delete(part);
 await assert.rejects(vault.getItem(key),/Almacenamiento seguro/);
 await vault.removeItem(key);
 assert.equal(await vault.getItem(key),null);
});
