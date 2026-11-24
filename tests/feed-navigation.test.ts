import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";

const load=(path:string)=>readFileSync(path,"utf8");

test("Flashes and Lives share the same compact one-row header and category menu",()=>{
 const header=load("src/components/FeedTopBar.tsx");
 const videos=load("src/app/(tabs)/videos.tsx");
 const lives=load("src/app/(tabs)/streams.tsx");
 assert.ok(header.includes("numberOfLines={1}"));
 assert.ok(header.includes("minimumFontScale={0.8}"));
 assert.ok(header.includes("WORK_FILTERS.map"));
 assert.ok(header.includes("onCategory(filter)"));
 assert.ok(header.includes("<JobeenFlashIcon"));
 assert.ok(header.includes('<IconButton icon="search-outline" label="Buscar" size={25}'));
 assert.ok(videos.includes("category={category} onCategory={changeCategory}"));
 assert.ok(lives.includes("category={filter} onCategory={setFilter}"));
 assert.ok(!videos.includes("<WorkCategoryFilters"));
 assert.ok(!lives.includes("<WorkCategoryFilters"));
});
test("Lives continues selecting Videos in the five-icon bottom navigation",()=>{
 const navigation=load("src/app/(tabs)/_layout.tsx");
 assert.ok(navigation.includes('route.name==="videos"&&(pathname==="/streams"||pathname.endsWith("/streams"))'));
 assert.ok(navigation.includes('focused={selected}'));
 assert.ok(navigation.includes('<JobinTabIcon name={route.name}'));
 assert.ok(!navigation.includes("backgroundColor:selected?"));
 assert.ok(!navigation.includes('borderRadius:999,overflow:"hidden"'));
 assert.ok(navigation.includes('tabBarActiveTintColor:colors.ink,tabBarInactiveTintColor:colors.ink'));
 assert.ok(navigation.includes("tabBarActiveBackgroundColor:colors.transparent"));
});
test("Search remains one common route with contextual Streams preset",()=>{
 const home=load("src/components/SocialHeader.tsx");
 const videos=load("src/app/(tabs)/videos.tsx");
 const lives=load("src/app/(tabs)/streams.tsx");
 const search=load("src/app/search.tsx");
 assert.ok(home.includes('router.push("/search")'));
 assert.ok(videos.includes('params:{mode:"flash"}'));
 assert.ok(lives.includes('params:{mode:"live"}'));
 assert.ok(search.includes('mode==="live"?"Streams":mode==="flash"?"Flashes":"Todo"'));
 assert.ok(search.includes("readRecentSearches"));
 assert.ok(search.includes("suggestionsForQuery(recent,query)"));
 assert.ok(search.includes("centerFilter(option,true)"));
 assert.ok(search.includes("numberOfLines={1}"));
 assert.ok(search.includes("height:48,minHeight:48"));
 assert.ok(home.includes('router.push("/search")'));
});

test("Live and Flashes category menu uses Royal Hive and scrollable accessible rows",()=>{
 const header=load("src/components/FeedTopBar.tsx");
 assert.ok(header.includes("const modal=jobeenModalTokens(theme)"));
 assert.ok(header.includes("backgroundColor:modal.surface"));
 assert.ok(header.includes("minHeight:JOBEEN_CONTROL.touchTarget"));
 assert.ok(header.includes("maxHeight:Math.max(0,height-insets.bottom-8-menuTop)"));
 assert.ok(header.includes("<ScrollView style={{flexShrink:1}}"));
});

test("immersive Flash progress does not compete with comments, creator and share sheets or retarget social actions",()=>{
 const feed=load("src/components/FeedVideo.tsx");
 const controls=load("src/components/VideoPlaybackControls.tsx");
 const videos=load("src/app/(tabs)/videos.tsx");
 assert.ok(feed.includes('{active&&!error&&!sheet&&!shareOpen&&<FlashProgress player={player} clipId={clip.id} active={active}'));
 assert.ok(feed.includes('const playing=active&&!paused&&!error&&!sheet;'));
 assert.ok(feed.includes('bindPlaybackLifecycle(player,playing,AppState.currentState'));
 assert.ok(feed.includes('social.addComment(clip.postId,name||"You",draft)'));
 assert.ok(feed.includes('social.toggleLike(clip.postId)'));
 assert.ok(feed.includes('social.toggleSave(clip.postId)'));
 assert.ok(feed.includes('social.toggleFollow(clip.creatorId)'));
 assert.ok(feed.includes('onShared={()=>social.addShare(clip.postId)}'));
 assert.ok(controls.includes('onScrubbingChange?.(clipId,false)'));
 assert.ok(controls.includes('onResponderTerminate={()=>finish()}'));
 assert.ok(videos.includes('current=>dragging?id:current===id?null:current'));
 assert.ok(videos.includes('active={focused && active === index}'));
});

test("Generic Videos entry remembers a section while direct Flash and Live links remain direct",()=>{
 const nav=load("src/app/(tabs)/_layout.tsx"),persistent=load("src/components/PersistentBottomTabs.tsx"),provider=load("src/state/VideoSectionNavigation.tsx");
 assert.ok(nav.includes('initialRouteName="streams"'));
 assert.ok(nav.includes('tabPress:event=>{event.preventDefault();openVideos();}'));
 assert.ok(nav.includes('name==="/(tabs)/videos"?openVideos():router.push'));
 assert.ok(persistent.includes('item.id==="videos"?openVideos():router.navigate(item.path)'));
 assert.ok(provider.includes("videoSectionForPath(path)"));
 assert.ok(provider.includes("preference.write(scope,section)"));
 assert.ok(provider.includes("request.current!==ticket||currentPath.current!==from"));
 assert.ok(provider.includes("sessionMarkerKey(session.user.id,session.access_token)!==authKey"));
 assert.ok(provider.includes("await assertAccountOwner(scope.owner,scope.session)"));
 assert.ok(load("src/app/(tabs)/videos.tsx").includes('onLeading={() => router.navigate("/(tabs)/streams")}'));
 assert.ok(load("src/app/(tabs)/streams.tsx").includes('onLeading={()=>router.navigate("/(tabs)/videos")}'));
 assert.ok(load("src/app/(tabs)/videos.tsx").includes('useLocalSearchParams<{ post?: string }>()'));
});
