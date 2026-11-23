import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {thumbnailUrl,userImageSource} from "../src/lib/media-urls.ts";
test("only unadorned public object addresses receive thumbnail transformations",()=>{
 const base="https://example.test/storage/v1/object/public/jobeen-post-photos/a/photo.jpg";
 const transformed=thumbnailUrl(base,320);
 assert.ok(transformed.includes("/storage/v1/render/image/public/"));
 assert.ok(transformed.includes("width=320"));
 for(const uri of [
  "https://example.test/storage/v1/object/sign/private/a/photo.jpg?token=fixture",
  base+"?token=fixture",base+"#fixture","file:///fixture.jpg",
  "https://name:fixture@example.test/storage/v1/object/public/jobeen-post-photos/a/photo.jpg"
 ])assert.equal(thumbnailUrl(uri),uri);
});
test("signed image request preserves the exact URL and never selects force-cache",()=>{
 const uri="https://example.test/storage/v1/object/sign/private/a/photo.jpg?token=fixture";
 assert.deepEqual(userImageSource(uri),{uri,cache:"reload",headers:{"Cache-Control":"no-cache, no-store"}});
 assert.deepEqual(userImageSource("file:///fixture.jpg"),{uri:"file:///fixture.jpg"});
 assert.deepEqual(userImageSource(undefined),{uri:undefined});
});
test("private share and personal avatar refresh remain bound to the original scope",()=>{
 const read=(p:string)=>readFileSync(p,"utf8");
 const share=read("src/lib/share-contacts.ts"),sheet=read("src/components/JCardShareSheet.tsx"),photo=read("src/lib/personal-jcard-photo.ts");
 assert.ok(share.includes("loadShareRecipients(scope)"));
 assert.ok(share.includes("loadContactAccess(id,scope)"));
 assert.ok(share.includes("sender_id:scope.owner"));
 assert.ok(sheet.includes("await captureMessageScope(task.scope)"));
 assert.ok(sheet.includes("generation.current===task.revision"));
 assert.ok(sheet.includes("if(timer.current)clearTimeout(timer.current)"));
 assert.ok(photo.includes('if(next!==observed||event==="SIGNED_OUT")photoChanged.clear()'));
 assert.ok(photo.includes("photoChanged.read(scope)"));
 assert.ok(photo.includes("photoChanged.write(scope,true)"));
});
