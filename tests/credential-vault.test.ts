import assert from "node:assert/strict";
import test from "node:test";
import {createCredentialVault,type NativeSecretBackend} from "../src/lib/credential-vault.ts";
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
