import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";
import ts from "typescript";

const author="a1111111-1111-4111-8111-111111111111";
const stranger="b2222222-2222-4222-8222-222222222222";
const follower="c3333333-3333-4333-8333-333333333333";
const contact="d4444444-4444-4444-8444-444444444444";
const settle=()=>new Promise<void>(resolve=>setImmediate(resolve));
const unavailable={code:"42P01",message:"relation does not exist"};
const business={name:"Public business"};
const routeSource=readFileSync("src/app/jcard.tsx","utf8");
const {outputText}=ts.transpileModule(routeSource,{
 fileName:"jcard.tsx",compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}
});

type Element={type:string;props:Record<string,unknown>};
function find(node:unknown,type:string):Element|undefined{
 if(Array.isArray(node))return node.map(child=>find(child,type)).find(Boolean);
 if(!node||typeof node!=="object"||!("props" in node))return;
 const element=node as Element;
 return element.type===type?element:find(element.props.children,type);
}

function mount(config:{
 viewer?:string;personal?:boolean;businessVisible?:boolean;requestedSide?:string;
 cardError?:Error;visibilityError?:Error;loadBusiness?:()=>Promise<unknown>;
}={}){
 const state:unknown[]=[],refs:{current:unknown}[]=[];
 const effects:(()=>void|(()=>void))[]=[];
 let cursor=0,refCursor=0,businessReads=0;
 let currentScope={owner:config.viewer??stranger,session:"viewer-session"};
 const route={user:author,card:config.requestedSide};
 const visibility={personal_enabled:config.personal??true,business_enabled:config.businessVisible??true};
 const module={exports:{}};
 const jsx=(type:string,props:Element["props"])=>({type,props});
 class AnimatedValue{interpolate() {return 0;}}
 const modules:Record<string,unknown>={
  react:{useState:(initial:unknown)=>{
   const index=cursor++;
   if(!(index in state))state[index]=initial;
   return [state[index],(next:unknown)=>{state[index]=next;}];
  },useRef:(initial:unknown)=>refs[refCursor++]??(refs[refCursor-1]={current:initial}),
  useCallback:(fn:unknown)=>fn,useEffect:()=>{}},
  "react/jsx-runtime":{jsx,jsxs:jsx,Fragment:"Fragment"},
  "react-native":{Animated:{Value:AnimatedValue,multiply:()=>new AnimatedValue(),event:()=>()=>{}},
   useWindowDimensions:()=>({height:720})},
  "expo-router":{Stack:{Screen:"Screen"},router:{},useLocalSearchParams:()=>route,
   useFocusEffect:(effect:()=>void|(()=>void))=>effects.push(effect)},
  "react-native-safe-area-context":{useSafeAreaInsets:()=>({top:0}),SafeAreaView:"SafeAreaView"},
  "react-native-reanimated":{useReducedMotion:()=>false},
  "../theme/navigation":{useTabClearance:()=>({contentBottom:0}),NAVIGATION_ROW_HEIGHT:50},
  "../theme/jobeen":{jobeenTokens:()=>({})},
  "../state/ThemeProvider":{useTheme:()=>({theme:"light"})},
  "../components/ui":{useUi:()=>({s:{},colors:{}})},
  "../lib/message-session":{
   captureMessageScope:async()=>currentScope,
   assertMessageScope:async(expected:typeof currentScope)=>{
    if(expected!==currentScope)throw Error("La sesión cambió.");
   }
  },
  "../lib/professional-api":{loadPublicCard:async(id:string)=>{
   if(config.cardError)throw config.cardError;
   return {id,name:"Personal profile",profileUrl:"jobin://jcard?user="+id};
  }},
  "../lib/jcard-visibility":{DEFAULT_JCARD_VISIBILITY:{},readJCardVisibility:async()=>{
   if(config.visibilityError)throw config.visibilityError;
   return visibility;
  }},
  "../lib/jcard-cloud":{readPublicBusinessCard:async()=>{
   businessReads++;
   return config.loadBusiness?config.loadBusiness():business;
  }}
 };
 const components=new Proxy({}, {get:(_target,key)=>String(key)});
 new Function("require","module","exports",outputText)((name:string)=>modules[name]??components,module,module.exports);
 const {default:Page}=module.exports as {default:()=>Element};
 function render(){cursor=0;refCursor=0;effects.length=0;return Page();}
 render();
 const close=effects[0]();
 return {
  read:()=>{
   const screen=render();
   const header=find(screen,"ProfileIdentityHeader");
   return {card:header?.props.card as Element|undefined,actions:header?.props.actions as Element|undefined,
    error:find(screen,"JCardLoadState")?.props.error,posts:find(screen,"ProfilePublicPosts")?.props.userId,
    businessReads};
  },
  switchSession:()=>{currentScope={owner:follower,session:"another-session"};},
  close:()=>{close?.();}
 };
}

