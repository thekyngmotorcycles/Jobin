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
 assert.ok(api.includes('READER="jcard-cover-read"')&&api.includes("db.functions.invoke<SharedCover>(READER"));
 assert.ok(!api.includes("createSignedUrl")&&!api.includes(".download("));
 assert.ok(api.includes('eq("object_path",previous)')&&api.includes('upsert:false'));
 assert.ok(api.includes("if(origin.owner!==target)")&&api.includes("await assertMessageScope(scope)"));
 assert.ok(api.includes("if(write.error)throw write.error;")&&api.indexOf("await cleanup(target,previous,scope)")>api.indexOf("if(!write.data)"));
});


test("Cover editor remounts on target or session change and removal failure remains visible",()=>{
 const editor=source("src/components/JCardSharedCover.tsx");
 assert.ok(editor.includes("JSON.stringify([props.target??null,props.scope?.owner??null,props.scope?.session??null,!!props.editable])"));
 assert.ok(editor.includes("<ScopedJCardSharedCover key={key} {...props}/>"));
 assert.ok(editor.includes('onPress={()=>{setError("");setConfirmRemove(true);}}'));
 assert.ok(editor.includes('description={error||"La portada dejará de mostrarse en tu perfil."}'));
 assert.ok(editor.includes("if(active())setError("));
});


test("Cover client uses only an inline scoped image and preserves upload/CAS/cleanup",()=>{
 const api=source("src/lib/jcard-shared-cover.ts");
 assert.ok(api.includes('Authorization:"Bearer "+session.data.session.access_token')&&api.includes('"Cache-Control":"no-store"'));
 assert.ok(api.includes("data:image")&&api.includes("Math.ceil(MAX_BYTES/3)*4+64"));
 assert.ok(api.includes('.remove([path])')&&api.includes('upsert:false'));
 assert.ok(!api.includes("createSignedUrl")&&!api.includes("getPublicUrl"));
});
