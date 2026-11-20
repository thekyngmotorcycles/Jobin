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
 for(const id of ["index","shop","videos","profile"])
  assert.ok(icons.includes('name==="'+id+'"&&(focused'),"Missing both icon states "+id);
 assert.ok(icons.includes('if(name==="inbox")return <JobeenMessageIcon size={size} color={color} filled={focused}/>;'));
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
 assert.ok(icons.includes('viewBox=isLargeCanvas?"0 0 28 28":"2 2 24 24"'));
 assert.ok(icons.includes('strokeWidth:(isLargeCanvas?28:24)*1.55/size'));
 assert.ok(icons.includes('M3.7 10.2h20.6l-1.2 13.9H4.9l-1.2-13.9Z'));
 assert.ok(icons.includes('M3 24.4v-2.7c0-4.65 4.7-7.2 11-7.2s11 2.55 11 7.2v2.7H3Z'));
});
test("Video triangle uses the same centered geometry in both tab states",()=>{
 const centered='M10 9.6 18 14l-8 4.4V9.6Z';
 assert.equal(icons.split(centered).length-1,2);
 assert.ok(tabs.includes('(width<375?28:30)*1.15'));
 assert.ok(tabs.includes('width:48,height:48,alignItems:"center",justifyContent:"center"'));
});
