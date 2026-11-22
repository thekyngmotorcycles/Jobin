import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
const read=(path:string)=>readFileSync(path,"utf8");

test("Buyer map uses navigate pointer with explicit foreground permission on tap",()=>{
 const picker=read("src/app/jshop/location.tsx");
 assert.ok(picker.includes('name="navigate-outline"'));
 assert.ok(picker.includes('accessibilityLabel="Usar mi ubicación actual"'));
 assert.ok(picker.includes("Location.requestForegroundPermissionsAsync()"));
 assert.ok(picker.includes("Location.getForegroundPermissionsAsync()"));
 assert.ok(picker.includes("Location.hasServicesEnabledAsync()"));
 assert.ok(picker.includes("Location.getCurrentPositionAsync("));
 assert.ok(picker.includes("onPress={()=>void centerOnDevice()}"));
 assert.ok(!picker.includes("Location.requestBackgroundPermissionsAsync"));
});
test("Buyer area is session-local; GPS only on explicit action",()=>{
 const picker=read("src/app/jshop/location.tsx");
 assert.ok(picker.includes("readJShopLocation(id,scope)"));
 assert.ok(picker.includes("if(saved){"));
 assert.equal((picker.match(/Location\.getCurrentPositionAsync\(/g)??[]).length,1);
 assert.ok(picker.includes("await captureMessageScope(scope);if(!valid())return;"));
 assert.ok(picker.includes("Number(latitude.toFixed(2))"));
 assert.ok(picker.includes("await saveJShopLocation(owner,"));
 assert.ok(!picker.includes('pathname:"/jshop/sale-location"'));
});
test("Native location module permissions are foreground only and require a new build",()=>{
 const app=JSON.parse(read("app.json"));
 const pkg=JSON.parse(read("package.json"));
 assert.equal(pkg.dependencies["expo-location"],"~19.0.7");
 const gps=app.expo.plugins.find((item:unknown)=>Array.isArray(item)&&item[0]==="expo-location");
 assert.ok(gps);
 assert.equal(gps[1].isIosBackgroundLocationEnabled,false);
 assert.equal(gps[1].isAndroidBackgroundLocationEnabled,false);
 assert.equal(gps[1].isAndroidForegroundServiceEnabled,false);
});
test("Moving buyer map does not automatically reverse-geocode on every pan",()=>{
 const picker=read("src/app/jshop/location.tsx");
 assert.ok(picker.includes("const place=chosen??(mapboxConfigured?"));
 assert.ok(picker.includes("await placeAtMapCenter(lat,lon)"));
 assert.ok(!picker.includes("if(!moved||typing)return;"));
 assert.ok(picker.includes("confirmJShopPlace("));
});
