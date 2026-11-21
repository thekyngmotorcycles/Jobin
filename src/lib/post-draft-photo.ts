export type PostDraftPhoto={
 id:string;
 uri:string;
 backupPath?:string;
 altText:string;
 previewUri?:string;
};

export const DRAFT_PREVIEW_TTL_SECONDS=300;

const localImageUri=/^(file:|content:|ph:|assets-library:|blob:|data:image\/)/i;

export function toStoredDraftPhoto(photo:PostDraftPhoto):PostDraftPhoto{
 // Legacy drafts may contain a signed URL in uri. Restore through backupPath
 // after checking the session; keep device-local originals available offline.
 return {
  id:photo.id,
  uri:typeof photo.uri==="string"&&localImageUri.test(photo.uri)?photo.uri:"",
  backupPath:typeof photo.backupPath==="string"?photo.backupPath:undefined,
  altText:typeof photo.altText==="string"?photo.altText:"",
 };
}

export function draftPhotoDisplayUri(photo?:PostDraftPhoto):string|undefined{
 return photo?.previewUri||photo?.uri||undefined;
}
