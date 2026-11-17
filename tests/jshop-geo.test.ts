import assert from "node:assert/strict";
import test from "node:test";
import {geodesicCircle,haversineMiles,mapZoomForRadius,insideJShopRadius,isJShopRadius,mapRadiusForViewport} from "../src/lib/jshop-geo.ts";
test("Dynamic decimal radii validate and use Earth surface distance",()=>{
 assert.deepEqual([0.05,0.125,5,10,25,50,100,4000].map(isJShopRadius),Array(8).fill(true));
 assert.equal(isJShopRadius(0.01),false);assert.equal(isJShopRadius(4001),false);
 const miami={lat:25.7617,lon:-80.1918},fortLauderdale={lat:26.1224,lon:-80.1373};
 const miles=haversineMiles(miami,fortLauderdale);
 assert.ok(miles>24&&miles<27);
 assert.equal(insideJShopRadius(miami,fortLauderdale,10),false);
 assert.equal(insideJShopRadius(miami,fortLauderdale,50),true);
 assert.equal(insideJShopRadius(miami,null,100),false);
});
test("Geodesic radius is geographic and a closed circle",()=>{
 const center={lat:25.7617,lon:-80.1918},ring=geodesicCircle(center,50);
 assert.equal(ring.length,97);assert.deepEqual(ring[0],ring[96]);
 for(const [lon,lat] of ring)assert.ok(Math.abs(haversineMiles(center,{lat,lon})-50)<0.01);
});
test("Zoom and map viewport change the real buying radius",()=>{
 const center={lat:-12.0464,lon:-77.0428};
 assert.ok(mapZoomForRadius(center,5)>mapZoomForRadius(center,100));
 const wide=mapRadiusForViewport(center,8,320,400),close=mapRadiusForViewport(center,12,320,400);
 assert.ok(wide>close&&wide/close>14&&wide/close<18);
 assert.equal(mapRadiusForViewport(center,18,320,400),0.05);
});
