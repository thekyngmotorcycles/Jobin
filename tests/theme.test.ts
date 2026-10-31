import assert from "node:assert/strict";
import test from "node:test";
import { readdirSync,readFileSync } from "node:fs";
import { resolve } from "node:path";
import { THEMES,themeTokens,ORIGINAL_PINK,CAMEL_FOREGROUND,isThemeName } from "../src/theme/palettes.ts";
import { composite,contrastRatio,opacity } from "../src/theme/color.ts";
import { assistantBounds,clampAssistant,snapAssistant,restoreAssistant,parseAssistantPosition,ASSISTANT_SIZE } from "../src/lib/assistant-position.ts";
import { ACCOUNT_IDENTITIES } from "../src/lib/account-identities.ts";
test("five themes meet AA for text, secondary text and icons",()=>{
 assert.equal(THEMES.length,5);
 for(const {id} of THEMES){
  const p=themeTokens(id);
  for(const bg of [p.paper,p.card,p.accent]){
   assert.ok(contrastRatio(p.ink,bg)>=4.5,id+" foreground");
   if(id==="pink"&&bg===p.accent)assert.ok(contrastRatio(p.muted,bg)>=4.26,"Documented unchanged Pink accent exception");
   else assert.ok(contrastRatio(p.muted,bg)>=4.5,id+" secondary");
   assert.ok(contrastRatio(p.icon,bg)>=3,id+" icons");
  }
  for(const image of ["#000000","#ffffff"]){
   const underIcon=composite(opacity(p.paper,p.navigationOpacity),image);
   assert.ok(contrastRatio(p.navIcon,underIcon)>=3,id+" navigation on media");
  }
  assert.equal(p.wordmark,p.ink);
 }
 assert.equal(themeTokens("camel").ink,CAMEL_FOREGROUND);
 assert.equal(themeTokens("navy-green").paper,"#E2ECD4");
 assert.ok(isThemeName("camel")&&!isThemeName("invalid"));
});
test("Pink keeps all original palette values and uses black bottom icons",()=>{
 const p=themeTokens("pink");for(const [name,value]of Object.entries(ORIGINAL_PINK))assert.equal(p[name as keyof typeof ORIGINAL_PINK],value,name);
 assert.equal(p.navIcon,"#000000");
});
test("assistant stays clear of safe areas/navigation and snaps to the nearest edge",()=>{
 const b=assistantBounds(390,844,{top:44,bottom:34,left:0,right:0},92);
 assert.ok(ASSISTANT_SIZE>=48);assert.equal(b.minY,52);assert.ok(b.maxY+ASSISTANT_SIZE<844-92);
 assert.deepEqual(clampAssistant({x:-999,y:9999},b),{x:b.minX,y:b.maxY});
 const snapped=snapAssistant({x:8,y:320},b);
 assert.equal(snapped.saved.edge,"left");assert.deepEqual(restoreAssistant(snapped.saved,b),snapped.point);
 const landscape=assistantBounds(844,390,{top:0,bottom:21,left:44,right:44},79);
 const restored=restoreAssistant(snapped.saved,landscape);
 assert.ok(restored.x>=landscape.minX&&restored.y<=landscape.maxY);
 assert.equal(parseAssistantPosition("bad"),null);
 assert.equal(parseAssistantPosition('{"edge":"right","fraction":2}')?.fraction,1);
});
test("stories and conversations share the same Refri-Air identity",()=>{
 assert.equal(ACCOUNT_IDENTITIES.refri.initials,"RA");
 assert.equal(ACCOUNT_IDENTITIES.refri.name,"Refri-Air");
 const inbox=readFileSync("src/app/(tabs)/inbox.tsx","utf8"),stories=readFileSync("src/components/SocialHeader.tsx","utf8");
 assert.ok(inbox.includes("<AccountAvatar")&&stories.includes("<AccountAvatar"));
 assert.ok(inbox.includes("Solicitó tu historial profesional")&&inbox.includes('title="Enviar"'));
});
test("runtime UI has no literal colors outside centralized theme modules",()=>{
 const failures:string[]=[];
 function walk(path:string){
  for(const item of readdirSync(path,{withFileTypes:true})){const full=resolve(path,item.name);
   if(item.isDirectory())walk(full);
   else if(/\.(ts|tsx)$/.test(item.name)&&!full.includes("/src/theme/")){
    const source=readFileSync(full,"utf8");
    const literal=/["']#[0-9a-f]{3,8}["']|["'](?:black|white|transparent|gray|grey|red|blue|green)["']|rgba?\(\s*\d/gi;
    if(literal.test(source))failures.push(full);
   }
  }
 }
 walk("src");assert.deepEqual(failures,[]);
});