test("an unrelated feed viewer gets the authorized personal profile before a 42P01 business failure",async()=>{
 let reject!: (reason:unknown)=>void;
 const pending=new Promise((_resolve,fail)=>{reject=fail;});
 const page=mount({loadBusiness:()=>pending,requestedSide:"business"});
 await settle();
 const during=page.read();
 reject(unavailable);
 await settle();
 assert.equal(during.posts,author);
 assert.equal(during.card?.props.initialSide,"personal");
 const after=page.read();
 assert.equal(after.posts,author);
 assert.equal(after.businessReads,1);
 assert.equal((after.card?.props.publicVisibility as {business_enabled:boolean}).business_enabled,false);
 assert.equal((after.card?.props.card as {business?:unknown}).business,undefined);
 page.close();
});

test("a follower and a contact can each load public posts and both authorized faces",async()=>{
 for(const viewer of [follower,contact]){
  const requestedSide=viewer===follower?"business":"personal";
  const page=mount({viewer,requestedSide});
  await settle();
  assert.equal(page.read().posts,author);
  assert.equal(page.read().card?.props.initialSide,requestedSide);
  assert.deepEqual((page.read().card?.props.card as {business:unknown}).business,business);
  page.close();
 }
});

test("hidden faces, rejected profiles and unreadable visibility remain closed",async()=>{
 for(const config of [
  {personal:false,businessVisible:false},
  {cardError:Error("Blocked or deactivated")},
  {visibilityError:Error("Visibility denied")}
 ]){
  const page=mount(config);
  await settle();
  assert.equal(page.read().card,undefined);
  assert.equal(page.read().posts,undefined);
  assert.equal(page.read().businessReads,0);
  page.close();
 }
 const missing=mount({personal:false,loadBusiness:async()=>{throw unavailable;}});
 await settle();
 assert.equal(missing.read().card,undefined);
 missing.close();
 const allowed=mount({personal:false});
 await settle();
 assert.equal((allowed.read().card?.props.publicVisibility as {personal_enabled:boolean}).personal_enabled,false);
 assert.equal(allowed.read().actions?.props.name,business.name);
 assert.equal(allowed.read().card?.props.initialSide,"business");
 allowed.close();
});

test("business arriving after a session change cannot complete the old snapshot",async()=>{
 let resolve!: (value:unknown)=>void;
 const page=mount({loadBusiness:()=>new Promise(done=>{resolve=done;})});
 await settle();
 assert.equal(page.read().posts,author);
 page.switchSession();
 resolve(business);
 await settle();
 assert.equal(page.read().card,undefined);
 assert.equal(page.read().posts,undefined);
 page.close();
});

test("the feed name and photo open the same author UUID from author_id",()=>{
 const feed=readFileSync("src/components/HomePublishedPosts.tsx","utf8");
 const social=readFileSync("src/lib/social-content.ts","utf8");
 const row=feed.slice(feed.indexOf("const authorRow="),feed.indexOf("Opciones de publicación",feed.indexOf("const authorRow=")));
 assert.match(social,/authorId:row\.author_id/);
 assert.match(feed,/router\.push\(\{pathname:"\/jcard",params:\{user:post\.authorId\}\}\)/);
 assert.equal((row.match(/onPress=\{profile\}/g)??[]).length,2);
 assert.match(row,/<PublicProfileAvatar userId=\{post\.authorId\}/);
 assert.match(row,/\{post\.authorName\}/);
});
