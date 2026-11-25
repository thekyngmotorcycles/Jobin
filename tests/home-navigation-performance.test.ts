import assert from "node:assert/strict";
import {readFileSync,readdirSync} from "node:fs";
import {createRequire} from "node:module";
import test from "node:test";
import ts from "typescript";
import {verifyMessageSession,type MessageScope} from "../src/lib/session-continuity.ts";
import {createSessionExitFence} from "../src/lib/session-exit-fence.ts";
import {sessionMarkerKey} from "../src/lib/session-lifetime.ts";
import type {FeedPost} from "../src/lib/social-content.ts";

const requireApp=createRequire(process.cwd()+"/package.json");
function fixture<T>(file:string,modules:Record<string,unknown>):T{
 const {outputText}=ts.transpileModule(readFileSync(file,"utf8"),{
  fileName:file,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}
 });
 const module={exports:{}};
 const unusedUI=new Proxy({}, {get:(_target,key)=>String(key)});
 new Function("require","module","exports",outputText)((name:string)=>modules[name]??unusedUI,module,module.exports);
 return module.exports as T;
}
function deferred<T>(){
 let resolve!: (value:T)=>void;
 const promise=new Promise<T>(done=>{resolve=done;});
 return {promise,resolve};
}
const settle=()=>new Promise<void>(resolve=>setImmediate(resolve));
const a="a1111111-1111-4111-8111-111111111111";
const b="b2222222-2222-4222-8222-222222222222";
const c="c3333333-3333-4333-8333-333333333333";
const first="d4444444-4444-4444-8444-444444444444";
const next="e5555555-5555-4555-8555-555555555555";
const token=(owner:string,session=first,signature="fixture")=>"fixture."+btoa(JSON.stringify({sub:owner,session_id:session}))+"."+signature;

test("SDK 54 resolves the root in every phase and the authorized Home from each tab and visitor profile",()=>{
 const file=requireApp.resolve("expo-router/build/fork/getStateFromPath");
 const requireRouter=createRequire(file);
 const parser={exports:{}};
 new Function("require","exports",readFileSync(file,"utf8"))((name:string)=>{
  // The real Expo parser runs in Node with its React Native-only imports stubbed.
  if(name==="@react-navigation/native")return {validatePathConfig(){}};
  if(name==="../constants")return {INTERNAL_SLOT_NAME:"__root"};
  return requireRouter(name);
 },parser.exports);
 const {getStateFromPath}=parser.exports as {getStateFromPath:(path:string,config:unknown,segments?:string[])=>{routes:{name:string;state?:{routes:{name:string}[]}}[]}};
 const {getRoutes}=requireApp("expo-router/build/getRoutes");
 const {getReactNavigationConfig}=requireApp("expo-router/build/getReactNavigationConfig");
 const keys=readdirSync("src/app",{recursive:true,encoding:"utf8"}).filter(path=>path.endsWith(".tsx")).map(path=>"./"+path);
 const routes=getRoutes(Object.assign(()=>({default:()=>null}),{keys:()=>keys}),{platform:"android"});
 const layout=readFileSync("src/app/_layout.tsx","utf8");
 assert.match(layout,/<Stack.Screen name="index"/);
 for(const phase of ["checking","signed-out","onboarding","signed-in"]){
  const enabled=[...(layout.match(new RegExp('<Stack.Protected guard=\\{phase==="'+phase+'"\\}>([\\s\\S]*?)<\\/Stack.Protected>'))?.[1]??"").matchAll(/<Stack.Screen name="([^"]+)"/g)];
  const names=new Set(["index","+not-found",...enabled.map(match=>match[1])]);
  const config=getReactNavigationConfig({...routes,children:routes.children.filter((route:{route:string})=>names.has(route.route))});
  assert.equal(getStateFromPath(new URL("jobin:///").pathname,config).routes[0].name,"index");
  let onboarded:string|undefined;
  const {default:Entry}=fixture<{default:()=>{type:string;props:{href?:string}}}>("src/app/index.tsx",{
   "expo-router":{Redirect:"Redirect",useLocalSearchParams:()=>({onboarded})},"../components/AuthGate":{useAuthNavigationPhase:()=>phase},
   "react/jsx-runtime":{jsx:(type:string,props:object)=>({type,props})}
  });
  const entry=Entry();
  if(phase==="checking")assert.equal(entry.props.href,undefined);
  if(phase==="signed-out")assert.equal(entry.props.href,"/login");
  if(phase==="onboarding")assert.equal(entry.props.href,"/choose-username");
  if(phase!=="signed-in"){
   assert.notEqual(getStateFromPath("/(tabs)",config).routes[0].name,"(tabs)");
   continue;
  }
  assert.equal(entry.props.href,"/(tabs)");
  onboarded="1";
  assert.equal(Entry().props.href,"/videos");
  for(const previous of [["(tabs)"],["(tabs)","shop"],["(tabs)","videos"],["(tabs)","inbox"],["(tabs)","profile"],["jcard"]]){
   const route=getStateFromPath("/(tabs)",config,previous).routes[0];
   assert.equal(route.name,"(tabs)");
   assert.equal(route.state?.routes.at(-1)?.name,"index");
  }
 }
 assert.match(readFileSync("src/components/PersistentBottomTabs.tsx","utf8"),/label:"Casa",path:"\/\(tabs\)"/);
});

