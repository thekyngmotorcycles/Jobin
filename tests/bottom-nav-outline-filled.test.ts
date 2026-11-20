import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";

const load=(path:string)=>readFileSync(path,"utf8");
const tabs=load("src/app/(tabs)/_layout.tsx");
const icons=load("src/components/JobinTabIcon.tsx");
const messages=load("src/components/JobeenMessageIcon.tsx");
const visitor=load("src/components/ProfileCommunityActions.tsx");

test("All five bottom navigation items use an outlined idle icon and a solid selected icon",()=>{
 for(const route of ['name:"index"','name:"shop"','name:"videos"','name:"inbox"','name:"profile"']){
  assert.ok(tabs.includes(route),"Missing bottom tab "+route);
 }
 for(const id of ["index","shop","videos","profile"])
  assert.ok(icons.includes('name==="'+id+'"&&(focused'),"Missing active/inactive states for "+id);
 assert.ok(icons.includes('if(name==="inbox")return <JobeenMessageIcon size={size} color={color} filled={focused}/>;'));
 assert.ok(messages.includes("if(!filled)return"));
 assert.ok(messages.includes('fillRule="evenodd"'));
 assert.ok(icons.includes('fillRule="evenodd"'));
 assert.ok(icons.includes('fill={color}'));
});

test("Remove the oversized yellow selection circle without adding a replacement indicator",()=>{
 assert.ok(!tabs.includes('LIGHT_JOBEEN.yellow'));
 assert.ok(!tabs.includes('borderRadius:999'));
 assert.ok(!tabs.includes('pointerEvents="none" style={{position:"absolute",width:48,height:48'));
 assert.ok(!tabs.includes('tabBarInactiveTintColor:colors.muted'));
 assert.ok(tabs.includes('tabBarActiveTintColor:colors.ink,tabBarInactiveTintColor:colors.ink'));
});

test("Preserve Videos prominence, message badges, dark theme and safe area",()=>{
 assert.ok(tabs.includes('size={route.name==="videos"?(width<375?28:30):(width<375?23:25)}'));
 assert.ok(tabs.includes('route.name==="inbox"&&unreadInbox>0'));
 assert.ok(tabs.includes('tabBarHideOnKeyboard:true'));
 assert.ok(tabs.includes('height:NAVIGATION_ROW_HEIGHT+inset.bottom'));
 assert.ok(tabs.includes('paddingBottom:Math.max(5,inset.bottom)'));
 assert.ok(tabs.includes('const {colors}=useTheme()'));
 assert.ok(tabs.includes('tabBarBackground:()=> desktop?null:<NavigationFade/>'));
 assert.ok(tabs.includes('router.push(name as never)'));
 assert.ok(tabs.includes('tabBarButtonTestID:"tab-"+route.name'));
});

test("Visitor Send Message retains the approved solid double-bubble icon and its action",()=>{
 assert.ok(visitor.includes('<JobeenMessageIcon size={25} color={jobeen.ink}/>'));
 assert.ok(messages.includes('filled=true'));
 assert.ok(visitor.includes('accessibilityLabel={"Enviar mensaje a "+name}'));
 assert.ok(visitor.includes('router.push({pathname:"/message",params:{user,name}})'));
});

test("No accidental changes to either JCard accordion or visitor profile navigation",()=>{
 for(const path of ["src/app/(tabs)/profile.tsx","src/app/jcard.tsx"]){
  const page=load(path);
  assert.ok(page.includes('Animated.multiply(profileScrollY,0.5)'));
  assert.ok(page.includes('stickyHeaderIndices='));
  assert.ok(page.includes('topHeaderOffset=profileScrollY.interpolate('));
 }
});
