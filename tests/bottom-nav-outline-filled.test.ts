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
 assert.ok(tabs.includes('size={route.name==="videos"?(width<375?28:30):(width<375?23:25)}'));
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
