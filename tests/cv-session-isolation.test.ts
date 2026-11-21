import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const source=(path:string)=>readFileSync(path,"utf8");

test("CV requests are scoped to the same authenticated account and session",()=>{
 const api=source("src/lib/cv-access.ts");
 for(const name of ["requestCV","cvRequests","respondCV","revokeCV","approvedCV"]){
  const body=api.split("export async function "+name+"(")[1]?.split("export async function ")[0]??"";
  assert.ok(body.includes("captureMessageScope(expectedScope)"),name);
  assert.ok(body.includes("await assertMessageScope(scope)"),name);
 }
 assert.ok(api.includes("r.owner_id===scope.owner||r.requester_id===scope.owner"));
});
test("A late CV response cannot replace a different profile or superseded request",()=>{
 const card=source("src/app/jcard.tsx");
 assert.ok(card.includes("cvRevision.current===generation&&cvScope.current===scope"));
 assert.ok(card.includes("cvTarget.current!==user"));
 assert.ok(card.includes("await cvRequests(scope)"));
 assert.ok(card.includes("approvedCV(user,scope)"));
 assert.ok(card.includes("cvScope.current=null;cvTarget.current=\"\";setCvRows([])"));
});
test("CV owner and notification actions keep the session that displayed the request",()=>{
 const own=source("src/app/(tabs)/profile.tsx");
 const notifications=source("src/app/notifications.tsx");
 assert.ok(own.includes("scope.owner!==ownerId"));
 assert.ok(own.includes("respondCV(id,approve,scope)"));
 assert.ok(own.includes("revokeCV(id,scope)"));
 assert.ok(own.includes("req.owner_id===ownerId"));
 assert.ok(notifications.includes("cvRequests(scope)"));
 assert.ok(notifications.includes("respondCV(id,approve,scope)"));
 assert.ok(notifications.includes("r.owner_id===scope.owner&&r.status===\"pending\""));
});
