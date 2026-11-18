import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
const read=(path:string)=>readFileSync(path,"utf8");

test("JShop buyer search center and seller default are separate",()=>{
 const shop=read("src/app/jshop.tsx");
 const publish=read("src/app/jshop/publish.tsx");
 const saleApi=read("src/lib/jshop-selling-location.ts");
 const settings=read("src/app/jshop/settings.tsx");
 const mine=read("src/app/jshop/mine.tsx");
 assert.ok(shop.includes('router.push("/jshop/location")'));
 assert.ok(!shop.includes('pathname:"/jshop/sale-location"'));
 assert.ok(mine.includes('router.push("/jshop/settings")'));
 assert.ok(settings.includes('pathname:"/jshop/sale-location"'));
 assert.ok(settings.includes("Mi ubicación de venta"));
 assert.ok(publish.includes('readDefaultSaleLocation(owner)'));
 assert.ok(!saleApi.includes('jobeen.jshop.location.v1.'));
 assert.ok(saleApi.includes('jshop_seller_locations'));
});
test("Seller can save default once and override a particular draft without altering their default",()=>{
 const picker=read("src/app/jshop/sale-location.tsx");
 const publish=read("src/app/jshop/publish.tsx");
 assert.ok(picker.includes('writeDefaultSaleLocation(owner,selected)'));
 assert.ok(picker.includes('writePendingArticleLocation(owner,session!,selected)'));
 assert.ok(picker.includes('showRadius={false}'));
 assert.ok(picker.includes('confirmJShopPlace'));
 assert.ok(publish.includes('selectedLocation=articlePlace??defaultPlace'));
 assert.ok(publish.includes('clearPendingArticleLocation'));
 assert.ok(publish.includes('setArticlePlace(null)'));
});
test("Each published listing snapshots its coordinates and does not move when seller default changes",()=>{
 const sql=read("supabase/migrations/20261118083000_jshop_seller_default_location.sql");
 const api=read("src/lib/jshop-api.ts");
 const model=read("src/lib/jshop-model.ts");
 assert.ok(sql.includes('create table if not exists public.jshop_seller_locations'));
 assert.ok(sql.includes('alter table public.jshop_seller_locations enable row level security'));
 assert.ok(sql.includes('seller_id=(select auth.uid())'));
 assert.ok(sql.includes("tg_op='INSERT'"));
 assert.ok(sql.includes('Configura tu ubicación de venta antes de publicar artículos.'));
 assert.ok(sql.includes('(new.location,new.location_lat,new.location_lon) is distinct from'));
 assert.ok(api.includes('location_lat:locationPoint.lat,location_lon:locationPoint.lon'));
 assert.ok(api.includes('readDefaultSaleLocation(ownerId)'));
 assert.ok(!api.includes('findJShopPlaces(draft.location)'));
 assert.ok(model.includes('locationLat?:number|null;locationLon?:number|null;'));
});
