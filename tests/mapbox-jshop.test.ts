import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
import {mapboxPlace,mapboxPlaces,LOCATION_TYPES} from "../src/lib/mapbox-geocode-core.ts";
const read=(path:string)=>readFileSync(path,"utf8");

test("Mapbox geocoding normalizes city and location in worldwide markets",()=>{
 const examples=[
  {geometry:{coordinates:[-58.3816,-34.6037]},properties:{name:"San Nicolás",feature_type:"neighborhood",place_formatted:"Buenos Aires, Argentina",context:{place:{name:"Buenos Aires"}}}},
  {geometry:{coordinates:[-77.0428,-12.0464]},properties:{name:"Lima",feature_type:"place",place_formatted:"Perú"}},
  {geometry:{coordinates:[-80.1918,25.7617]},properties:{name:"Miami",feature_type:"place",place_formatted:"Florida, Estados Unidos"}}
 ];
 const places=mapboxPlaces({features:examples});
 assert.equal(places.length,3);
 assert.equal(places[0].city,"Buenos Aires");
 assert.equal(places[1].city,"Lima");
 assert.equal(places[2].city,"Miami");
 assert.ok(Math.abs(places[0].lon+58.3816)<0.000001);
 assert.ok(Math.abs(places[0].lat+34.6037)<0.000001);
 assert.ok(LOCATION_TYPES.includes("place"));
});
test("Mapbox geocoding safely rejects invalid or incomplete features",()=>{
 assert.equal(mapboxPlace({geometry:{coordinates:[Number.NaN,7]},properties:{name:"Foo"}}),null);
 assert.equal(mapboxPlace({geometry:{coordinates:[200,5]},properties:{name:"Foo"}}),null);
 assert.equal(mapboxPlace({geometry:{coordinates:[-70,4]}}),null);
 assert.deepEqual(mapboxPlaces({}),[]);
});
test("Mapbox JShop integration uses native plugin, token-gated maps and permanent storage consent",()=>{
 const app=JSON.parse(read("app.json"));
 const pkg=JSON.parse(read("package.json"));
 const location=read("src/app/jshop/location.tsx");
 const api=read("src/lib/jshop-geocode.ts");
 const native=read("src/components/JShopLocationMap.native.tsx");
 const web=read("src/components/JShopLocationTileMap.tsx");
 assert.equal(pkg.dependencies["@rnmapbox/maps"],"10.3.18");
 assert.ok(app.expo.plugins.some((p:unknown)=>Array.isArray(p)&&p[0]==="@rnmapbox/maps"));
 assert.ok(location.includes("confirmJShopPlace("));
 assert.ok(api.includes('permanent?"true":"false"'));
 assert.ok(api.includes('return mapboxRequest("forward"'));
 assert.ok(native.includes("Mapbox.MapView"));
 assert.ok(native.includes("Mapbox.StyleURL.Light"));
 assert.ok(web.includes("styles/v1/mapbox/light-v11/tiles/256/"));
 assert.ok(!app.expo.android.permissions.includes("android.permission.ACCESS_FINE_LOCATION"));
});
