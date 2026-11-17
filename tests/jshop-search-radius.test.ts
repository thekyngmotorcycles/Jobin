import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
const read=(file:string)=>readFileSync(file,"utf8");
test("Buyer picker is minimal and radius follows viewport zoom",()=>{
 const picker=read("src/app/jshop/location.tsx");
 const map=read("src/components/JShopLocationMap.native.tsx");
 assert.ok(picker.includes("mapRadiusForViewport(center,zoom,viewport.width,viewport.height)"));
 assert.ok(picker.includes("fluid minimal"));
 assert.ok(picker.includes('"Aplicar"'));
 assert.ok(!picker.includes("JSHOP_RADIUS_MILES.map"));
 assert.ok(!picker.includes("Elegir punto"));
 assert.ok(map.includes("circleSize"));
 assert.ok(picker.includes("placeAtMapCenter(center.lat,center.lon)"));
 assert.ok(picker.includes("confirmJShopPlace"));
});
test("Dynamic RPC leaves previous integer-radius RPC intact",()=>{
 const api=read("src/lib/jshop-api.ts"),cat=read("src/app/jshop.tsx");
 const sql=read("supabase/migrations/20261117235138_jshop_dynamic_search_area.sql");
 assert.ok(api.includes('rpc("jshop_listings_within_area"'));
 assert.ok(api.includes("insideJShopRadius("));
 assert.ok(cat.includes("selectedPlace?loadJShopListingsNear(selectedPlace):loadJShopListings()"));
 assert.ok(sql.includes("security invoker"));
 assert.ok(sql.includes("p_radius_miles between 0.05 and 4000"));
 assert.ok(!sql.includes("drop function"));
});
test("Seller's article coordinates stay untouched",()=>{
 const api=read("src/lib/jshop-api.ts"),publish=read("src/app/jshop/publish.tsx");
 assert.ok(api.includes("readDefaultSaleLocation(ownerId)"));
 assert.ok(api.includes("location_lat:locationPoint.lat,location_lon:locationPoint.lon"));
 assert.ok(!api.includes("findJShopPlaces(draft.location)"));
 assert.ok(publish.includes("locationLat:selectedLocation?.lat"));
});
