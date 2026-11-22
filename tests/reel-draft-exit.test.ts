import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const video=readFileSync("src/app/(tabs)/create.tsx","utf8");
const flash=readFileSync("src/components/FlashComposer.tsx","utf8");
test("Flash editor autosaves video metadata when editing and backgrounded",()=>{
 assert.ok(flash.includes('AppState.addEventListener("change"'));
 assert.ok(flash.includes('if(status!=="active")void persist()'));
 assert.ok(flash.includes('privateMetadataStorage.write("flash-draft",scope,'));
 assert.ok(video.includes('privateMetadataStorage.write("reel-draft",scope,'));
 for(const editor of [flash,video]){
  assert.ok(!editor.includes("AsyncStorage"));
  assert.ok(editor.includes("if(scopeRef.current===scope)home()"));
 }
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
 assert.ok(video.includes('<Editor key={asset.uri} asset={asset} edit={edit} onEdit={setEdit} scope={scopeRef.current}/>'));
 assert.ok(video.includes('onPress={requestExit}'));
 assert.ok(video.includes("Guardar borrador"));
 assert.ok(video.includes("Descartar cambios"));
 assert.ok(video.includes('router.replace("/(tabs)/index")'));
 assert.ok(video.includes('Si Android borra un archivo temporal'));
});

test("Media drafts and private playback preserve the initiating account and avoid persistent player caching",()=>{
 const api=readFileSync("src/lib/safety-api.ts","utf8");
 const room=readFileSync("src/app/work-media/[id].tsx","utf8");
 for(const editor of [flash,video]){
  assert.ok(editor.includes("await assertMessageScope(scope)"));
  assert.ok(editor.includes("scopeRef.current!==scope"));
  assert.ok(editor.includes("serializePrivateWrite("));
  assert.ok(editor.includes("useCaching:false"));
  assert.ok(editor.includes("localVideo("));
 }
 assert.ok(api.includes('return safetyMutation("jobin_submit_work_video",{...input,path},scope)'));
 assert.ok(api.includes('if(media.some(row=>row.creator_id!==scope.owner))'));
 assert.ok(room.includes("await loadMedia(id,origin)"));
 assert.ok(room.includes("useCaching:false"));
 assert.ok(room.includes('setError("No se pudo renovar el permiso de reproducción.")'));
 assert.ok(room.includes("invalidate();"));
});
