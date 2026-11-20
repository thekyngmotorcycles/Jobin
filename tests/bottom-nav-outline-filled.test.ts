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
 for(const id of ["index","profile"])
  assert.ok(icons.includes('name==="'+id+'"&&(focused'),"Missing both icon states "+id);
 assert.ok(icons.includes('name==="videos"&&<>'),"Missing Videos states");
 assert.ok(icons.includes('{focused\n    ?<Path d={HEXA_PLAY+'),"Missing filled Videos state");
 assert.ok(icons.includes('d={HEXA_PLAY} {...stroke}'),"Missing outlined Videos state");
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
 assert.ok(tabs.includes("paddingBottom:Math.max(7,inset.bottom+2)"));
 assert.ok(tabs.includes("paddingTop:3"));
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
 assert.ok(icons.includes('const HOME_FILLED='));
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

test("Home doorway has rounded shoulders and an open outline at the base",()=>{
 assert.ok(icons.includes("const HOME_OUTLINE="));
 assert.ok(icons.includes('H17.1";'));
 assert.ok(icons.includes("const HOME_DOOR_OUTLINE="));
 assert.ok(icons.includes("Q10.9 15.6 12.6 15.6 H15.4 Q17.1 15.6 17.1 17.3"));
 assert.ok(icons.includes("<Path d={HOME_OUTLINE} {...stroke}/>"));
 assert.ok(!icons.includes("<Path d={HOME_SILHOUETTE} {...stroke}/>"));
 assert.ok(icons.includes('<Path d={HOME_FILLED} fill={color}/>'));
 assert.ok(!icons.includes('HOME_SILHOUETTE+" "+HOME_DOOR'));
 assert.ok(icons.includes('H17.1 V17.3 Q17.1 15.6 15.4 15.6 H12.6 Q10.9 15.6 10.9 17.3 V24 Z'));
});
test("Message bubble outline has identical round weights without cropped edges",()=>{
 assert.equal(messages.split("strokeWidth={7.2}").length-1,2);
 assert.equal(messages.split('viewBox="-4 -4 108 108"').length-1,2);
 assert.ok(messages.includes('strokeLinecap="round" strokeLinejoin="round"'));
 assert.ok(messages.includes('fillRule="evenodd"'));
});
test("Tab bar gets breathing room without changing height, widths or safe-area clearance",()=>{
 assert.ok(tabs.includes("height:NAVIGATION_ROW_HEIGHT+inset.bottom"));
 assert.ok(tabs.includes("paddingTop:3,paddingBottom:Math.max(7,inset.bottom+2)"));
 assert.ok(tabs.includes('tabBarIconStyle:{height:48,width:48'));
 assert.ok(tabs.includes('width:48,height:48,alignItems:"center",justifyContent:"center"'));
});

test("Only Videos has a gentle shadow behind its honeycomb outline",()=>{
 assert.ok(icons.includes('name==="videos"&&<>'));
 assert.equal(icons.split('transform="translate(0 1.4)"').length-1,1);
 assert.equal(icons.split('transform="translate(0 0.8)"').length-1,1);
 assert.ok(icons.includes('opacity={0.075}'));
 assert.ok(icons.includes('opacity={0.07}'));
 assert.ok(!tabs.includes('shadowOpacity:0.16'));
});
test("Shared create hexagon softens every corner and preserves the action",()=>{
 const create=read("src/components/JobeenCreateIcon.tsx");
 const menu=read("src/components/JobeenCreateMenu.tsx");
 assert.ok(create.includes('M14.8 4.25 Q16 3.55 17.2 4.25'));
 assert.ok(create.includes('strokeLinecap="round" strokeLinejoin="round"'));
 assert.ok(create.includes('M16 10.7V21.3M10.7 16H21.3'));
 assert.ok(menu.includes('<JobeenCreateIcon size={30}/>'));
 assert.ok(menu.includes('onPress={()=>visible?setVisible(false):open()}'));
});