test("simultaneous getUser work stays scoped through A→B→C→A, renewals and sign-out",async()=>{
 let access=token(a),owner:string|null=a;
 let requests=0;
 const checks=new Map<number,ReturnType<typeof deferred<{data:{user:{id:string}|null};error:Error|null}>>>();
 const fence=createSessionExitFence();
 const {captureMessageScope}=fixture<typeof import("../src/lib/message-session")>("src/lib/message-session.ts",{
  "./supabase":{requireSupabase:()=>({auth:{
   getSession:async()=>({data:{session:owner?{user:{id:owner},access_token:access}:null},error:null}),
   getUser:()=>{const check=deferred<{data:{user:{id:string}|null};error:Error|null}>();checks.set(++requests,check);return check.promise;}
  }})},
  "./account-scope":{assertAccountOwner:async(expectedOwner:string,session:string)=>{
   if(expectedOwner!==owner||session!==sessionMarkerKey(expectedOwner,access))throw Error("La sesión cambió.");
   fence.assertOpen(session);
  }},
  "./session-lifetime":{sessionMarkerKey},"./session-continuity":{verifyMessageSession},"./session-exit-fence":{sessionExitFence:fence}
 });
 const result=(id:string)=>({data:{user:{id}},error:null});
 const batch=Promise.allSettled(Array.from({length:20},()=>captureMessageScope()));
 await settle();
 assert.equal(requests,1);
 owner=b;access=token(b);
 const forB=captureMessageScope();
 await settle();
 checks.get(2)?.resolve(result(b));
 assert.equal((await forB).owner,b);
 owner=c;access=token(c);
 const forC=Promise.allSettled([captureMessageScope()]);
 await settle();
 checks.get(3)?.resolve({data:{user:null},error:Error("No hay conexión")});
 assert.equal((await forC)[0].status,"rejected");
 const retryC=captureMessageScope();
 await settle();
 checks.get(4)?.resolve(result(c));
 assert.equal((await retryC).owner,c);

 owner=a;access=token(a,next);
 const returned=captureMessageScope();
 await settle();
 checks.get(1)?.resolve(result(a));
 assert.ok((await batch).every(result=>result.status==="rejected"));
 access=token(a,next,"refreshed");
 const refreshed=captureMessageScope();
 await settle();
 assert.equal(requests,6);
 checks.get(5)?.resolve(result(a));
 checks.get(6)?.resolve(result(a));
 const final=await refreshed;
 assert.equal((await returned).session,final.session);
 const fresh=Promise.allSettled([captureMessageScope(final)]);
 await settle();
 assert.equal(requests,7,"a completed verification is never cached");
 await fence.close(final.session,async()=>{
  await assert.rejects(captureMessageScope(final),/cerrando/);
  owner=null;
  checks.get(7)?.resolve(result(a));
  assert.equal((await fresh)[0].status,"rejected");
 });
});

