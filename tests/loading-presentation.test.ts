import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
const source=(p:string)=>readFileSync(p,"utf8");
test("JShop uses one shared responsive shimmer and never renders an empty catalogue while loading",()=>{
 const skeleton=source("src/components/JShopListingSkeleton.tsx"),cards=source("src/components/JShopUI.tsx"),shop=source("src/app/jshop.tsx");
 assert.equal((skeleton.match(/useSharedValue\(0\)/g)??[]).length,1);
 assert.ok(skeleton.includes("useFocusEffect"));
 assert.ok(skeleton.includes("if(reducedMotion)return"));
 assert.ok(skeleton.includes("cancelAnimation(clock)"));
 assert.ok(skeleton.includes("Math.min(4"));
 assert.ok(cards.includes("jshopItemGeometry(width)"));
 assert.ok(skeleton.includes("jshopItemGeometry(width)"));
 assert.ok(shop.includes("loading?<JShopListingSkeleton/>:error?null:<JShopEmpty"));
 assert.ok(!shop.includes("ActivityIndicator"));
 assert.ok(source("src/app/jshop/favorites.tsx").includes("loading?<JShopListingSkeleton/>"));
 assert.ok(source("src/app/jshop/mine.tsx").includes("loading?<JShopListingSkeleton withFavorite={false}/>"));
 assert.ok(!skeleton.includes("fetch("));
});
test("Page-level gear indicators are limited to their waiting states and not repeated in photo rows",()=>{
 const feed=source("src/components/HomePublishedPosts.tsx"),messages=source("src/app/(tabs)/inbox.tsx"),search=source("src/app/search.tsx");
 assert.ok(feed.includes('(loading||waitingAudience)&&<JobinLoadingIndicator size={28}'));
 assert.ok(messages.includes('loading&&<JobinLoadingIndicator size={26}'));
 assert.ok(search.includes('loading&&<JobinLoadingIndicator size={24}'));
 assert.equal((feed.match(/<JobinLoadingIndicator/g)??[]).length,1);
 assert.ok(feed.includes("commentsLoading&&<ActivityIndicator"));
 assert.ok(!source("src/components/JShopUI.tsx").includes("JobinLoadingIndicator"));
});
test("Publishing photos reports only confirmed file progress instead of combining spinner and progress",()=>{
 const composer=source("src/app/post/create.tsx"),bar=source("src/components/JobinFileProgress.tsx");
 assert.ok(composer.includes('!photoProgress&&<JobinLoadingIndicator'));
 assert.ok(composer.includes('photoProgress&&<JobinFileProgress done={photoProgress.done} total={photoProgress.total}'));
 assert.ok(composer.includes("setPhotoProgress({done,total})"));
 assert.ok(composer.includes("Finalizando publicación"));
 assert.ok(bar.includes("Math.min(max"));
 assert.ok(bar.includes("accessibilityValue"));
 assert.ok(!bar.includes("withTiming"));
});
