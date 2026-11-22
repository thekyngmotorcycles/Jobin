import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,readdirSync} from "node:fs";
import {classifyAuthNavigation} from "../src/lib/auth-navigation-phase.ts";
test("unsigned, unresolved and onboarding sessions never select signed-in routes",()=>{
 assert.equal(classifyAuthNavigation(false,false,"A",false),"checking");
 assert.equal(classifyAuthNavigation(true,true,"A",false),"checking");
 assert.equal(classifyAuthNavigation(true,false,null,false),"signed-out");
 assert.equal(classifyAuthNavigation(true,false,null,true),"signed-out");
 assert.equal(classifyAuthNavigation(true,false,"A",true),"onboarding");
 assert.equal(classifyAuthNavigation(true,false,"B",false),"signed-in");
});
test("Every root app route is explicitly protected, including routes formerly auto-registered",()=>{
 const layout=readFileSync("src/app/_layout.tsx","utf8");
 const matches=[...layout.matchAll(/<Stack\.Protected guard=\{phase==="([^"]+)"\}>([\s\S]*?)<\/Stack\.Protected>/g)];
 const routes=new Map<string,string>();
 for(const [,phase,group] of matches){
  for(const [,name] of group.matchAll(/<Stack\.Screen name="([^"]+)"/g)){
   assert.ok(!routes.has(name));routes.set(name,phase);
  }
 }
 const paths=readdirSync("src/app",{recursive:true}) as string[];
 for(const path of paths){
  if(!path.endsWith(".tsx")||path.endsWith("_layout.tsx")||path.startsWith("(tabs)/"))continue;
  const name=path.slice(0,-4);
  const expected=name==="security-loading"?"checking":name==="choose-username"?"onboarding":["login","account","recover-account"].includes(name)?"signed-out":"signed-in";
  assert.equal(routes.get(name),expected,name);
 }
 assert.equal(routes.get("(tabs)"),"signed-in");
 assert.ok(layout.includes('phase==="signed-in"&&isBrowserPage'));
 const gate=readFileSync("src/components/AuthGate.tsx","utf8");
 assert.ok(gate.includes("await supabase.auth.getUser()"));
 assert.ok(gate.includes("verified.data.user?.id!==owner"));
 assert.ok(!gate.includes("router.replace("));
});
