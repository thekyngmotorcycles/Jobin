
import test from "node:test";
import assert from "node:assert/strict";
import {createAuthEntryBoundary,parseGoogleCallback} from "../src/lib/auth-entry-boundary.ts";
test("Only the configured empty-host URI and a single valid code is accepted",()=>{
 assert.equal(parseGoogleCallback("jobin://?code=abc-123"),"abc-123");
 assert.equal(parseGoogleCallback("jobin:///?code=abc"),"abc");
 assert.equal(parseGoogleCallback("jobeen-security-pilot://?code=abc","jobeen-security-pilot"),"abc");
 assert.equal(parseGoogleCallback("jobin://?code=abc","jobeen-security-pilot"),null);
 for(const url of ["jobin://profile?code=abc","jobin://?code=a&code=b","jobin://?code=a#x","https://x/?code=a","jobin://?code=%0A","jobin://?code=%ZZ"])assert.equal(parseGoogleCallback(url),null);
});
test("Unsolicited, duplicate and expired callbacks cannot exchange",async()=>{
 let now=1000,calls=0;
 const boundary=createAuthEntryBoundary(()=>now),exchange=()=>boundary.exchange("jobin://?code=fixture",async()=>++calls);
 assert.equal(await exchange(),null);
 await boundary.google(async ready=>{ready()});
 assert.equal(await exchange(),1);assert.equal(await exchange(),null);
 await boundary.google(async ready=>{ready()});now+=300001;assert.equal(await exchange(),null);
 assert.equal(calls,1);
});
test("Pending OAuth blocks other entry until cancelled; in-flight exchange cannot be superseded",async()=>{
 const boundary=createAuthEntryBoundary();
 await boundary.google(async ready=>ready());
 await assert.rejects(boundary.exclusive(async()=>true));
 boundary.cancelPendingGoogle();assert.equal(await boundary.exclusive(async()=>true),true);
 await boundary.google(async ready=>ready());
 const result=await boundary.exchange("jobin://?code=fixture",async()=>{
  boundary.cancelPendingGoogle();
  await assert.rejects(boundary.exclusive(async()=>true));
  return 1;
 });
 assert.equal(result,1);assert.equal(await boundary.exclusive(async()=>true),true);
});
