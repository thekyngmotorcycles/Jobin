import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=(path:string)=>readFileSync(path,"utf8");
test("Credential uploads check original scope after reading device bytes and before registering",()=>{
 const api=read("src/lib/professional-api.ts");
 const upload=api.slice(api.indexOf("export async function uploadCredential"),api.indexOf("export async function credentialPreview"));
 assert.ok(upload.includes("captureMessageScope(expectedScope)"));
 assert.ok(upload.indexOf("await assertMessageScope(scope)")>upload.indexOf("await response.arrayBuffer()"));
 assert.ok(upload.indexOf("await assertMessageScope(scope)")<upload.indexOf(".upload(path,bytes"));
 assert.ok(upload.includes('professionalMutation("jobin_submit_credential",{profession,path},scope)'));
 assert.ok(upload.includes("bytes.byteLength>10485760"));
 assert.ok(!upload.includes("Ruta para reintentar"));
});
test("The credential picker discards old selection after losing the initiating scope",()=>{
 const screen=read("src/app/certificates.tsx");
 assert.ok(screen.includes("selected.scope!==origin"));
 assert.ok(screen.includes("scopeRef.current===origin&&!result.canceled"));
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
