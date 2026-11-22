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
 for(const [file,owner] of [["feed-preferences.ts","owner"]]){
  const s=src("src/lib/"+file);
  assert.ok(s.includes("await assertAccountOwner("+owner+",scope.session)"),file);
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

test("Saved-card actions and collections are bound to the account, session and target face that rendered them",()=>{
 const api=src("src/lib/saved-jcards.ts");
 const gallery=src("src/components/SavedJCardsGallery.tsx");
 const visitor=src("src/app/jcard.tsx");
 assert.ok(api.includes("scope.owner!==expectedOwner"));
 assert.ok(api.includes("await captureMessageScope(expectedScope)"));
 assert.ok(api.includes("await assertMessageScope(scope)"));
 assert.ok(api.includes("r.saver_id===uid"));
 assert.ok(!api.includes("AsyncStorage"));
 assert.ok(gallery.includes("listSavedJCards(owner,scope)"));
 assert.ok(gallery.includes("removeSavedJCard(item.targetId,item.side,owner,scope)"));
 assert.ok(gallery.includes("revision.current===generation"));
 assert.ok(gallery.includes("scopeRef.current===scope"));
 assert.ok(gallery.includes("setReady(false);setItems([])"));
 assert.ok(visitor.includes("saveVisibleJCard(user,activeCardSide,viewer,origin.scope)"));
 assert.ok(visitor.includes("origin.target!==user||origin.side!==activeCardSide"));
 assert.ok(visitor.includes("savedScope.current===origin&&savedRevision.current===origin.generation"));
 assert.ok(visitor.includes("savedReady&&cardVisibilityReady&&sideIsPublic"));
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
 assert.ok(editor.includes("restorePostDraftPhotoUrls(selectedPhotos,author,scope)"));
 assert.ok(editor.includes("restorePostDraftPhotoUrls(draft.photos,author,scope)"));
 assert.ok(editor.includes("item.id===photo.id&&item.backupPath===photo.backupPath"));
 assert.ok(editor.includes("item.id===draft.id&&item.updatedAt===draft.updatedAt"));
});

test("Search results, profile navigation and recent terms are bound to originating session",()=>{
 const search=src("src/app/search.tsx"),history=src("src/lib/search-history.ts"),api=src("src/lib/professional-api.ts");
 assert.ok(!history.includes("AsyncStorage"));
 assert.ok(history.includes("await assertAccountOwner(ownerId,scope.session)"));
 assert.ok(history.includes('event==="SIGNED_OUT"'));
 assert.ok(history.includes("createBusinessSessionMemory<string[]>()"));
 assert.ok(search.includes("scopeRef.current===scope&&searchRevision.current===generation"));
 assert.ok(search.includes("historyRevision.current===revision"));
 assert.ok(search.includes("await captureMessageScope(scope)"));
 assert.ok(search.includes("findAllAccounts(term,city||currentIntent.city,scope)"));
 assert.ok(search.includes("respectJCardVisibility"));
 assert.ok(api.includes("await assertMessageScope(scope)"));
});

test("JShop location stores are bound to the originating session and do not persist plaintext coordinates",()=>{
 const buyer=src("src/lib/jshop-location.ts"),seller=src("src/lib/jshop-selling-location.ts");
 for(const s of [buyer,seller]){assert.ok(!s.includes("AsyncStorage"));assert.ok(s.includes("scope.owner!==owner"));assert.ok(s.includes("memory")||s.includes("pending"));}
 assert.ok(buyer.includes("await assertAccountOwner(owner,scope.session)"));
 assert.ok(seller.includes("await captureMessageScope(expectedScope)"));
 assert.ok(seller.includes("entries.delete(editor)"));
});

test("Private draft writes and reads retain exact session and refuse to overwrite ambiguous data",()=>{
 const posts=src("src/lib/post-drafts.ts"),shop=src("src/lib/jshop-local.ts"),editor=src("src/app/post/create.tsx"),api=src("src/lib/social-content.ts");
 assert.ok(posts.includes("await assertAccountOwner(owner,scope.session)"));
 assert.ok(shop.includes("await assertAccountOwner(ownerId,scope.session)"));
 assert.ok(posts.includes("serializePrivateWrite(key(owner)"));
 assert.ok(shop.includes("serializePrivateWrite(draftsKey(ownerId)"));
 assert.ok(shop.includes("item.ownerId!==ownerId"));
 assert.ok(editor.includes("liveScope(scope)"));
 assert.ok(editor.includes("savePostDraft(author,value,scope)"));
 assert.ok(editor.includes("uploadPhoto(author,photo.uri,DRAFT_PHOTO_BUCKET,scope)"));
 assert.ok(api.includes("if(!insertStarted&&uploaded.length)"));
});

test("Social interactions and post return are bound to originating account and session",()=>{
 const api=src("src/lib/social-content.ts"),feed=src("src/components/HomePublishedPosts.tsx"),options=src("src/components/FeedPostOptions.tsx"),prefs=src("src/lib/feed-preferences.ts"),handoff=src("src/lib/post-return.ts"),story=src("src/app/story/create.tsx");
 assert.ok(api.includes("await captureMessageScope(expectedScope)"));
 assert.ok(feed.includes("setHomePostLike(post.id,!liked,scope)"));
 assert.ok(feed.includes("addHomePostComment(post.id,draft,scope)"));
 assert.ok(feed.includes('contentMessage={Linking.createURL("post/"+post.id)}'));
 assert.ok(options.includes("activeScope.current===scope"));
 assert.ok(prefs.includes('serializePrivateWrite(key(owner,"saved")'));
 assert.ok(handoff.includes("memory.read(scope)"));
 assert.ok(story.includes("void submit(scope)"));
});
