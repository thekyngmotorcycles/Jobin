import test from "node:test";
import assert from "node:assert/strict";
import {createWorkspaceSessionCache} from "../src/lib/workspace-session-cache.ts";
const A={owner:"a",session:"a-1"}, B={owner:"b",session:"b-1"}, A2={owner:"a",session:"a-2"};
const workspace=(id:string)=>({card:{id},requests:[{private:"synthetic"}]});
test("Memory snapshot accepts only the exact owner and session",()=>{
 const cache=createWorkspaceSessionCache(),value=workspace("a");
 assert.equal(cache.write(A,value),true);
 assert.equal(cache.read({...A}),value);
 assert.equal(cache.read(B),null);
 assert.equal(cache.read(A),null);
});
test("A→B→A and a new login with same UUID cannot restore old workspace",()=>{
 const cache=createWorkspaceSessionCache();
 assert.equal(cache.write(A,workspace("a")),true);
 assert.equal(cache.write(B,workspace("b")),true);
 assert.equal(cache.read(A2),null);
 assert.equal(cache.read(B),null);
 assert.equal(cache.write(A2,workspace("a")),true);
 assert.equal(cache.read(A),null);
});
test("Foreign or malformed workspace never replaces an authenticated snapshot",()=>{
 const cache=createWorkspaceSessionCache();
 for(const value of [workspace("b"),{},null,{card:{id:4}}]){
  assert.equal(cache.write(A,workspace("a")),true);
  assert.equal(cache.write(A,value),false);
  assert.equal(cache.read(A),null);
 }
});
test("Logout or invalidation clears the snapshot even when the caller still knows the scope",()=>{
 const cache=createWorkspaceSessionCache();
 cache.write(A,workspace("a"));
 cache.clear();
 assert.equal(cache.read(A),null);
});
