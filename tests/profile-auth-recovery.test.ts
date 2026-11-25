import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";
import ts from "typescript";
import * as navigation from "../src/lib/auth-navigation-phase.ts";
import {createWorkspaceSessionCache} from "../src/lib/workspace-session-cache.ts";
import * as lifetime from "../src/lib/session-lifetime.ts";
import {employmentMonths} from "../src/lib/employment.ts";

function load<T>(file:string,modules:Record<string,unknown>):T{
 const {outputText}=ts.transpileModule(readFileSync(file,"utf8"),{
  fileName:file,compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}
 });
 const module={exports:{}};
 new Function("require","module","exports",outputText)((name:string)=>{
  assert.ok(Object.hasOwn(modules,name),name);
  return modules[name];
 },module,module.exports);
 return module.exports as T;
}

const owner="00000000-0000-0000-0000-000000000001";
const other="00000000-0000-0000-0000-000000000002";
const sessionId="00000000-0000-0000-0000-000000000003";
const marker=(id:string)=>"fixture."+btoa(JSON.stringify({sub:id,session_id:sessionId}))+".fixture";
const scope={owner,session:lifetime.sessionMarkerKey(owner,marker(owner))};

test("a missing private contact table leaves the verified employment history readable",async()=>{
 let live=true;
 let historyError:object|null=null;
 let contactError:object|null={code:"PGRST205"};
 let reviewPending=false;
 let reviewError:object|null=null;
 let contactsReads=0;
 const record={owner_id:owner,client_id:"own",company:"Fixture",role:"HVAC",from_year:2020,from_month:1,to_year:2021,to_month:12};
 const db={rpc:(name:string)=>{
  assert.equal(name,"jobeen_own_employment_review_pending");
  return {data:reviewError?null:reviewPending,error:reviewError};
 },from:(table:string)=>({select:()=>({eq:(column:string,id:string)=>{
  assert.equal(column,"owner_id");assert.equal(id,owner);
  if(table==="jobeen_employment_private_contact")contactsReads++;
  return table==="jcard_employment_history"
   ?{error:historyError,data:historyError?null:[record,{...record,owner_id:other,client_id:"foreign"}]}
   :{error:contactError,data:contactError?null:[{owner_id:other,client_id:"own",contact:"foreign"}]};
 }})})};
 const cloud=load<typeof import("../src/lib/jcard-cloud")>("src/lib/jcard-cloud.ts",{
  "./supabase":{requireSupabase:()=>db},
  "./message-session":{captureMessageScope:async()=>scope,assertMessageScope:async()=>{if(!live)throw Error("session changed");}}
 });
 assert.deepEqual((await cloud.readCloudHistory(owner,scope)).map(r=>r.id),["own"]);
 const {rows,contactsAvailable}=await cloud.loadCloudHistory(owner,scope);
 assert.equal(contactsAvailable,false);
 assert.deepEqual(rows.map(r=>r.id),["own"]);
 assert.equal(employmentMonths(rows),24);
 const beforeSummary=contactsReads;
 const summary=await cloud.loadCloudHistory(owner,scope,false);
 assert.equal(contactsReads,beforeSummary);
 assert.equal(employmentMonths(summary.rows),24);
 assert.equal(summary.reviewPending,false);
 assert.equal(summary.contactsAvailable,false);
 contactError=null;
 assert.equal((await cloud.loadCloudHistory(owner,scope)).rows[0].contact,undefined);
 reviewPending=true;
 assert.equal((await cloud.loadCloudHistory(owner,scope)).reviewPending,true);
 reviewError={code:"PGRST202"};
 assert.equal((await cloud.loadCloudHistory(owner,scope)).reviewPending,false);
 reviewError={code:"PGRST301"};
 await assert.rejects(cloud.loadCloudHistory(owner,scope),/comprobar el estado/);
 reviewError=null;
 historyError={code:"PGRST301"};
 await assert.rejects(cloud.loadCloudHistory(owner,scope),cause=>cause===historyError);
 historyError=null;
 live=false;
 await assert.rejects(cloud.loadCloudHistory(owner,scope),/session changed/);
});

