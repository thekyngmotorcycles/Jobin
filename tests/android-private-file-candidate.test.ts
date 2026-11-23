
import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
const read=(p:string)=>readFileSync(p,"utf8");
test("Android-only candidate uses nonexported per-owner keys and noBackup app storage",()=>{
 const root="modules/jobeen-private-files/";
 const config=JSON.parse(read(root+"expo-module.config.json"));
 const native=read(root+"android/src/main/java/expo/modules/jobeenprivatefiles/JobeenPrivateFilesModule.kt");
 const bridge=read("src/lib/android-private-file-storage.ts");
 assert.deepEqual(config.platforms,["android"]);
 assert.ok(native.includes('KeyStore.getInstance("AndroidKeyStore")'));
 assert.ok(native.includes('key(owner, false)'));
 assert.ok(native.includes('.setRandomizedEncryptionRequired(true)'));
 assert.ok(native.includes('.setKeySize(256)'));
 assert.ok(native.includes('context.noBackupFilesDir'));
 assert.ok(native.includes('Os.link(staged.absolutePath, destination.absolutePath)'));
 assert.ok(native.includes('stream.fd.sync()'));
 assert.ok(!native.includes("destination.delete()"));
 assert.ok(!native.includes("getEncoded()"));
 assert.ok(bridge.includes('if(Platform.OS!=="android")throw'));
 assert.ok(bridge.includes('if(!native||typeof native.readPicked!=="function"'));
 assert.ok(bridge.includes("createPrivateFileVault(crypto,files,assertMessageScope)"));
 assert.ok(!bridge.includes("AsyncStorage")&&!bridge.includes("Math.random"));
});
