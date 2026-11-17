import assert from "node:assert/strict";
import test from "node:test";
import {geodesicCircle,haversineMiles,mapZoomForRadius,insideJShopRadius,isJShopRadius} from "../src/lib/jshop-geo.ts";
test("5, 10, 50 and 100 miles are supported and distance uses Earth's surface",()=>{
 assert.deepEqual([5,10,50,100].map(isJShopRadius),[true,true,true,true]);
 assert.equal(isJShopRadius(25),false);
 const miami={lat:25.7617,lon:-80.1918};
 const fortLauderdale={lat:26.1224,lon:-80.1373};
 const miles=haversineMiles(miami,fortLauderdale);
 assert.ok(miles>24&&miles<27);
 assert.equal(insideJShopRadius(miami,fortLauderdale,10),false);
 assert.equal(insideJShopRadius(miami,fortLauderdale,50),true);
 assert.equal(insideJShopRadius(miami,null,100),false);
});
test("Mapbox circle is geographic, closed, and stays in selected radius",()=>{
 const center={lat:25.7617,lon:-80.1918};
 const ring=geodesicCircle(center,50);
 assert.equal(ring.length,97);
 assert.deepEqual(ring[0],ring[96]);
 for(const [lon,lat] of ring){assert.ok(Math.abs(haversineMiles(center,{lat,lon})-50)<0.01);}
});
test("larger buying radius zooms out automatically",()=>{
 const center={lat:-12.0464,lon:-77.0428};
 const zoom5=mapZoomForRadius(center,5);
 const zoom100=mapZoomForRadius(center,100);
 assert.ok(zoom5>zoom100);
 assert.ok(zoom5>8&&zoom100<8);
});
