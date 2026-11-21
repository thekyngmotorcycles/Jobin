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
  assert.ok(page.includes("Animated.multiply(profileScrollY,0.5)"),"Identity hero must move at half the main sheet speed");
  assert.ok(page.includes("transform:[{translateY:heroParallax}]"),"Use native-driven parallax rather than freezing the JCard");
  assert.ok(page.includes("backgroundColor:jt.bg,zIndex:2"),"Opaque section body must cover the JCard beneath");
  assert.ok(page.includes("minHeight:screenHeight"),"Short feeds must still allow the section tabs to reach the top");
  assert.ok(page.includes("onLayout={event=>setTabOffset(event.nativeEvent.layout.y)}"),"Pin threshold must follow the measured panel");
 }
 assert.ok(owner.includes("contentContainerStyle={{paddingTop:NAVIGATION_ROW_HEIGHT+12,paddingBottom:0}}"),"The profile must scroll behind its top chrome with no blank gutters");
 assert.ok(owner.includes("style={{flex:1}}"),"Scroll content must start at the top safe area, not below a static header");
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

test("Creator tabs replace top navigation in three stages and respect the status bar",()=>{
 for(const page of [owner,visitor]){
  assert.ok(page.includes("retreatStart=Math.max(1,tabOffset-NAVIGATION_ROW_HEIGHT)"));
  assert.ok(page.includes("retreatEnd=Math.max(retreatStart+1,tabOffset)"));
  assert.ok(page.includes("topHeaderOffset=profileScrollY.interpolate("));
  assert.ok(page.includes("topHeaderOpacity=profileScrollY.interpolate("));
  assert.ok(page.includes("outputRange:[0,0,-NAVIGATION_ROW_HEIGHT]"));
  assert.ok(page.includes("transform:[{translateY:topHeaderOffset}]"));
  assert.ok(page.includes("opacity:topHeaderOpacity"));
  assert.ok(page.includes("pointerEvents={tabsPinned?\"none\":\"auto\"}"));
 }
 assert.ok(owner.includes("const insets=useSafeAreaInsets()"),"Use the device safe area for the brand header");
 assert.ok(owner.includes('top:insets.top,left:0,right:0,zIndex:10'),"Do not overlap Android status-bar indicators");
 assert.ok(visitor.includes('<Stack.Screen options={{headerShown:false}}/>'),"The public native stack bar must not block sticky tabs");
 assert.ok(visitor.includes('accessibilityLabel="Volver"'),"Public profile retains a back action");
 assert.ok(visitor.includes("paddingTop:NAVIGATION_ROW_HEIGHT+20"));
});

test("Floating brand chrome starts below status bar without changing the approved JCard scroll",()=>{
 assert.ok(owner.includes('top:insets.top,left:0,right:0,zIndex:10'));
 assert.ok(owner.includes('height:NAVIGATION_ROW_HEIGHT'));
 assert.ok(owner.includes('contentContainerStyle={{paddingTop:NAVIGATION_ROW_HEIGHT+12,paddingBottom:0}}'));
 assert.ok(owner.includes("Animated.multiply(profileScrollY,0.5)"));
 assert.ok(owner.includes("outputRange:[0,0,-NAVIGATION_ROW_HEIGHT]"));
 assert.ok(owner.includes("stickyHeaderIndices={[1]}"));
});

test("Visitor and owned profile headers share safe-area coordinates and premium gradient",()=>{
 assert.ok(visitor.includes("top:insets.top,left:0,right:0,zIndex:10"));
 assert.ok(visitor.includes("paddingHorizontal:16,paddingVertical:8"));
 assert.ok(visitor.includes('id="publicProfileTopFade"'));
 assert.ok(visitor.includes("stopOpacity={0.92}"));
 assert.ok(visitor.includes("stopOpacity={0}"));
 assert.ok(visitor.includes("opacity:.62"));
 assert.ok(visitor.includes('accessibilityLabel="Volver"'));
 assert.ok(!visitor.includes('resource.data?.handle?`@'));
 assert.ok(visitor.includes("backgroundColor:jt.bg"));
});
test("Visitor profile keeps global tabs while scrolling JCard and media sections",()=>{
 const root=source("src/app/_layout.tsx");
 const global=source("src/components/PersistentBottomTabs.tsx");
 const state=source("src/state/ScrollNavigation.tsx");
 const tabLayout=source("src/app/(tabs)/_layout.tsx");
 assert.ok(root.includes('pathname==="/jcard"'));
 assert.ok(root.includes("<PersistentBottomTabs/>"));
 assert.ok(global.includes('items.map(item=><Pressable'));
 for(const label of ["Casa","JShop","Videos","Mensajes","Perfil"])assert.ok(global.includes('label:"'+label+'"'));
 assert.ok(state.includes("amount.current+delta/100"));
 assert.ok(state.includes("progress.setValue(amount.current)"));
 assert.ok(tabLayout.includes('<BottomTabBar {...props}/>'));
 for(const page of [visitor,owner])assert.ok(page.includes("reportScroll(event.nativeEvent.contentOffset.y)"));
});
test("Primary feeds progressively retract and reveal navigation on scroll",()=>{
 for(const path of ["src/app/(tabs)/index.tsx","src/app/jshop.tsx","src/app/(tabs)/inbox.tsx","src/app/(tabs)/videos.tsx","src/app/search.tsx"]){
  const page=source(path);
  assert.ok(page.includes("useScrollNavigation"),path+" needs shared scroll state");
  assert.ok(page.includes("onScroll={e=>reportScroll(e.nativeEvent.contentOffset.y)}"),path+" needs scroll listener");
 }
});
