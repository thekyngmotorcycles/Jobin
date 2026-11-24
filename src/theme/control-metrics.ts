/** Royal Hive shared control metrics — visual review pending on physical devices.
 * Minimum heights allow controls to grow with system text size.
 */
export const JOBEEN_CONTROL={
 touchTarget:48,visualAction:48,optionDiameter:56,inputHeight:48,
 modalHorizontalPadding:16,modalContentGap:12,pageHorizontalPadding:16,
 panelPadding:16,panelGap:12,accordionRowVerticalPadding:9,settingsRowMinHeight:62,
 buttonRadius:12,inputRadius:12,cardRadius:16,icon:24,secondaryIcon:20,shareIcon:28,
 shareActionMin:48,shareActionMax:60,avatarMin:48,avatarMax:60,
 spacing:[4,8,12,16,24,32],
} as const;
export const ROYAL_HIVE_CONTROL=JOBEEN_CONTROL;
/** Available logical content width, not physical pixels or phone model. */
export function royalHiveLayout(width:number,fontScale=1,methodCount=4){
 const profile=width<360?"compact":width<400?"standard":"wide";
 const margin=profile==="compact"?12:profile==="standard"?16:24;
 const gap=profile==="wide"?12:8;
 const available=Math.max(0,width-2*margin);
 const count=Math.max(1,Math.floor(methodCount));
 const scale=Math.max(1,fontScale);
 const minCell=Math.max(JOBEEN_CONTROL.touchTarget,Math.ceil(48*scale));
 const methodsMinWidth=count*minCell+(count-1)*gap;
 const methodCell=Math.max(minCell,Math.floor((available-(count-1)*gap)/count));
 const actionSize=Math.max(JOBEEN_CONTROL.shareActionMin,Math.min(JOBEEN_CONTROL.shareActionMax,methodCell));
 const avatarSize=profile==="compact"?48:profile==="wide"?60:52;
 const recipientCell=Math.max(64,avatarSize+12,Math.ceil(64*scale));
 return {profile,margin,gap,available,touchTarget:JOBEEN_CONTROL.touchTarget,
  methodsMinWidth,methodsNeedScroll:available<methodsMinWidth,methodCell,
  methodsWidth:count*methodCell+(count-1)*gap,actionSize,avatarSize,recipientCell} as const;
}

/** Standard page geometry; specialized immersive views are excluded. */
export type JobeenPageKind="settings"|"form"|"list"|"management";
export function jobeenPageLayout(width:number,kind:JobeenPageKind){
 const {margin}=royalHiveLayout(width);
 const maxWidth=kind==="settings"||kind==="form"?720:980;
 return {padding:margin,gap:16,maxWidth,width:"100%",alignSelf:"center",paddingBottom:32} as const;
}
