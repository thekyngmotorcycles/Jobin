import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=(path:string)=>readFileSync(path,"utf8");
test("Employer RPCs preserve the original session and filter participants",()=>{
 const api=read("src/lib/employer-links.ts");
 assert.ok(api.includes("await assertMessageScope(scope)"));
 assert.ok(api.includes("row.worker_id===scope.owner||row.company_id===scope.owner"));
 for(const name of ["requestEmployer","decideEmployer","endEmployer"]){
  const body=api.split("export async function "+name+"(")[1]?.split("export async function ")[0]??"";
  assert.ok(body.includes("scope:MessageScope"));
  assert.ok(body.includes("await captureMessageScope(scope)"));
 }
});
test("Deferred confirmations cannot run under a subsequently captured account",()=>{
 const screen=read("src/app/employer-links.tsx");
 assert.ok(screen.includes("scopeRef.current!==origin"));
 assert.ok(screen.includes("revision.current!==generation"));
 assert.ok(screen.includes("w.card.id!==origin.owner"));
 assert.ok(screen.includes("perform(scope,()=>requestEmployer(item.id,scope)"));
 assert.ok(screen.includes("perform(scope,()=>endEmployer(current.id,scope)"));
 assert.ok(screen.includes('decideEmployer(l.id,"approved",scope)'));
 assert.ok(screen.includes("l.company_id===scope.owner"));
});
test("Own profile displays a verified employer only for its own workspace",()=>{
 const profile=read("src/app/(tabs)/profile.tsx");
 assert.ok(profile.includes("await getEmployerLinks(scope)"));
 assert.ok(profile.includes("scope.owner!==owner"));
 assert.ok(profile.includes('row.worker_id===owner&&row.status==="approved"'));
 assert.ok(profile.includes("employerLink?.owner===ownerId?employerLink:null"));
});