test("employment deletion stays bound to its originating account and session",async()=>{
 const calls:unknown[]=[];
 let current=scope;
 let returnedRow=true;
 let switchAfterDelete=false;
 const nextSession={owner:other,session:lifetime.sessionMarkerKey(other,marker(other))};
 const query={
  delete:()=>{calls.push(["delete"]);return query;},
  eq:(column:string,value:string)=>{calls.push([column,value]);return query;},
  is:(column:string,value:null)=>{calls.push([column,value]);return query;},
  select:(columns:string)=>{assert.equal(columns,"client_id");return query;},
  maybeSingle:async()=>{
   if(switchAfterDelete)current=nextSession;
   return {data:returnedRow?{client_id:"work"}:null,error:null};
  }
 };
 const assertCurrent=async(expected:typeof scope)=>{
  if(expected.owner!==current.owner||expected.session!==current.session)throw Error("session changed");
 };
 const cloud=load<typeof import("../src/lib/jcard-cloud")>("src/lib/jcard-cloud.ts",{
  "./supabase":{requireSupabase:()=>({from:(table:string)=>{assert.equal(table,"jcard_employment_history");return query;}})},
  "./message-session":{captureMessageScope:async(expected:typeof scope)=>{await assertCurrent(expected);return current;},assertMessageScope:assertCurrent}
 });
 current=nextSession;
 await assert.rejects(cloud.deleteCloudHistory("work",owner,scope),/session changed/);
 assert.deepEqual(calls,[]);
 current=scope;
 await cloud.deleteCloudHistory("work",owner,scope);
 assert.deepEqual(calls,[["delete"],["owner_id",owner],["client_id","work"],["verified_by",null]]);
 returnedRow=false;
 await assert.rejects(cloud.deleteCloudHistory("work",owner,scope),/no se puede eliminar/);
 returnedRow=true;switchAfterDelete=true;
 await assert.rejects(cloud.deleteCloudHistory("work",owner,scope),/session changed/);
});

