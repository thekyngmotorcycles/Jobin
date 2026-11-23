import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=(path:string)=>readFileSync(path,"utf8");
test("Credential uploads check original scope after reading device bytes and before registering",()=>{
 const api=read("src/lib/professional-api.ts");
 const upload=api.slice(api.indexOf("export async function uploadCredential"),api.indexOf("export async function credentialPreview"));
 assert.ok(upload.includes("captureMessageScope(expectedScope)"));
 assert.match(upload,/await uploadSecuredFile\(scope,"report-evidence",file,"professional-certificates"\)/);
 const storage=read("src/lib/private-attachment-android.ts");
 assert.ok(storage.indexOf("assertEvidenceSession(file as PendingEvidence,scope)")<storage.indexOf(".upload(path,bytes"));
 assert.match(storage,/sessionMarkerKey\(scope.owner,session.access_token\)!==scope.session/);
 assert.doesNotMatch(upload,/arrayBuffer|file\.uri/);
 assert.ok(upload.includes('professionalMutation("jobin_submit_credential",{profession,path},scope)'));
 assert.match(read("src/lib/private-attachment.ts"),/PRIVATE_ATTACHMENT_LIMIT=2\*1024\*1024/);
 assert.ok(!upload.includes("Ruta para reintentar"));
});
test("The credential picker discards old selection after losing the initiating scope",()=>{
 const screen=read("src/app/certificates.tsx");
 assert.ok(screen.includes("selected.scope!==origin"));
 assert.ok(screen.includes("scopeRef.current===origin&&asset"));
 assert.ok(screen.includes("uploadCredential(selected.asset,profession,origin)"));
 assert.ok(screen.includes("scopeRef.current=null;setScope(null);setFile(null)"));
 assert.ok(screen.includes("r.owner_id===scope?.owner"));
});
test("Document review checks originating scope before opening or deciding",()=>{
 const screen=read("src/app/credential-review.tsx");
 const api=read("src/lib/professional-api.ts");
 assert.ok(screen.includes("loadQueue(filter,scope)"));
 assert.ok(screen.includes("queue.data?.scope===scope"));
 assert.ok(screen.includes("credentialPreview(r.storage_path,origin)"));
 assert.ok(screen.indexOf("await assertMessageScope(origin)")<screen.indexOf("await Linking.openURL(url)"));
 assert.ok(screen.includes('professionalMutation("jobin_decide_credential",{request:r.id,approve,reason},origin)'));
 assert.ok(api.includes("createSignedUrl(path,120)"));
});
