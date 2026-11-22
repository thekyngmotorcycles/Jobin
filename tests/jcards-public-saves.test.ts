import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const src=(path:string)=>readFileSync(path,"utf8");
const sql=src("supabase/migrations/20261120191635_jobeen_saved_jcards.sql");
const api=src("src/lib/saved-jcards.ts");
const candidate=src("supabase/security-review/saved-jcard-visibility.sql");
const gallery=src("src/components/SavedJCardsGallery.tsx");
const visitor=src("src/app/jcard.tsx");
const card=src("src/components/JobinCard.tsx");
const actions=src("src/components/ProfileCommunityActions.tsx");
const own=src("src/app/(tabs)/profile.tsx");
test("Anyone signed in can bookmark a displayed public face, without owner approval",()=>{
 assert.ok(sql.includes('card_side in (\'personal\',\'business\')'));
 assert.ok(sql.includes('saver_id=(select auth.uid())'));
 assert.ok(sql.includes('v.personal_enabled else v.business_enabled'));
 assert.ok(sql.includes('p.deactivated_at is null'));
 assert.ok(api.includes('if(!business?.name?.trim())'));
 assert.ok(!sql.includes("owner_approved"));
 assert.ok(api.includes(".insert({target_id:targetId,card_side:side"));
 assert.ok(visitor.includes("saveVisibleJCard(user,activeCardSide,viewer,origin.scope)"));
 assert.ok(actions.includes("Guardar JCard empresarial"));
});
test("Bookmarks contain references, not cached phone numbers or emails",()=>{
 const ddl=sql.slice(sql.indexOf("create table public.jobeen_saved_jcards"),sql.indexOf(");",sql.indexOf("create table public.jobeen_saved_jcards"))+2);
 assert.ok(!ddl.includes("phone"));
 assert.ok(!ddl.includes("email"));
 assert.ok(!ddl.includes("name"));
 assert.ok(api.includes('rpc("jobeen_saved_jcard_previews"'));
 assert.ok(candidate.includes("not private.is_blocked(p_target,(select auth.uid()))"));
 assert.ok(candidate.includes("then v.personal_enabled else v.business_enabled"));
 assert.ok(candidate.includes("length(btrim(b.name))>0"));
 assert.ok(candidate.includes("as restrictive for insert"));
 assert.ok(api.includes('title:!item.available?"JCard no disponible"'));
 assert.ok(!api.includes('from("profiles")'));
 assert.ok(!api.includes('from("jcard_visibility")'));
 assert.ok(api.includes('targetId:item.target_id,side:item.card_side'));
 assert.ok(!api.includes('select("*")'));
});
test("Saved collection is readable and editable only by the user who saved it",()=>{
 assert.ok(sql.includes("JCards saver reads own collection"));
 assert.ok(sql.includes("JCards saver removes own bookmarks"));
 assert.ok(sql.includes("grant update (favorite)"));
 assert.ok(sql.includes("revoke all on public.jobeen_saved_jcards from anon"));
 assert.ok(sql.includes("enable row level security"));
 assert.ok(api.includes("setSavedJCardFavorite"));
 assert.ok(api.includes("removeSavedJCard"));
});
test("Gallery supports search, favorite and remove, and loads fresh on focus",()=>{
 assert.ok(gallery.includes("useFocusEffect"));
 assert.ok(gallery.includes("listSavedJCards(owner,scope)"));
 assert.ok(gallery.includes("Buscar en mis JCards"));
 assert.ok(gallery.includes('label:"Favoritas"'));
 assert.ok(gallery.includes("setSavedJCardFavorite"));
 assert.ok(gallery.includes("removeSavedJCard"));
 assert.ok(gallery.includes('disabled={!item.available}'));
 assert.ok(gallery.includes('pathname:"/jcard",params:{user:item.targetId,card:item.side}'));
});
test("Saved business JCards show their real category glyph, not a generic building",()=>{
 const art=src("src/lib/business-category-art.ts");
 assert.ok(gallery.includes('businessCategoryArt(item.subtitle).icon'),"The preview reuses the full JCard category icon resolver");
 assert.ok(gallery.includes('item.side==="business"'),"Category glyph applies only to business cards");
 assert.ok(gallery.includes('"person-circle-outline"'),"Personal cards retain their dedicated icon");
 assert.ok(gallery.includes('"eye-off-outline"'),"Hidden cards retain the unavailable indicator");
 assert.ok(art.includes('climatizacion:"climate"'),"Climatización resolves to the climate category");
 assert.ok(art.includes('hvac:"climate"'),"HVAC resolves to the climate category");
 assert.ok(art.includes('climate:{icon:"snow-outline"'),"Climate category shows the approved snowflake glyph");
 assert.ok(!gallery.includes('item.side==="business"?"business-outline"'),"Do not regress to generic business glyph");
});
test("Owner visibility still controls what can be saved; the accordion remains unchanged",()=>{
 assert.ok(visitor.includes("readJCardVisibility(user)"));
 assert.ok(visitor.includes('onActiveSideChange={setActiveCardSide}'));
 assert.ok(actions.includes("onToggleSaved?"));
 assert.ok(card.includes("onActiveSideChange?.("));
 for(const page of [visitor,own]){
  assert.ok(page.includes("Animated.multiply(profileScrollY,0.5)"));
  assert.ok(page.includes("stickyHeaderIndices"));
  assert.ok(page.includes("topHeaderOffset=profileScrollY.interpolate("));
  assert.ok(page.includes("transform:[{translateY:smoothHeroParallax}]"));
 }
});