test("returning to Home requests the current audience and never displays revoked or late posts",async t=>{
 t.mock.timers.enable({apis:["setTimeout"]});
 const state:unknown[]=[],refs:{current:unknown}[]=[];
 const focusEffects:(()=>void|(()=>void))[]=[];
 let cursor=0,refCursor=0,requests=0,filterQueries=0;
 let activeScope:MessageScope={owner:a,session:"A"};
 let request=deferred<FeedPost[]>();
 const jsx=(type:string,props:object)=>({type,props});
 const {HomePublishedPosts}=fixture<{HomePublishedPosts:(props:object)=>unknown}>("src/components/HomePublishedPosts.tsx",{
  "react":{useState:(initial:unknown)=>{
   const i=cursor++;
   if(!(i in state))state[i]=initial;
   return [state[i],(value:unknown)=>{state[i]=value;}];
  },useRef:(initial:unknown)=>refs[refCursor++]??(refs[refCursor-1]={current:initial}),useCallback:(fn:unknown)=>fn},
  "react/jsx-runtime":{jsx,jsxs:jsx},
  "expo-router":{useFocusEffect:(fn:()=>void|(()=>void))=>focusEffects.push(fn)},
  "../state/ThemeProvider":{useTheme:()=>({theme:"light"})},"../theme/jobeen":{jobeenTokens:()=>({})},
  "../lib/message-session":{captureMessageScope:async()=>activeScope,assertMessageScope:async(origin:MessageScope)=>{
   if(origin!==activeScope)throw Error("La sesión cambió.");
  }},
  "../lib/social-content":{loadHomePosts:()=>{requests++;return request.promise;}},
  "../lib/feed-preferences":{getHiddenPostIds:async()=>[],getSavedPostIds:async()=>[]},
  "../lib/supabase":{requireSupabase:()=>{filterQueries++;throw Error("Default Home does not query filter metadata");}}
 });
 function render(){
  cursor=0;refCursor=0;focusEffects.length=0;
  return HomePublishedPosts({});
 }
 const post={id:"fixture-post",authorId:b} as FeedPost;
 render();
 const firstFocus=focusEffects[0]();
 request.resolve([post]);
 await settle();
 assert.match(JSON.stringify(render()),/fixture-post/);
 focusEffects[1]();
 assert.equal(filterQueries,0);
 firstFocus?.();
 request=deferred();
 render();
 const secondFocus=focusEffects[0]();
 await settle();
 assert.doesNotMatch(JSON.stringify(render()),/fixture-post/);
 request.resolve([]);
 await settle();
 assert.doesNotMatch(JSON.stringify(render()),/fixture-post/);
 secondFocus?.();
 request=deferred();
 render();
 const thirdFocus=focusEffects[0]();
 await settle();
 activeScope={owner:c,session:"C"};
 request.resolve([post]);
 await settle();
 assert.doesNotMatch(JSON.stringify(render()),/fixture-post/);
 assert.equal(requests,3);
 thirdFocus?.();
 request=deferred();
 render();
 const slowFocus=focusEffects[0]();
 await settle();
 t.mock.timers.tick(20_000);
 assert.match(JSON.stringify(render()),/Vuelve a intentarlo/);
 request.resolve([post]);
 await settle();
 assert.doesNotMatch(JSON.stringify(render()),/fixture-post/);
 slowFocus?.();
});

test("batched author avatars make no request and visibility-sensitive avatars authorize independently",async()=>{
 let calls=0;
 let effect:()=>void|(()=>void)=()=>{};
 const {PublicProfileAvatar}=fixture<typeof import("../src/components/PublicProfileAvatar")>("src/components/PublicProfileAvatar.tsx",{
  react:{useState:()=>[undefined,()=>{}],useEffect:(fn:typeof effect)=>{effect=fn;}},
  "./social-ui":{Avatar:"Avatar"},
  "react/jsx-runtime":{jsx:(type:string,props:object)=>({type,props})},
  "../lib/personal-jcard-photo":{personalAvatarUrl:(path:string|null|undefined)=>path??undefined},
  "../lib/message-session":{captureMessageScope:async()=>({owner:a,session:"A"}),assertMessageScope:async()=>{}},
  "../lib/professional-api":{loadPublicCard:async()=>{calls++;return {};}}
 });
 const batched=PublicProfileAvatar({userId:b,name:"Fixture",avatarPath:"synthetic-avatar"});
 effect();
 assert.equal((batched as unknown as {props:{uri:string}}).props.uri,"synthetic-avatar");
 assert.equal(calls,0);
 const restricted=PublicProfileAvatar({userId:b,name:"Fixture",avatarPath:"synthetic-avatar",respectJCardVisibility:true});
 const cleanup=effect();
 await settle();
 assert.equal((restricted as unknown as {props:{uri?:string}}).props.uri,undefined);
 assert.equal(calls,1);
 cleanup?.();
});
