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
 assert.ok(navigation.includes("focused={selected}"));
 assert.ok(navigation.includes('<JobinTabIcon name={route.name}'));
 assert.ok(!navigation.includes("backgroundColor:selected?"));
 assert.ok(!navigation.includes("borderRadius:999,overflow:\"hidden\""));
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
