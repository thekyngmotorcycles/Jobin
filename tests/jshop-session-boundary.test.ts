import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
const read=(p:string)=>readFileSync(p,"utf8");
test("Every JShop request preserves the initiating authenticated session",()=>{
 const api=read("src/lib/jshop-api.ts");
 for(const name of ["loadJShopListings","loadJShopListingsNear","loadMyJShopListings","loadJShopListing","loadJShopFavoriteIds","loadFavoriteJShopListings","setJShopFavorite","reportJShopListing","setJShopListingStatus","deleteJShopListing","publishJShopDraft"]){
  const fn=api.slice(api.indexOf("export async function "+name+"("));
  assert.ok(fn.indexOf("expectedScope:MessageScope")<fn.indexOf("{"),name+" must require the original scope");
 }
 assert.ok(api.includes("if(scope.owner!==ownerId)"));
 assert.ok(api.includes("rows.some(row=>row.user_id!==scope.owner)"));
 assert.ok(api.includes("rows.some(row=>row.seller_id!==scope.owner)"));
 assert.ok(api.includes("ownedPhotoPath(row.seller_id,path)"));
 assert.ok(!api.includes("remove(item.photoPaths)"));
});
test("JShop views invalidate old results and report actions on navigation",()=>{
 const report=read("src/app/jshop/report.tsx"),saved=read("src/app/jshop/favorites.tsx"),detail=read("src/app/jshop/item/[id].tsx");
 assert.ok(report.includes("originRef.current=null"));
 assert.ok(report.includes("origin.listing!==listing"));
 assert.ok(report.includes("reportJShopListing(origin.listing,origin.scope.owner,reason,details,origin.scope)"));
 assert.ok(saved.includes("loadFavoriteJShopListings(user,scope)"));
 assert.ok(saved.includes('scopeRef.current=null;setUserId("");setSaved([])'));
 assert.ok(detail.includes("deleteJShopListing(viewer,listing,origin)"));
 assert.ok(detail.includes("setJShopListingStatus(viewer,listing.id,status,scope)"));
 assert.ok(detail.includes("setJShopFavorite(viewer,listing.id,!saved,scope)"));
});
