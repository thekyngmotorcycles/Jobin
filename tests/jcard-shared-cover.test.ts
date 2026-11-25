import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
const source=(path:string)=>readFileSync(path,"utf8");

test("Shared cover is one explicit owner-approved upload, independent of the JCard face and legacy banner",()=>{
 const editor=source("src/components/JCardSharedCover.tsx"),card=source("src/components/JobinCard.tsx"),api=source("src/lib/jcard-shared-cover.ts");
 assert.equal((card.match(/<JCardSharedCover /g)??[]).length,1);
 assert.ok(card.indexOf("<JCardSharedCover ")<card.indexOf("<BusinessCard3D height={cardHeight}"));
 assert.ok(!editor.includes("bannerUrl")&&!api.includes("getPublicUrl"));
 assert.ok(editor.includes("context.crop(")&&editor.includes("context.resize({width:1024})"));
 assert.ok(editor.includes('title="Publicar portada"')&&editor.includes("if(!candidate||!current)return;"));
 assert.ok(editor.includes("target===scope?.owner")&&editor.includes("revision.current===generation"));
 assert.ok(api.includes("createSignedUrl(path,SIGNED_SECONDS)")&&api.includes("SIGNED_SECONDS=60"));
 assert.ok(api.includes('eq("object_path",previous)')&&api.includes('upsert:false'));
 assert.ok(api.includes("if(origin.owner!==target)")&&api.includes("await assertMessageScope(scope)"));
 assert.ok(api.includes("if(write.error)throw write.error;")&&api.indexOf("await cleanup(target,previous,scope)")>api.indexOf("if(!write.data)"));
});
