
import test from "node:test";
import assert from "node:assert/strict";
import {createPrivateMetadataVault} from "../src/lib/private-metadata-vault.ts";
const owner="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const a={owner,session:"jobeen.session.started.v3."+owner+".a"};
const anew={owner,session:"jobeen.session.started.v3."+owner+".b"};
function fixture(){
 const data=new Map<string,string>();let active=a;
 const backend={
  async isAvailableAsync(){return true},
  async getItemAsync(k:string){return data.get(k)??null},
  async setItemAsync(k:string,v:string){data.set(k,v)},
  async deleteItemAsync(k:string){data.delete(k)}
 };
 const vault=()=>createPrivateMetadataVault(backend,async s=>assert.deepEqual(s,active));
 return {data,backend,vault,switchTo(s:typeof a){active=s}};
}
test("recovery is serialized with ordinary saves and can never overwrite a committed collection",async()=>{
 const f=fixture(),v=f.vault();let checks=0;
 const save=v.write("post-drafts",a,"new draft");
 const restore=v.restoreIfNeverInitialized("post-drafts",a,"historical draft",async()=>{checks++});
 await save;assert.equal(await restore,false);assert.equal(checks,0);
 assert.equal(await v.read("post-drafts",a),"new draft");
});
test("empty arrays and discarded video tombstones block historical recovery",async()=>{
 const f=fixture(),v=f.vault();
 await v.write("post-drafts",a,"[]");await v.write("flash-draft",a,"null");
 const proof=async()=>{throw Error("must not call")};
 assert.equal(await v.restoreIfNeverInitialized("post-drafts",a,"old",proof),false);
 assert.equal(await v.restoreIfNeverInitialized("flash-draft",a,"old",proof),false);
});
test("verified candidate can initialize once; repeat cannot replace recovered snapshot",async()=>{
 const f=fixture(),v=f.vault();let verified=0;
 const proof=async()=>{verified++};
 assert.equal(await v.restoreIfNeverInitialized("post-drafts",a,"fixture authorized",proof),true);
 assert.equal(verified,2);
 const restarted=f.vault();
 assert.equal(await restarted.read("post-drafts",a),"fixture authorized");
 assert.equal(await restarted.restoreIfNeverInitialized("post-drafts",a,"old",proof),false);
});
test("revocation during staging leaves no committed data and blocks blind retry",async()=>{
 const f=fixture(),v=f.vault();let calls=0;
 await assert.rejects(v.restoreIfNeverInitialized("post-drafts",a,"fixture",async()=>{if(++calls===2)throw Error("revoked")}));
 assert.equal(await v.read("post-drafts",a),null);
 assert.equal(await f.vault().restoreIfNeverInitialized("post-drafts",a,"fixture",async()=>{}),false);
});
test("change of session during revalidation cannot initialize a historical collection",async()=>{
 const f=fixture(),v=f.vault();
 await assert.rejects(v.restoreIfNeverInitialized("post-drafts",a,"fixture",async()=>{f.switchTo(anew)}));
 assert.equal(await f.vault().read("post-drafts",anew),null);
});