test("AuthGate fails closed while offline and restores the session on foreground; sign-out is distinct",async()=>{
 const states:unknown[]=[];
 let cursor=0;
 let setup:(()=>void|(()=>void))|undefined;
 let foreground:(state:string)=>void=()=>{};
 let onAuth:(event:string,session:unknown)=>void=()=>{};
 const react={
  createContext:()=>({Provider:{}}),Fragment:{},useContext:()=>null,
  useRef:(current:unknown)=>({current}),
  useEffect:(effect:()=>void|(()=>void))=>{setup??=effect;},
  useState:(initial:unknown)=>{
   const index=cursor++;
   if(!(index in states))states[index]=initial;
   return [states[index],(value:unknown)=>{states[index]=value;}];
  }
 };
 const settle=()=>new Promise(resolve=>setTimeout(resolve,15));
 const session=(id:string)=>({user:{id,user_metadata:{account_setup_completed:true}},access_token:marker(id)});
 let current:ReturnType<typeof session>|null=session(owner);
 let offline=false;
 let refreshing=false;
 const supabase={
  auth:{
   getSession:async()=>refreshing&&offline
    ?{data:{session:null},error:new Error("network unavailable")}
    :{data:{session:current},error:null},
   getUser:async()=>({data:{user:offline?null:current?.user},error:offline?new Error("network unavailable"):null}),
   onAuthStateChange:(handler:typeof onAuth)=>{onAuth=handler;return {data:{subscription:{unsubscribe(){}}}};},
   startAutoRefresh:async()=>{},stopAutoRefresh:async()=>{}
  },
  from:()=>({select:()=>({eq:()=>({maybeSingle:async()=>({data:{username:"fixture",handle:"fixture",display_name:"Fixture"}})})})})
 };
 const {AuthGate}=load<typeof import("../src/components/AuthGate")>("src/components/AuthGate.tsx",{
  "react":react,"react/jsx-runtime":{jsx:(_type:unknown,props:unknown)=>props},
  "react-native":{AppState:{currentState:"active",addEventListener:(_event:string,fn:typeof foreground)=>{foreground=fn;return {remove(){}};}},Platform:{OS:"android"}},
  "expo-linking":{getInitialURL:async()=>null,getLinkingURL:()=>null,addEventListener:()=>({remove(){}})},
  "@react-native-async-storage/async-storage":{getItem:async()=>String(Date.now())},
  "../lib/auth-navigation-phase":navigation,"../lib/session-lifetime":lifetime,
  "../lib/supabase":{supabase},"../lib/auth-entry":{},"../lib/auth-entry-boundary":{isGoogleCallbackUrl:()=>false},
  "../lib/session-exit-fence":{sessionExitFence:{current:()=>false,subscribe:()=>()=>{}}}
 });
 const render=()=>{cursor=0;return AuthGate({children:null}) as unknown as {value:string};};
 render();
 const cleanup=setup?.();
 try{
  onAuth("INITIAL_SESSION",current);
  await settle();
  assert.equal(render().value,"signed-in");
  offline=true;foreground("background");foreground("active");
  await settle();
  assert.equal(render().value,"checking");
  refreshing=true;foreground("active");
  await settle();
  assert.equal(render().value,"checking");
  offline=false;refreshing=false;onAuth("TOKEN_REFRESHED",current);
  await settle();
  assert.equal(render().value,"signed-in");
  current=session(other);onAuth("SIGNED_IN",current);
  assert.equal(render().value,"checking");
  await settle();
  assert.equal(render().value,"signed-in");
  current=session(owner);onAuth("SIGNED_IN",current);
  assert.equal(render().value,"checking");
  await settle();
  assert.equal(render().value,"signed-in");
  current=null;onAuth("SIGNED_OUT",null);
  await settle();
  assert.equal(render().value,"signed-out");
 }finally{cleanup?.();}
});

test("profile loading settles on no verified identity, retries, and keeps authenticated refreshes scoped",async t=>{
 t.mock.timers.enable({apis:["setTimeout"]});
 const values:unknown[]=[];
 const refs:{current:unknown}[]=[];
 let cursor=0,refCursor=0;
 let onAuth:(event:string,session:unknown)=>void=()=>{};
 let focus:()=>void|(()=>void)=()=>{};
 let init:()=>void=()=>{};
 const react={
  useState:(initial:unknown)=>{
   const index=cursor++;
   if(!(index in values))values[index]=initial;
   return [values[index],(value:unknown)=>{values[index]=typeof value==="function"?value(values[index]):value;}];
  },
  useRef:(current:unknown)=>refs[refCursor++]??(refs[refCursor-1]={current}),
  useEffect:(effect:()=>void)=>{init=effect;},
  useCallback:(callback:unknown)=>callback
 };
 const session=(id:string,sessionMarker=sessionId)=>({user:{id},access_token:"fixture."+btoa(JSON.stringify({sub:id,session_id:sessionMarker}))+".fixture"});
 let current:ReturnType<typeof session>|null=null;
 let loader=async()=>({card:{id:owner}});
 const {useProfessionalData}=load<typeof import("../src/state/useProfessionalData")>("src/state/useProfessionalData.ts",{
  react,"expo-router":{useFocusEffect:(effect:typeof focus)=>{focus=effect;}},
  "../lib/supabase":{supabase:{auth:{getSession:async()=>({data:{session:current}}),
   onAuthStateChange:(handler:typeof onAuth)=>{onAuth=handler;return {data:{subscription:{unsubscribe(){}}}};}
  }}},
  "../lib/session-lifetime":lifetime,"../lib/message-session":{},"../lib/workspace-session-cache":{createWorkspaceSessionCache}
 });
 const render=()=>{cursor=0;refCursor=0;return useProfessionalData(loader,true);};
 const settle=()=>new Promise<void>(done=>setImmediate(done));
 render();init();
 const first=focus();
 await settle();
 assert.equal(render().loading,false);
 assert.match(render().error,/sesión del perfil/);
 assert.equal(render().data,null);
 first?.();

 current=session(owner);onAuth("SIGNED_IN",current);
 const second=focus();
 await settle();
 assert.equal(render().data?.card.id,owner);
 assert.equal(render().scope?.session,scope.session);
 assert.equal(render().error,"");
 onAuth("TOKEN_REFRESHED",{...current,access_token:marker(owner)+".renewed"});
 assert.equal(render().data?.card.id,owner);

 second?.();
 let finishA!: (value:{card:{id:string}})=>void;
 loader=()=>new Promise(resolve=>{finishA=resolve;});
 render();
 const pendingA=focus();
 await settle();
 loader=async()=>({card:{id:other}});
 current=session(other);onAuth("SIGNED_IN",current);
 render();
 const loadedB=focus();
 await settle();
 finishA({card:{id:owner}});
 await settle();
 assert.equal(render().data?.card.id,other,"late A cannot overwrite B");
 pendingA?.();loadedB?.();
 const newSessionId="00000000-0000-0000-0000-000000000004";
 loader=async()=>({card:{id:owner}});
 current=session(owner,newSessionId);onAuth("SIGNED_IN",current);
 render();
 const returnedA=focus();
 await settle();
 assert.equal(render().data?.card.id,owner);
 assert.equal(render().scope?.session,lifetime.sessionMarkerKey(owner,current.access_token));
 assert.notEqual(render().scope?.session,scope.session);
 returnedA?.();

 loader=()=>new Promise(()=>{});
 current=session(other);onAuth("SIGNED_IN",current);
 render();
 const third=focus();
 await settle();
 assert.equal(render().data,null);
 assert.equal(render().loading,true);
 t.mock.timers.tick(20_000);
 assert.equal(render().loading,false);
 assert.match(render().error,/recuperar la JCard/);
 assert.equal(render().data,null);
 third?.();
});

