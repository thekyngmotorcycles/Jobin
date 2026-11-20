import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";

const read=(path:string)=>readFileSync(path,"utf8");
const tabs=read("src/app/(tabs)/_layout.tsx");
const icons=read("src/components/JobinTabIcon.tsx");
const messages=read("src/components/JobeenMessageIcon.tsx");

test("Five tabs switch from an outline to a fill without changing routes",()=>{
 for(const route of ['name:"index"','name:"shop"','name:"videos"','name:"inbox"','name:"profile"'])
  assert.ok(tabs.includes(route),"Missing tab "+route);
 for(const id of ["index","videos","profile"])
  assert.ok(icons.includes('name==="'+id+'"&&(focused'),"Missing both icon states "+id);
 assert.ok(icons.includes('if(name==="inbox")return <JobeenMessageIcon size={size} color={color} filled={focused}/>;'));
 assert.ok(icons.includes('if(name==="shop")return <Ionicons name={focused?"bag-handle":"bag-handle-outline"}'));
 assert.ok(messages.includes("if(!filled)return"));
 assert.ok(messages.includes('fillRule="evenodd"'));
 assert.ok(icons.includes('fillRule="evenodd"'));
 assert.ok(tabs.includes('router.push(name as never)'));
 assert.ok(tabs.includes('tabBarButtonTestID:"tab-"+route.name'));
});
test("Selected tab uses icon fill, never a large colored circle",()=>{
 assert.ok(!tabs.includes('LIGHT_JOBEEN.yellow'));
 assert.ok(!tabs.includes("backgroundColor:selected?"));
 assert.ok(!tabs.includes("borderRadius:999"));
 assert.ok(tabs.includes('tabBarActiveTintColor:colors.ink,tabBarInactiveTintColor:colors.ink'));
});
test("Keep Videos bigger, keyboard behavior, notification badge and inset",()=>{
 assert.ok(tabs.includes('size={route.name==="videos"?(width<375?28:30)*1.15:(width<375?23:25)}'));
 assert.ok(tabs.includes('route.name==="inbox"&&unreadInbox>0'));
 assert.ok(tabs.includes("tabBarHideOnKeyboard:true"));
 assert.ok(tabs.includes("height:NAVIGATION_ROW_HEIGHT+inset.bottom"));
 assert.ok(tabs.includes("paddingBottom:Math.max(5,inset.bottom)"));
 assert.ok(tabs.includes('tabBarBackground:()=> desktop?null:<NavigationFade/>'));
 assert.ok(tabs.includes('route.name==="videos"&&(pathname==="/streams"||pathname.endsWith("/streams"))'));
 assert.ok(tabs.includes('const {colors}=useTheme()'));
});
test("Message bubbles have both hollow and solid modes with transparent holes",()=>{
 assert.ok(messages.includes('filled=true'));
 assert.ok(messages.includes('<Circle cx={23.5}'));
 assert.ok(messages.includes('fillRule="evenodd"'));
 assert.ok(!messages.includes('fill="#FFFFFF"'));
});

test("Optical sizing balances Casa, JShop and Perfil against Mensajes",()=>{
 assert.ok(icons.includes('viewBox=isVideo?"0 0 52 52":name==="streams"?"0 0 28 28":"2 2 24 24"'));
 assert.ok(icons.includes('strokeWidth:coordinateSize*1.55/size'));
 assert.ok(icons.includes('const HOME_SILHOUETTE='));
 assert.ok(icons.includes('const PROFILE_SHOULDERS='));
 assert.ok(icons.includes('if(name==="shop")return <Ionicons name={focused?"bag-handle":"bag-handle-outline"}'));
});
test("Video triangle uses the same centered geometry in both tab states",()=>{
 assert.ok(icons.includes('const HEXA_PLAY='));
 assert.ok(icons.includes('const HEXA_TRIANGLE='));
 assert.ok(icons.includes('d={HEXA_PLAY+" "+HEXA_TRIANGLE}'));
 assert.ok(icons.includes('d={HEXA_TRIANGLE} {...stroke}'));
 assert.ok(!icons.includes('<Rect '));
 assert.ok(tabs.includes('(width<375?28:30)*1.15'));
 assert.ok(tabs.includes('width:48,height:48,alignItems:"center",justifyContent:"center"'));
});

test("Chats reuse the approved Messages icon while JShop keeps its bag-handle",()=>{
 const inbox=read("src/app/(tabs)/inbox.tsx");
 assert.ok(inbox.includes('import {JobeenMessageIcon} from "../../components/JobeenMessageIcon"'));
 assert.ok(inbox.includes('option.key==="chats"?<JobeenMessageIcon size={22} color={t.ink} filled={false}/>'));
 assert.ok(inbox.includes('<Ionicons name="bag-handle-outline" size={22} color={t.ink}/>'));
 assert.ok(inbox.includes('accessibilityState={{selected}}'));
 assert.ok(inbox.includes('onPress={()=>setTab(option.key)}'));
});
test("Approved rounded honeycomb icon rule is preserved for future work",()=>{
 const rules=read("AGENTS.md");
 assert.ok(rules.includes("Norma visual de iconografía Jobeen"));
 assert.ok(rules.includes("Hexa Play A"));
 assert.ok(rules.includes("No compilar ni generar un APK sin autorización explícita"));
 assert.ok(icons.includes('strokeLinecap:"round"'));
 assert.ok(icons.includes('strokeLinejoin:"round"'));
});
