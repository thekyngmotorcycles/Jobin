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
 assert.ok(auth.includes('key={sessionOwner??"signed-out"}'));
 assert.ok(auth.includes("revision++"));
 assert.ok(auth.includes("revision===checkedRevision"));
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
 for(const [file,owner] of [["post-drafts.ts","owner"],["jshop-local.ts","ownerId"],["search-history.ts","ownerId"]]){
  const s=src("src/lib/"+file);
  assert.ok(s.includes("await assertAccountOwner("+owner+")"),file);
  assert.ok(s.includes("import {assertAccountOwner}"),file);
 }
});
