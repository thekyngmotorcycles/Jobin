import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";

const source=(path:string)=>readFileSync(path,"utf8");
const tabs=source("src/components/ProfileSharedSections.tsx");
const owner=source("src/app/(tabs)/profile.tsx");
const visitor=source("src/app/jcard.tsx");
const ui=source("src/components/ui.tsx");
const posts=source("src/components/ProfileOwnedPosts.tsx");

test("Creator profiles use a scrollable five-section tab bar with accessible names and selected state",()=>{
 for(const label of ['label:"Inicio"','label:"Todo"','label:"Videos"','label:"En vivo"','label:"Acerca de"'])
  assert.ok(tabs.includes(label),"Missing label "+label);
 assert.ok(tabs.includes('export type ProfileSection="home"|"grid"|"cv"|"videos"|"live"'));
 assert.ok(tabs.includes("<ScrollView horizontal"));
 assert.ok(tabs.includes('accessibilityRole="tab"'));
 assert.ok(tabs.includes("accessibilityState={{selected}}"));
 assert.ok(tabs.includes("minHeight:50"));
 assert.ok(tabs.includes("borderBottomColor:jt.yellow"));
 assert.ok(tabs.includes("useReducedMotion()"));
});
test("Both own and public profile have separate scrolling hero, sticky tabs and section body",()=>{
 assert.ok(tabs.includes("export function ProfileIdentityHeader"));
 assert.ok(tabs.includes("ProfileFollowCounts userId={profileUserId}"));
 for(const page of [owner,visitor]){
  assert.ok(page.includes("ProfileIdentityHeader"));
  assert.ok(page.includes("ProfileSectionTabs"));
  assert.ok(page.includes("stickyHeaderIndices"));
  assert.ok(page.includes("setTabsPinned"));
  assert.ok(page.includes("setTabOffset"));
  assert.ok(page.includes("scrollTo({y:tabOffset,animated:!reducedMotion})"));
  assert.ok(page.includes('useState<')&&page.includes('("home")'));
 }
 assert.ok(owner.includes("stickyHeaderIndices={[1]}"));
 assert.ok(visitor.includes("stickyHeaderIndices={resource.data?[1]:undefined}"));
 assert.ok(ui.includes("stickyHeaderIndices={stickyHeaderIndices}"));
});
test("Creator Home uses real published work without inventing live viewers",()=>{
 assert.ok(owner.includes('heading="Trabajo reciente"'));
 assert.ok(visitor.includes('heading="Trabajo reciente"'));
 assert.ok(owner.includes('limit={6}'));
 assert.ok(visitor.includes('limit={6}'));
 assert.ok(posts.includes("tiles.slice(0,limit)"));
 assert.ok(posts.includes('accessibilityLabel="Ver todas las publicaciones"'));
 assert.ok(owner.includes('Sin transmisión activa verificada'));
 assert.ok(!owner.includes("19.5 k espectadores"));
});
test("Existing contact controls, JCard editor, and professional history remain reachable",()=>{
 assert.ok(owner.includes("showOwnerActions"));
 assert.ok(owner.includes("<NotificationBell/>"));
 assert.ok(owner.includes("<JobeenCreateMenu/>"));
 assert.ok(owner.includes('mode === "cv"'));
 assert.ok(owner.includes('ProfileOwnedPosts filter="live"'));
 assert.ok(visitor.includes("<ProfileCommunityActions"));
 assert.ok(visitor.includes('requestCV(user!)'));
 assert.ok(visitor.includes('section==="cv"'));
 assert.ok(visitor.includes('section==="live"'));
});

test("Creator section panels rise OVER the JCard instead of scrolling the card away",()=>{
 for(const page of [owner,visitor]){
  assert.ok(page.includes("Animated.ScrollView"),"Both views must use an animated parent scroller");
  assert.ok(page.includes("new Animated.Value(0)"),"Scroll position must be tracked on the native driver");
  assert.ok(page.includes("useNativeDriver:true"),"Do not re-render the full JCard every scroll frame");
  assert.ok(page.includes("transform:[{translateY:profileScrollY}]"),"Keep identity layer stationary while content covers it");
  assert.ok(page.includes("backgroundColor:jt.bg,zIndex:2"),"Opaque section body must cover the JCard beneath");
  assert.ok(page.includes("minHeight:screenHeight"),"Short feeds must still allow the section tabs to reach the top");
  assert.ok(page.includes("onLayout={event=>setTabOffset(event.nativeEvent.layout.y)}"),"Pin threshold must follow the measured panel");
 }
 assert.ok(owner.includes("contentContainerStyle={{paddingTop:12,paddingBottom:0}}"),"No transparent horizontal gutters around the sheet");
 assert.ok(visitor.includes('stickyHeaderIndices={resource.data?[1]:undefined}'));
});

test("Creator top bar keeps a truly translucent downward fade, not an opaque white surface",()=>{
 assert.ok(owner.includes('id="profileTopFade"'));
 assert.ok(owner.includes('id="profileTopShade"'));
 assert.ok(owner.includes('stopOpacity={0.92}'));
 assert.ok(owner.includes('stopOpacity={0}'));
 assert.ok(owner.includes('pointerEvents="none"'));
 assert.ok(owner.includes('<JobeenCreateMenu/>'));
 assert.ok(owner.includes('<NotificationBell/>'));
});
