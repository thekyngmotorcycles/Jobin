import type {PrivateAttachment} from "./private-attachment";
export type PostDraftPhoto={
 id:string;
 uri?:string;
 attachment?:PrivateAttachment;
 backupPath?:string;
 altText:string;
 previewUri?:string;
};

export const DRAFT_PREVIEW_TTL_SECONDS=300;

export function toStoredDraftPhoto(photo:PostDraftPhoto):PostDraftPhoto{
 // A bare legacy URI has no verified ownership. Never keep it in the active draft.
 return {
  id:photo.id,
  attachment:photo.attachment,
  backupPath:typeof photo.backupPath==="string"?photo.backupPath:undefined,
  altText:typeof photo.altText==="string"?photo.altText:"",
 };
}

export function draftPhotoDisplayUri(photo?:PostDraftPhoto):string|undefined{
 return photo?.previewUri||undefined;
}
