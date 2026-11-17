import test from "node:test";
import assert from "node:assert/strict";
import {clampMapLatitude,pointToTile,tileToPoint,tileSource,moveMapPoint,normalizeCityName,locationMatches} from "../src/lib/jshop-location-core.ts";

test("JShop map centers preserve geographic coordinates through tile conversion",()=>{
 const p={lat:-34.6037,lon:-58.3816};
 const t=pointToTile(p,9),again=tileToPoint(t.x,t.y,9);
 assert.ok(Math.abs(again.lat-p.lat)<0.00001);assert.ok(Math.abs(again.lon-p.lon)<0.00001);
 assert.equal(clampMapLatitude(95)<90,true);
});
test("JShop map tiles wrap east-west, clamp north-south",()=>{
 assert.equal(tileSource(-1,0,2),"https://tile.openstreetmap.org/2/3/0.png");
 assert.equal(tileSource(2,-1,2),null);
 const moved=moveMapPoint({lat:0,lon:0},8,256,0);
 assert.ok(moved.lon<0);
});
test("JShop location selection matches the existing listing city field",()=>{
 assert.equal(normalizeCityName("  Buenos   Aires "),"Buenos Aires");
 assert.ok(locationMatches("Lanús, Buenos Aires, Argentina","buenos aires"));
 assert.ok(!locationMatches("Miami, Florida, USA","buenos aires"));
 assert.ok(locationMatches("Miami, Florida",""));
});
