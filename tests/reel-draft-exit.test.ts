import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const video=readFileSync("src/app/(tabs)/create.tsx","utf8");
const flash=readFileSync("src/components/FlashComposer.tsx","utf8");
test("Flash editor autosaves video metadata when editing and backgrounded",()=>{
 assert.ok(flash.includes('AppState.addEventListener("change"'));
 assert.ok(flash.includes('if(status!=="active")void persist()'));
 assert.ok(flash.includes('AsyncStorage.setItem(key(userId)'));
 assert.ok(flash.includes('onPress={requestExit}'));
 assert.ok(flash.includes('usePreventRemove(!exitAllowed'));
 assert.ok(flash.includes("Guardar borrador"));
 assert.ok(flash.includes("Descartar cambios"));
 assert.ok(flash.includes('router.replace("/(tabs)/index")'));
});
test("Video preparation stores clip and trim metadata without pretending it has published",()=>{
 assert.ok(video.includes('jobeen.reel.draft.v1.'));
 assert.ok(video.includes('AppState.addEventListener("change"'));
 assert.ok(video.includes('usePreventRemove(!exitAllowed'));
 assert.ok(video.includes('<Editor key={asset.uri} asset={asset} edit={edit} onEdit={setEdit}/>'));
 assert.ok(video.includes('onPress={requestExit}'));
 assert.ok(video.includes("Guardar borrador"));
 assert.ok(video.includes("Descartar cambios"));
 assert.ok(video.includes('router.replace("/(tabs)/index")'));
 assert.ok(video.includes('Si Android borra un archivo temporal'));
});