test("the workspace cache survives independent subscriptions and errors",async()=>{
 const memory=createWorkspaceSessionCache(),value={card:{id:owner}};
 memory.write(scope,value);
 let onAuth:(event:string,session:unknown)=>void=()=>{};
 let focus:()=>void|(()=>void)=()=>{};
 const localSession={user:{id:owner},access_token:marker(owner)};
 const {useProfessionalData}=load<typeof import("../src/state/useProfessionalData")>("src/state/useProfessionalData.ts",{
  react:{useState:(value:unknown)=>[value,()=>{}],useRef:(current:unknown)=>({current}),
   useEffect:(effect:()=>void)=>effect(),useCallback:(callback:unknown)=>callback},
  "expo-router":{useFocusEffect:(effect:typeof focus)=>{focus=effect;}},
  "../lib/supabase":{supabase:{auth:{getSession:async()=>({data:{session:localSession}}),
   onAuthStateChange:(handler:typeof onAuth)=>{onAuth=handler;return {data:{subscription:{unsubscribe(){}}}};}
  }}},
  "../lib/session-lifetime":lifetime,"../lib/message-session":{},"../lib/workspace-session-cache":{createWorkspaceSessionCache:()=>memory}
 });
 let calls=0;
 const failed=async()=>{calls++;throw Error("resource unavailable");};
 useProfessionalData(failed,false,true);
 onAuth("INITIAL_SESSION",localSession);
 assert.equal(memory.read(scope),value);
 const cleanup=focus();
 await new Promise<void>(done=>setImmediate(done));
 assert.equal(calls,1);
 assert.equal(memory.read(scope),value);
 cleanup?.();
 useProfessionalData(failed,false,true,false);
 focus();
 assert.equal(calls,1);
 useProfessionalData(async()=>value,true);
 onAuth("INITIAL_SESSION",localSession);
 assert.equal(memory.read(scope),value);
 onAuth("SIGNED_OUT",null);
 assert.equal(memory.read(scope),null);
});
