import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=(p:string)=>readFileSync(p,"utf8");
const editor=read("src/app/post/create.tsx");
const sheets=read("src/components/PostComposerSheets.tsx");
const drafts=read("src/lib/post-drafts.ts");
const feed=read("src/lib/social-content.ts");
const home=read("src/app/(tabs)/index.tsx");
const postList=read("src/components/HomePublishedPosts.tsx");
const migration=read("supabase/migrations/20261119234500_jobeen_draft_media_alt_mentions.sql");

test("Bottom toolbar provides balanced drafts and preview, removing unused Options",()=>{
 assert.ok(editor.includes("Borradores. Pendientes: "));
 assert.ok(editor.includes('accessibilityLabel="Vista previa"'));
 assert.ok(!editor.includes('label:"Opciones"'));
 assert.ok(editor.includes("<PostComposerSheets"));
 assert.ok(sheets.includes('floatingCard("Borradores"'));
 assert.ok(sheets.includes('floatingCard("Vista previa"'));
 assert.ok(!sheets.includes('title="Opciones de publicación"'));
});
test("Every edit is saved automatically and an app background event flushes the current snapshot",()=>{
 assert.ok(editor.includes('AppState.addEventListener("change"'));
 assert.ok(editor.includes('if(status!=="active")void persistSnapshot(draftSnapshotRef.current)'));
 assert.ok(editor.includes('const timer=setTimeout(()=>{'));
 assert.ok(editor.includes('usePreventRemove(hasWork&&!editingDone'));
 assert.ok(drafts.includes("AsyncStorage.setItem"));
 assert.ok(drafts.includes("jobeen.post.drafts.v1."));
 assert.ok(editor.includes("readPostDrafts(uid)"));
 assert.ok(!editor.includes("if(saved[0])applyDraft(saved[0])"));
});
test("Back and cancel ask to save or discard; discard deletes the draft and both return Home",()=>{
 assert.ok(editor.includes('onPress={requestExit}'));
 assert.ok(editor.includes('setExitOpen(true)'));
 assert.ok(sheets.includes('¿Guardar tu publicación?'));
 for(const label of ["Guardar borrador","Descartar cambios","Continuar editando"])assert.ok(sheets.includes(label));
 assert.ok(editor.includes('await deletePostDraft(author,draftSnapshotRef.current.id)'));
 assert.ok(editor.includes("finishHome(\"\")"));
 assert.ok(editor.includes('usePreventRemove(hasWork&&!editingDone'));
 assert.ok(editor.includes('navigation.canGoBack()'));
 assert.ok(editor.includes('navigation.goBack()'));
 assert.ok(!editor.includes('StackActions.popTo('));
 assert.ok(!editor.includes('router.replace("/(tabs)/profile")'));
});
test("Publishing routes Home with the exact new ID; the feed promotes it above other posts",()=>{
 assert.ok(editor.includes('const publishedId=await publishHomePost({'));
 assert.ok(editor.includes('finishHome(publishedId)'));
 assert.ok(feed.includes('return (created as unknown as {id:string}).id;'));
 assert.ok(home.includes('useLocalSearchParams<{published?:string}>()'));
 assert.ok(home.includes('setFilter("all")'));
 assert.ok(postList.includes("featuredPostId"));
 assert.ok(postList.includes('a.id===featuredPostId?-1'));
});
test("Private draft image backups are saved and published without making originals public",()=>{
 assert.ok(migration.includes("'jobeen-post-draft-photos',false"));
 assert.ok(migration.includes('Jobeen draft photo owner insert'));
 assert.ok(migration.includes('Jobeen draft photo owner select'));
 assert.ok(editor.includes('uploadPhoto(author,photo.uri,DRAFT_PHOTO_BUCKET)'));
 assert.ok(drafts.includes('createSignedUrls(paths,3600)'));
 assert.ok(feed.includes('db.storage.from(DRAFT_POSTS_BUCKET).download(saved)'));
 assert.ok(feed.includes('photoDraftPaths'));
});
test("Mentioning with @ searches in the text field; accessible descriptions live on each photo",()=>{
 assert.ok(editor.includes('searchPostMentions(mentionQuery)'));
 assert.ok(editor.includes('setMentionedProfileIds'));
 assert.ok(editor.includes('Mencionar "+person.name'));
 assert.ok(editor.includes('onPress={()=>setAltPhotoId(photo.id)}'));
 assert.ok(sheets.includes('floatingCard("Describir foto"'));
 assert.ok(sheets.includes('Descripción accesible de fotografía'));
 assert.ok(feed.includes("mentioned_profile_ids"));
 assert.ok(feed.includes("photo_alt_texts"));
 assert.ok(!editor.includes('optionsOpen'));
});
