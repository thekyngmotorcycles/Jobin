import test from "node:test";
import assert from "node:assert/strict";
import {sessionMarkerKey,sessionLifetimeState,SESSION_LIFETIME_MS} from "../src/lib/session-lifetime.ts";
const a="a1111111-1111-4111-8111-111111111111";
const b="b2222222-2222-4222-8222-222222222222";
const s1="11111111-1111-4111-8111-111111111111";
const s2="22222222-2222-4222-8222-222222222222";
function token(sub:string,session_id:string,exp=100){return "header."+Buffer.from(JSON.stringify({sub,session_id,exp})).toString("base64url")+".signature";}
test("Login metadata is isolated by account and actual session; refresh does not extend lifetime",()=>{
 assert.notEqual(sessionMarkerKey(a,token(a,s1)),sessionMarkerKey(b,token(b,s1)));
 assert.notEqual(sessionMarkerKey(a,token(a,s1)),sessionMarkerKey(a,token(a,s2)));
 assert.equal(sessionMarkerKey(a,token(a,s1,100)),sessionMarkerKey(a,token(a,s1,999)));
 assert.throws(()=>sessionMarkerKey(a,token(b,s1)));
 assert.throws(()=>sessionMarkerKey(a,"invalid"));
 assert.throws(()=>sessionMarkerKey(a,token(a,"invalid")));
});
test("Session lifetime fails closed after expiry or corrupt/future timestamps",()=>{
 const now=SESSION_LIFETIME_MS*3;
 assert.equal(sessionLifetimeState(null,now),"missing");
 assert.equal(sessionLifetimeState(String(now-1),now),"active");
 assert.equal(sessionLifetimeState(String(now-SESSION_LIFETIME_MS+1),now),"active");
 assert.equal(sessionLifetimeState(String(now-SESSION_LIFETIME_MS),now),"expired");
 for(const value of ["0","NaN","bad","-1",String(now+1),"1e10","1.2"]){assert.equal(sessionLifetimeState(value,now),"expired");}
});
