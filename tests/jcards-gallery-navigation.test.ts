import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
const source=(path:string)=>readFileSync(path,"utf8");
const tabs=source("src/components/ProfileSharedSections.tsx");
const owner=source("src/app/(tabs)/profile.tsx");
const visitor=source("src/app/jcard.tsx");
const gallery=source("src/components/SavedJCardsGallery.tsx");
test("Owner tabs are Todo, JCards, Videos, En vivo, Acerca de in that order",()=>{
 const values=['id:"grid"','id:"jcards"','id:"videos"','id:"live"','id:"cv"'].map(id=>tabs.indexOf(id));
 assert.ok(values.every((x,i)=>x>0&&(i===0||x>values[i-1])));
 assert.ok(!tabs.includes('label:"Inicio"'));
 assert.ok(tabs.includes('label:"JCards"'));
 assert.ok(owner.includes("showPrivateJCards/>"));
 assert.ok(owner.includes('mode==="jcards"&&<SavedJCardsGallery/>'));
});
test("Saved JCards are private; visitor tabs do not expose owner gallery",()=>{
 assert.ok(tabs.includes('const visitorTabs=ownerTabs.filter(tab=>tab.id!=="jcards")'));
 assert.ok(tabs.includes("showPrivateJCards=false"));
 assert.ok(!visitor.includes("showPrivateJCards"));
 assert.ok(!visitor.includes("SavedJCardsGallery"));
 assert.ok(owner.includes('useState<Mode>("grid")'));
 assert.ok(visitor.includes('useState<ProfileSection>("grid")'));
});
test("Saved JCards are live references; only a genuinely empty collection shows an empty state",()=>{
 assert.ok(gallery.includes("Todavía no guardaste ninguna JCard"));
 assert.ok(gallery.includes("listSavedJCards"));
 assert.ok(gallery.includes("useFocusEffect"));
 assert.ok(gallery.includes("item.available"));
 assert.ok(!gallery.includes("AsyncStorage"));
 assert.ok(!gallery.includes("DEMO_SAVED_JCARDS"));
});
test("Preserve both already-approved parallax accordion interactions verbatim",()=>{
 for(const page of [owner,visitor]){
  assert.ok(page.includes("Animated.multiply(profileScrollY,0.5)"));
  assert.ok(page.includes("stickyHeaderIndices"));
  assert.ok(page.includes("topHeaderOffset=profileScrollY.interpolate("));
  assert.ok(page.includes("transform:[{translateY:heroParallax}]"));
  assert.ok(page.includes("setTabsPinned"));
 }
});
