import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=(path:string)=>readFileSync(path,"utf8");
const icon=read("src/components/JobeenMessageIcon.tsx");
const tabIcon=read("src/components/JobinTabIcon.tsx");
const tabs=read("src/app/(tabs)/_layout.tsx");
const visitor=read("src/components/ProfileCommunityActions.tsx");

test("Use the user's vectorized double-chat icon at both requested locations",()=>{
 assert.ok(icon.includes("viewBox=\"0 0 100 100\""));
 assert.ok(icon.includes('fillRule="evenodd"'));
 assert.ok(icon.includes("fill={color}"));
 assert.ok(icon.includes("two-overlapping-chat-bubbles"));
 assert.ok(tabIcon.includes('import {JobeenMessageIcon} from "./JobeenMessageIcon";'));
 assert.ok(tabIcon.includes('if(name==="inbox")return <JobeenMessageIcon size={size} color={color} filled={focused}/>;'));
 assert.ok(visitor.includes('import {JobeenMessageIcon} from "./JobeenMessageIcon";'));
 assert.ok(visitor.includes('<JobeenMessageIcon size={25} color={jobeen.ink}/>'));
 assert.ok(!visitor.includes('name="paper-plane-outline"'));
});

test("Keep navigation semantics, badges, contact request and message action unchanged",()=>{
 assert.ok(tabs.includes('{name:"inbox",title:"Mensajes"'));
 assert.ok(tabs.includes('<JobinTabIcon name={route.name}'));
 assert.ok(tabs.includes('route.name==="inbox"&&unreadInbox>0'));
 assert.ok(visitor.includes('accessibilityLabel={"Enviar mensaje a "+name}'));
 assert.ok(visitor.includes('router.push({pathname:"/message",params:{user,name}})'));
 assert.ok(visitor.includes('width:52,height:52'));
 assert.ok(visitor.includes('onPress={()=>void connect()}'));
 assert.ok(visitor.includes("JCardShareSheet"));
});

test("The three dots remain transparent in any theme and both icon surfaces reuse the same component",()=>{
 const start=icon.indexOf('<Path d="');
 assert.ok(start>=0);
 const paths=icon.match(/<Path d="/g)??[];
 assert.equal(paths.length,4,"Both outlined and filled versions have two overlapping silhouette paths");
 assert.ok(icon.includes('if(!filled)return'));
 assert.ok(icon.includes("filled=true"));
 assert.equal((icon.match(/<Circle cx=/g)??[]).length,3,"Outlined icon retains three solid message dots");
 const compound=icon.match(/<Path d="([^"]+)" fill=\{color\} fillRule="evenodd"\/>/);
 assert.ok(compound);
 assert.equal((compound[1].match(/\bM\s/g)??[]).length,4,"Foreground bubble and three transparent hole subpaths");
 assert.ok(!icon.includes('fill="#FFFFFF"'));
});
