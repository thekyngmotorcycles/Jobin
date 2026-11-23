/**
 * Provisional Jobeen control metrics. Confirm on Android before considering permanent.
 * Measured visual dimensions are intentionally smaller than touch targets.
 */
export const JOBEEN_CONTROL={
 touchTarget:48,
 visualAction:40,
 optionDiameter:56,
 inputHeight:42,
 modalHorizontalPadding:18,
 modalContentGap:10,
 pageHorizontalPadding:18,
 panelPadding:14,
 panelGap:10,
 accordionRowVerticalPadding:9,
 settingsRowMinHeight:62,
} as const;

/** Royal Hive v1.1 reference metrics; inactive until the visual review. */
export const ROYAL_HIVE_CONTROL={
 ...JOBEEN_CONTROL,visualAction:48,optionDiameter:56,inputHeight:48,modalHorizontalPadding:16,
 modalContentGap:12,pageHorizontalPadding:16,
 buttonRadius:12,inputRadius:12,cardRadius:16,icon:24,secondaryIcon:20,shareIcon:28,
 shareActionMin:48,shareActionMax:60,avatarMin:48,avatarMax:60,
 spacing:[4,8,12,16,24,32],
} as const;
/** Based on available logical width, not hardware pixels. Never scale the touch target. */
export function royalHiveLayout(width:number){
 const profile=width<360?"compact":width<400?"standard":"wide";
 const margin=profile==="compact"?12:profile==="standard"?16:24;
 const gap=profile==="wide"?12:8;
 const available=Math.max(0,width-2*margin);
 const methodsMinWidth=4*ROYAL_HIVE_CONTROL.touchTarget+3*gap;
 return {profile,margin,gap,touchTarget:ROYAL_HIVE_CONTROL.touchTarget,
  methodsMinWidth,methodsNeedScroll:available<methodsMinWidth} as const;
}
