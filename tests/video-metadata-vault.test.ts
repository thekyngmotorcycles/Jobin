import test from "node:test";
import assert from "node:assert/strict";
import {createPrivateMetadataVault} from "../src/lib/private-metadata-vault.ts";
const owner="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",scope={owner,session:"jobeen.session.started.v3."+owner+".session"};
test("Flash and Reel drafts are independent encrypted-store categories; discard is a committed tombstone",async()=>{
 const data=new Map<string,string>();
 const backend={async isAvailableAsync(){return true},async getItemAsync(k:string){return data.get(k)??null},async setItemAsync(k:string,v:string){data.set(k,v)},async deleteItemAsync(k:string){data.delete(k)}};
 const verify=async(s:typeof scope)=>{assert.deepEqual(s,scope)};
 const vault=createPrivateMetadataVault(backend,verify);
 await vault.write("flash-draft",scope,JSON.stringify({title:"Flash fixture"}));
 await vault.write("reel-draft",scope,JSON.stringify({title:"Reel fixture"}));
 await vault.write("flash-draft",scope,"null");
 const restarted=createPrivateMetadataVault(backend,verify);
 assert.equal(await restarted.read("flash-draft",scope),"null");
 assert.equal(await restarted.read("reel-draft",scope),JSON.stringify({title:"Reel fixture"}));
 assert.equal(await restarted.read("post-drafts",scope),null);
});
