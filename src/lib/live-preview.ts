/** Local preview is never a publication authorization or a streaming transport. */
export type PreviewScope={owner:string;session:string};
export function canShowLivePreview(input:{
 focused:boolean;foreground:boolean;requested:boolean;cameraGranted:boolean;
 verified:PreviewScope|null;current:PreviewScope|null;
}):boolean{
 const {verified,current}=input;
 return input.focused&&input.foreground&&input.requested&&input.cameraGranted&&
  !!verified&&!!current&&!!verified.owner&&!!verified.session&&
  verified.owner===current.owner&&verified.session===current.session;
}
