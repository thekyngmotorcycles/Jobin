import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=(path:string)=>readFileSync(path,"utf8");
test("native Auth storage uses SecureStore only and never migrates plaintext automatically",()=>{
 const native=read("src/lib/auth-storage.native.ts"),web=read("src/lib/auth-storage.ts"),auth=read("src/lib/supabase.ts");
 assert.ok(native.includes('from "expo-secure-store"'));
 assert.ok(native.includes("createCredentialVault(backend,storageKey)"));
 assert.ok(native.includes("AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY"));
 assert.ok(native.includes("requireAuthentication:false"));
 assert.ok(!native.includes('from "@react-native-async-storage/async-storage"'));
 assert.ok(web.includes('if(Platform.OS!=="web")throw'));
 assert.ok(auth.includes("createAuthStorage(storageKey)"));
 assert.ok(!auth.includes("AsyncStorage"));
 assert.ok(auth.includes('flowType:"pkce"'));
});
test("SecureStore and SDK key contract remain pinned with native backup plugin",()=>{
 const pkg=JSON.parse(read("package.json")),lock=JSON.parse(read("package-lock.json")),app=JSON.parse(read("app.json"));
 assert.equal(pkg.dependencies["expo-secure-store"],"15.0.8");
 assert.equal(pkg.dependencies["@supabase/supabase-js"],"2.118.0");
 assert.equal(lock.packages["node_modules/expo-secure-store"].version,"15.0.8");
 assert.equal(lock.packages["node_modules/@supabase/auth-js"].version,"2.118.0");
 assert.ok(app.expo.plugins.some((p:unknown)=>Array.isArray(p)&&p[0]==="expo-secure-store"&&p[1].configureAndroidBackup===true));
});
