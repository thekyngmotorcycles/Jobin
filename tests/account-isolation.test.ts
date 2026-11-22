import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const src=(path:string)=>readFileSync(path,"utf8");

test("Professional history never reads or migrates legacy storage and preserves session origin",()=>{
 const page=src("src/app/(tabs)/profile.tsx");
 const cloud=src("src/lib/jcard-cloud.ts");
 assert.ok(!page.includes("jobin.professional.history.v1"));
 assert.ok(!page.includes("jobeen.professional.history.v2."));
 assert.ok(!page.includes("AsyncStorage"));
 assert.ok(page.includes("historyState.owner===ownerId"));
 assert.ok(page.includes("await readCloudHistory(owner,scope)"));
 assert.ok(page.includes("await writeCloudHistory(updated,owner,scope)"));
 assert.ok(page.includes("historyFormScope.current=scope"));
 assert.ok(page.includes("historyScope.current===scope&&historyFormScope.current===scope"));
 assert.ok(page.includes("historyRevision.current===generation"));
 assert.ok(cloud.includes("writeCloudHistory(entry:EmploymentEntry,expectedOwner:string,expectedScope?:MessageScope)"));
 assert.ok(cloud.includes("if(expectedOwner!==owner)throw"));
 assert.ok(cloud.includes('eq("owner_id",owner)'));
 assert.ok(cloud.includes('rpc("jobeen_save_private_employment"'));
 assert.ok(cloud.includes('from("jobeen_employment_private_contact")'));
 assert.ok(cloud.includes("await assertMessageScope(scope)"));
});
test("Changing authenticated identity remounts state providers and rejects previous responses",()=>{
 const auth=src("src/components/AuthGate.tsx");
 const layout=src("src/app/_layout.tsx");
 const cache=src("src/state/useProfessionalData.ts");
 assert.ok(auth.includes('key={sessionScope??"signed-out"}'));
 assert.ok(auth.includes("revision++"));
 assert.ok(auth.includes("revision===checkedRevision"));
 assert.ok(auth.includes("const checkedRevision=++revision"));
 assert.ok(auth.includes("sessionMarkerKey(owner,current.data.session.access_token)!==key"));
 assert.ok(auth.includes("setSessionScope(key)"));
 assert.ok(auth.includes('event==="TOKEN_REFRESHED"'));
 assert.equal((auth.match(/setSessionScope\(key\)/g)??[]).length,1);
 assert.ok(layout.includes("<AuthGate><AppProvider><SocialProvider><NoticeProvider>"));
 assert.ok(cache.includes("generation.current===requestGeneration"));
 assert.ok(cache.includes("await sameOwner()"));
 assert.ok(cache.includes("sameScope(initial,await readScope())"));
 assert.ok(cache.includes("sessionMarkerKey(owner,session.access_token)"));
 assert.ok(cache.includes("workspaceMemory.write(initial,value)"));
 assert.ok(!cache.includes("AsyncStorage"),"Never restore or persist unencrypted professional workspace");
 const memory=src("src/lib/workspace-session-cache.ts");
 assert.ok(memory.includes("workspaceOwner(value)!==scope.owner"));
 assert.ok(memory.includes("entry.scope.session!==scope.session"));
 assert.ok(src("src/lib/professional-api.ts").includes("result.card.id!==user.id"));
});
test("Private device collections require the current authenticated UUID, not just a cache key",()=>{
 const guard=src("src/lib/account-scope.ts");
 assert.ok(guard.includes("data.session?.user.id!==owner"));
 for(const [file,owner] of [["post-drafts.ts","owner"],["jshop-local.ts","ownerId"],["search-history.ts","ownerId"],["feed-preferences.ts","owner"],["jshop-location.ts","owner"],["jshop-selling-location.ts","owner"]]){
  const s=src("src/lib/"+file);
  assert.ok(s.includes("await assertAccountOwner("+owner+")"),file);
  assert.ok(s.includes("import {assertAccountOwner}"),file);
 }
 const business=src("src/lib/business-card-cache.ts");
 assert.ok(!business.includes("AsyncStorage"));
 assert.ok(business.includes("if(scope.owner!==owner)throw"));
 assert.equal((business.match(/await assertAccountOwner\(owner,scope\.session\)/g)??[]).length,2);
 assert.ok(business.includes("memory.read(scope)"));
 assert.ok(business.includes("memory.write(scope,card)"));
});

test("Avatar saves cannot attach a previous user's photo to a new session",()=>{
 const editor=src("src/app/personal-avatar-editor.tsx");
 const upload=src("src/lib/personal-jcard-photo.ts");
 assert.ok(editor.includes("const scope=editorScope,owner=scope.owner"));
 assert.ok(editor.includes("readCloudBusiness(owner,scope)"));
 assert.ok(editor.includes('uploadPersonalJCardPhoto(result.base64??"","image/jpeg",owner,scope)'));
 assert.ok(upload.includes("user.id!==expectedOwner"));
 assert.ok(editor.includes("await captureMessageScope(scope)"));
 assert.ok(editor.includes("await assertMessageScope(scope)"));
 assert.ok(upload.includes("scope=await captureMessageScope(expectedScope)"));
 const uploadIndex=upload.indexOf("await db.storage.from(BUCKET).upload");
 const profileIndex=upload.indexOf('await db.from("profiles").update');
 assert.ok(uploadIndex>=0&&profileIndex>uploadIndex);
 assert.ok(upload.lastIndexOf("await assertMessageScope(scope);",uploadIndex)>=0);
 assert.ok(upload.indexOf("await assertMessageScope(scope);",uploadIndex)<profileIndex);
 assert.ok(upload.indexOf("await assertMessageScope(scope);",profileIndex)>profileIndex);
});

test("Saved-card actions and collections are bound to the account that rendered them",()=>{
 const api=src("src/lib/saved-jcards.ts");
 const gallery=src("src/components/SavedJCardsGallery.tsx");
 const visitor=src("src/app/jcard.tsx");
 assert.ok(api.includes("user.id!==expectedOwner"));
 assert.ok(api.includes("await assertAccountOwner(uid)"));
 assert.ok(gallery.includes("listSavedJCards(owner)"));
 assert.ok(gallery.includes("removeSavedJCard(item.targetId,item.side,owner)"));
 assert.ok(visitor.includes("saveVisibleJCard(user,activeCardSide,viewer)"));
});

test("Draft photo links are scoped to the initiating account and session",()=>{
 const scope=src("src/lib/account-scope.ts");
 const drafts=src("src/lib/post-drafts.ts");
 const editor=src("src/app/post/create.tsx");
 const restore=drafts.slice(drafts.indexOf("export async function restorePostDraftPhotoUrls"));
 assert.ok(scope.includes("sessionMarkerKey(owner,data.session.access_token)"));
 assert.ok(scope.includes("expectedSession&&session!==expectedSession"));
 assert.ok(restore.includes('paths.some(path=>!path.startsWith(owner+"/"))'));
 assert.ok(restore.indexOf("await assertAccountOwner(owner,session)")>restore.indexOf("createSignedUrls"));
 assert.ok(editor.includes("refreshDraftPhotoPreviews(d.photos)"));
 assert.ok(editor.includes("restorePostDraftPhotoUrls(selectedPhotos,author)"));
 assert.ok(editor.includes("restorePostDraftPhotoUrls(draft.photos,author)"));
 assert.ok(editor.includes("item.id===photo.id&&item.backupPath===photo.backupPath"));
 assert.ok(editor.includes("item.id===draft.id&&item.updatedAt===draft.updatedAt"));
});
