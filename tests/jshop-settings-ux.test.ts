import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
const read=(file:string)=>readFileSync(file,"utf8");

test("JShop seller settings offers only wired actions and keeps buyer filters separate",()=>{
 const settings=read("src/app/jshop/settings.tsx");
 const shop=read("src/app/jshop.tsx");
 const mine=read("src/app/jshop/mine.tsx");
 assert.ok(settings.includes("Mi ubicación de venta"));
 assert.ok(settings.includes("writeSellerCurrency("));
 assert.ok(settings.includes('router.push("/notifications")'));
 assert.ok(settings.includes('router.push("/jshop/guide")'));
 assert.ok(settings.includes('pathname:"/jshop/sale-location"'));
 assert.ok(shop.includes('router.push("/jshop/location")'));
 assert.ok(!settings.includes("Ubicación de búsqueda se cambia"));
 assert.ok(mine.includes('router.push("/jshop/settings")'));
});
test("Seller selected currency is preserved for new drafts and unchanged for existing ones",()=>{
 const pref=read("src/lib/jshop-selling-preferences.ts");
 const publish=read("src/app/jshop/publish.tsx");
 assert.ok(pref.includes("readSellerCurrency"));
 assert.ok(pref.includes("AsyncStorage.setItem"));
 assert.ok(publish.includes("readSellerCurrency(owner)"));
 assert.ok(publish.includes("if(!draft)setCurrency(preferredCurrency)"));
 assert.ok(publish.includes("setCurrency(found.currency)"));
});
test("Mapbox seller location avoids redundant reverse requests and validates before storage",()=>{
 const picker=read("src/app/jshop/sale-location.tsx");
 const geo=read("src/lib/jshop-geocode.ts");
 assert.ok(!picker.includes("Elegir punto"));
 assert.ok(picker.includes("confirmJShopPlace("));
 assert.ok(picker.includes("mapboxConfigured?{city:"));
 assert.ok(geo.includes("X-Rate-Limit-Reset"));
 assert.ok(geo.includes("Retry-After"));
 assert.ok(geo.includes("geocodeBlockedUntil"));
 assert.ok(!geo.includes('mapboxRequest("reverse",{longitude:lon.toFixed(6),latitude:lat.toFixed(6),types:LOCATION_TYPES,limit:"5"}'));
 assert.ok(picker.includes("if(!mapboxConfigured||!typing"));
 assert.ok(picker.includes("void searchOnSubmit()"));
});
