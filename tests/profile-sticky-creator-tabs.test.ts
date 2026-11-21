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
 assert.ok(tabs.includes("borderBottomWidth:3,borderBottomColor:selected?jt.yellow:jt.bg"),"Selection must not move icons or labels vertically");
 assert.ok(tabs.includes('fontWeight:selected?"700":"600",color:jt.ink'),"Inactive labels stay readable");
 assert.ok(tabs.includes('size={18} color={jt.ink}'),"Tab icons use balanced contrast and size");
 assert.ok(tabs.includes("minWidth:92"),"Five profile controls share minimum width");
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
  assert.ok(page.includes("smoothHeroParallax=heroParallax.interpolate({inputRange:[0,320],outputRange:[0,320],extrapolate:\"clamp\"})"),"Clamp overscroll to prevent sudden JCard recoil");
  assert.ok(page.includes("transform:[{translateY:smoothHeroParallax}]"),"Use native-driven parallax rather than freezing the JCard");
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
 assert.ok(visitor.includes("paddingTop:NAVIGATION_ROW_HEIGHT+12"));
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
 assert.ok(state.includes("amount.current+controlledDelta/SCROLL_HIDE_DISTANCE"));
 assert.ok(state.includes("progress.setValue(amount.current)"));
 assert.ok(tabLayout.includes('<BottomTabBar {...props}/>'));
 for(const page of [visitor,owner])assert.ok(!page.includes("reportScroll("),"Profile scroll must not hide bottom navigation");
 assert.ok(global.includes('return <View pointerEvents="auto"'),"Public navigation is fixed");
 assert.ok(!global.includes("progress.interpolate"),"Public navigation must never fade on scroll");
});
test("Only Home feed retracts navigation; all other pages keep bottom bar static",()=>{
 const home=source("src/app/(tabs)/index.tsx");
 const tabLayout=source("src/app/(tabs)/_layout.tsx");
 const global=source("src/components/PersistentBottomTabs.tsx");
 assert.ok(home.includes("useScrollNavigation"));
 assert.ok(home.includes("if(focused)reportScroll(e.nativeEvent.contentOffset.y)"));
 assert.ok(tabLayout.includes('const homeFeed=pathname==="/"||pathname==="/index"||pathname==="/(tabs)/index"'));
 assert.ok(tabLayout.includes('pointerEvents={homeFeed&&hidden?"none":"auto"}'));
 assert.ok(tabLayout.includes('opacity:homeFeed?progress.interpolate('));
 assert.ok(tabLayout.includes('translateY:homeFeed?progress.interpolate('));
 assert.ok(global.includes('<View pointerEvents="auto"'));
 assert.ok(!global.includes("useScrollNavigation"));
 for(const path of ["src/app/jshop.tsx","src/app/(tabs)/inbox.tsx","src/app/(tabs)/videos.tsx","src/app/search.tsx","src/app/(tabs)/profile.tsx","src/app/jcard.tsx"]){
  const page=source(path);
  assert.ok(!page.includes("reportScroll("),path+" must not hide bottom navigation");
  assert.ok(!page.includes("useScrollNavigation"),path+" must not subscribe to Home scroll");
 }
});

// Regression contract for approved option 2: native-driven route reveal and
// immediate vertical ownership of the JCard scroll gesture.
test("Tab transitions reveal bottom chrome progressively without a snap or stale scroll",()=>{
 const state=source("src/state/ScrollNavigation.tsx");
 const root=source("src/app/_layout.tsx");
 const ownerPage=source("src/app/(tabs)/profile.tsx");
 const homePage=source("src/app/(tabs)/index.tsx");
 assert.ok(root.includes("useEffect(()=>reset(),[pathname,reset])"));
 assert.ok(state.includes("const ROUTE_REVEAL_DURATION=240"));
 assert.ok(state.includes("Animated.timing(progress"));
 assert.ok(state.includes("useNativeDriver:true"));
 assert.ok(state.includes("transitioning.current"));
 assert.ok(state.includes("if(transitioning.current){last.current=current;return;}"));
 assert.ok(state.includes("SCROLL_HIDE_DISTANCE=160"));
 assert.ok(state.includes("const controlledDelta=Math.max(-20,Math.min(20,delta))"),"A single fling must not hide navigation in one frame");
 assert.ok(homePage.includes("if(focused)reportScroll("));
 assert.ok(!ownerPage.includes("reportScroll("));
 assert.ok(!visitor.includes("reportScroll("));
});
test("JCard vertical dragging is released early while horizontal flips remain intact",()=>{
 const card=source("src/components/BusinessCard3D.tsx");
 assert.ok(card.includes("Gesture.Pan().enabled(enabled).activeOffsetX([-16,16]).failOffsetY([-7,7])"));
 assert.ok(card.includes("Gesture.Tap().enabled(enabled).maxDistance(7).maxDuration(240)"));
 assert.ok(card.includes("Gesture.Exclusive(pan,tap)"));
 assert.ok(card.includes("if(moving.value){lift.value=withSpring(1,SPRING);moving.value=false;}"));
 assert.ok(card.includes("onSide(next)"));
});

test("Public JCard aligns with owner profile and stays reachable above fixed tabs",()=>{
 assert.ok(visitor.includes('style={{flex:1}} overScrollMode="never" bounces={false} alwaysBounceVertical={false}'));
 assert.ok(visitor.includes('paddingTop:NAVIGATION_ROW_HEIGHT+12,paddingBottom:contentBottom'));
 assert.ok(visitor.includes('paddingTop:20,paddingBottom:20,minHeight:screenHeight'));
 assert.ok(visitor.includes('stickyHeaderIndices={resource.data?[1]:undefined}'));
 assert.ok(visitor.includes('accessibilityLabel="Volver"'));
 assert.ok(visitor.includes('menuOpen={profileMenuOpen} onMenuClose={()=>setProfileMenuOpen(false)}'));
 assert.ok(visitor.includes('transform:[{translateY:smoothHeroParallax}]'));
});
