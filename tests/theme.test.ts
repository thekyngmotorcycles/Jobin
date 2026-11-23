import assert from "node:assert/strict";
import test from "node:test";
import { readdirSync,readFileSync } from "node:fs";
import { resolve } from "node:path";
import { THEMES,THEME_PREFERENCES,themeTokens,isThemeName,isThemePreference,normalizeThemePreference,resolveThemePreference,ROYAL_HIVE_PALETTE } from "../src/theme/palettes.ts";
import { composite,contrastRatio,opacity } from "../src/theme/color.ts";
import { assistantBounds,clampAssistant,snapAssistant,restoreAssistant,parseAssistantPosition,ASSISTANT_SIZE } from "../src/lib/assistant-position.ts";
import { ACCOUNT_IDENTITIES } from "../src/lib/account-identities.ts";
test("Only Royal Hive light and dark are actual palettes, both meet AA",()=>{
 assert.deepEqual(THEMES.map(t=>t.id),["light","dark"]);
 for(const {id} of THEMES){
  const p=themeTokens(id),expected=ROYAL_HIVE_PALETTE[id];
  assert.equal(p.paper,expected.paper);assert.equal(p.card,expected.surface);
  assert.equal(p.primary,expected.primary);assert.equal(p.onPrimary,expected.onPrimary);
  for(const bg of [p.paper,p.card,p.accent]){
   assert.ok(contrastRatio(p.ink,bg)>=4.5,id+" foreground");
   assert.ok(contrastRatio(p.muted,bg)>=4.5,id+" secondary");
   assert.ok(contrastRatio(p.icon,bg)>=3,id+" icons");
  }
  assert.ok(contrastRatio(p.onPrimary,p.primary)>=4.5,id+" primary action");
  for(const image of ["#000000","#ffffff"]){
   const underIcon=composite(opacity(p.paper,p.navigationOpacity),image);
   assert.ok(contrastRatio(p.navIcon,underIcon)>=3,id+" navigation on media");
   assert.ok(contrastRatio(p.mediaText,composite(p.mediaCaption,image))>=4.5,id+" media caption");
  }
  assert.equal(p.wordmark,p.ink);
 }
});
test("System is a preference, not a third palette; removed preferences migrate safely",()=>{
 assert.deepEqual(THEME_PREFERENCES.map(t=>t.id),["light","dark","system"]);
 assert.ok(!isThemeName("system")&&isThemePreference("system"));
 for(const value of ["pink","camel","navy-green","sunflower",null,undefined,"invalid"]){
  assert.equal(isThemeName(value),false);assert.equal(isThemePreference(value),false);
  assert.equal(normalizeThemePreference(value),"system");
 }
 for(const mode of ["light","dark","system"] as const)assert.equal(normalizeThemePreference(mode),mode);
 assert.equal(resolveThemePreference("system","light"),"light");
 assert.equal(resolveThemePreference("system","dark"),"dark");
 assert.equal(resolveThemePreference("system",null),"light");
 assert.equal(resolveThemePreference("light","dark"),"light");
 assert.equal(resolveThemePreference("dark","light"),"dark");
 const provider=readFileSync("src/state/ThemeProvider.tsx","utf8");
 assert.ok(provider.includes("useColorScheme()"));
 assert.ok(provider.includes("normalizeThemePreference(value)"));
 assert.ok(provider.includes('Appearance.setColorScheme(preference==="system"?null:preference)'));
 assert.ok(provider.includes('AsyncStorage.setItem("jobin.theme",preference)'));
 const selector=readFileSync("src/app/menu/[section].tsx","utf8");
 assert.ok(selector.includes("THEME_PREFERENCES.map"));
 assert.ok(selector.includes("checked:preference===option.id"));
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
test("real stories use public JCard avatars while demo conversations retain their identity",()=>{
 assert.equal(ACCOUNT_IDENTITIES.refri.initials,"RA");
 assert.equal(ACCOUNT_IDENTITIES.refri.name,"Refri-Air");
 const inbox=readFileSync("src/app/(tabs)/inbox.tsx","utf8"),stories=readFileSync("src/components/StoryStrip.tsx","utf8"),header=readFileSync("src/components/SocialHeader.tsx","utf8");
 assert.ok(inbox.includes("<AccountAvatar")&&stories.includes("<PublicProfileAvatar"));
 assert.ok(header.includes("<StoryStrip")&&inbox.includes("<SocialHeader"));
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
