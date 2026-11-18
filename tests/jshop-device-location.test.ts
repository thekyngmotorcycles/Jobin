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
test("Previously selected buyer search takes precedence; GPS only auto-centers with existing permission",()=>{
 const picker=read("src/app/jshop/location.tsx");
 assert.ok(picker.includes("const place=saved??recent[0]??null"));
 assert.ok(picker.includes("if(place){"));
 assert.ok(picker.includes("if(!active||manualChoice.current||!permission.granted)return;"));
 assert.ok(picker.includes("setZoom(11);setMoved(true);"));
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
 assert.ok(picker.includes("await placeAtMapCenter(center.lat,center.lon)"));
 assert.ok(!picker.includes("if(!moved||typing)return;"));
 assert.ok(picker.includes("confirmJShopPlace("));
});
