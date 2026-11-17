import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
const src=(file:string)=>readFileSync(file,"utf8");

test("Mapbox saves a real search center and one of four mile radii",()=>{
 const location=src("src/app/jshop/location.tsx");
 const persisted=src("src/lib/jshop-location.ts");
 assert.ok(location.includes("JSHOP_RADIUS_MILES.map"));
 assert.ok(location.includes("radiusMiles={radiusMiles}"));
 assert.ok(location.includes("Guardar resultados"));
 assert.ok(location.includes("confirmJShopPlace"));
 assert.ok(location.includes("saveJShopLocation(owner,{...confirmed,radiusMiles})"));
 assert.ok(persisted.includes("radiusMiles:p.radiusMiles??10"));
 assert.ok(persisted.includes("radiusMiles:place.radiusMiles??10"));
});
test("JShop uses spatial Postgres RPC with saved radius",()=>{
 const api=src("src/lib/jshop-api.ts");
 const catalog=src("src/app/jshop.tsx");
 const migration=src("supabase/migrations/20261117230500_jshop_search_radius.sql");
 assert.ok(api.includes('rpc("jshop_listings_nearby"'));
 assert.ok(api.includes("insideJShopRadius("));
 assert.ok(catalog.includes("selectedPlace?await loadJShopListingsNear(selectedPlace):await loadJShopListings()"));
 assert.ok(catalog.includes('location:""'));
 assert.ok(migration.includes("security invoker"));
 assert.ok(migration.includes("p_radius_miles in (5,10,50,100)"));
});
test("Seller listings use previously confirmed article coordinates, not fresh free-text geocoding",()=>{
 const api=src("src/lib/jshop-api.ts");
 const publish=src("src/app/jshop/publish.tsx");
 assert.ok(api.includes('readDefaultSaleLocation(ownerId)'));
 assert.ok(api.includes('location_lat:locationPoint.lat,location_lon:locationPoint.lon'));
 assert.ok(!api.includes('findJShopPlaces(draft.location)'));
 assert.ok(publish.includes("locationLat:selectedLocation?.lat"));
 assert.ok(publish.includes("locationLon:selectedLocation?.lon"));
});
test("Mapbox and web fallback show buying radius",()=>{
 const native=src("src/components/JShopLocationMap.native.tsx");
 const fallback=src("src/components/JShopLocationTileMap.tsx");
 assert.ok(native.includes("<Mapbox.ShapeSource"));
 assert.ok(native.includes("<Mapbox.FillLayer"));
 assert.ok(native.includes("<Mapbox.LineLayer"));
 assert.ok(native.includes("geodesicCircle(center,radiusMiles)"));
 assert.ok(fallback.includes("radiusMiles*1609.344"));
});
