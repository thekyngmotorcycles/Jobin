import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const src=(path:string)=>readFileSync(path,"utf8");

test("Professional history never reads or migrates unowned legacy storage",()=>{
 const page=src("src/app/(tabs)/profile.tsx");
 const cloud=src("src/lib/jcard-cloud.ts");
 assert.ok(!page.includes("jobin.professional.history.v1"));
 assert.ok(page.includes('"jobeen.professional.history.v2."+owner'));
 assert.ok(page.includes("historyState.owner===ownerId"));
 assert.ok(page.includes("await readCloudHistory(owner)"));
 assert.ok(page.includes("await writeCloudHistory(updated,owner)"));
 assert.ok(!page.includes("for(const item of local)"));
 assert.ok(cloud.includes("writeCloudHistory(entry:EmploymentEntry,expectedOwner:string)"));
 assert.ok(cloud.includes("if(expectedOwner!==owner)throw"));
 assert.ok(cloud.includes('eq("owner_id",owner)'));
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
 assert.ok(cache.includes("card?.id===userId"));
 assert.ok(cache.includes("card?.id!==initial"));
 assert.ok(src("src/lib/professional-api.ts").includes("result.card.id!==user.id"));
});
test("Private device collections require the current authenticated UUID, not just a cache key",()=>{
 const guard=src("src/lib/account-scope.ts");
 assert.ok(guard.includes("data.session?.user.id!==owner"));
 for(const [file,owner] of [["post-drafts.ts","owner"],["jshop-local.ts","ownerId"],["search-history.ts","ownerId"],["business-card-cache.ts","owner"],["feed-preferences.ts","owner"],["jshop-location.ts","owner"],["jshop-selling-location.ts","owner"]]){
  const s=src("src/lib/"+file);
  assert.ok(s.includes("await assertAccountOwner("+owner+")"),file);
  assert.ok(s.includes("import {assertAccountOwner}"),file);
 }
});

test("Avatar saves cannot attach a previous user's photo to a new session",()=>{
 const editor=src("src/app/personal-avatar-editor.tsx");
 const upload=src("src/lib/personal-jcard-photo.ts");
 assert.ok(editor.includes("const owner=editorOwner"));
 assert.ok(editor.includes("readCloudBusiness(owner)"));
 assert.ok(editor.includes('uploadPersonalJCardPhoto(result.base64??"","image/jpeg",owner)'));
 assert.ok(upload.includes("user.id!==expectedOwner"));
 assert.ok(upload.indexOf("await assertAccountOwner(user.id);",upload.indexOf("if(uploaded.error)"))>upload.indexOf("if(uploaded.error)"));
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
 assert.ok(editor.includes("restorePostDraftPhotoUrls(d.photos,author)"));
 assert.ok(editor.includes("restorePostDraftPhotoUrls(draft.photos,author)"));
 assert.ok(editor.includes("item.id===photo.id&&item.backupPath===photo.backupPath"));
 assert.ok(editor.includes("item.id===draft.id&&item.updatedAt===draft.updatedAt"));
});
