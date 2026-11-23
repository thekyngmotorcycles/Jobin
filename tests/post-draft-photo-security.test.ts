import test from "node:test";
import assert from "node:assert/strict";
import {DRAFT_PREVIEW_TTL_SECONDS,draftPhotoDisplayUri,toStoredDraftPhoto} from "../src/lib/post-draft-photo.ts";

test("Draft backups use memory-only previews without reopening unverified device paths",()=>{
 const photo={
  id:"draft-photo",uri:"content://media/photos/42",backupPath:"owner/photo.jpg",altText:"A tool",
  previewUri:"https://storage.example.invalid/object/sign/bucket/photo.jpg?token=opaque",
 };
 assert.equal(draftPhotoDisplayUri(photo),photo.previewUri);
 const stored=toStoredDraftPhoto(photo);
 assert.equal(draftPhotoDisplayUri(stored),undefined);
 assert.ok(!JSON.stringify(stored).includes("content://"));
 assert.equal(stored.backupPath,photo.backupPath);
 assert.equal(stored.altText,photo.altText);
 assert.ok(!JSON.stringify(stored).includes("token="));
 assert.equal(DRAFT_PREVIEW_TTL_SECONDS,300);
});

test("Legacy signed URLs are not rendered or stored, but the backup remains recoverable",()=>{
 const stored=toStoredDraftPhoto({
  id:"legacy",uri:"https://storage.example.invalid/object/sign/bucket/photo.jpg?token=opaque",
  backupPath:"owner/legacy.jpg",altText:"Legacy",
 });
 assert.equal(draftPhotoDisplayUri(stored),undefined);
 assert.equal(stored.backupPath,"owner/legacy.jpg");
 assert.ok(!JSON.stringify(stored).includes("token="));
});
