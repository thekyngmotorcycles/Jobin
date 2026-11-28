/** Royal Hive semantic typography — Master Plan v1.2, visual review pending.
 * Logical sp/dp; native accessibility font scaling stays enabled.
 * JCard-specific art and the official wordmark have independent typography.
 */
export const JOBEEN_TYPE={
 display:30,headline:22,pageTitle:22,navigationTitle:18,
 modalTitle:20,modalSectionTitle:17,modalRecipient:14,modalAction:15,
 sectionTitle:17,body:15,input:15,action:15,secondary:12,caption:12,micro:10,
} as const;
export const JOBEEN_LINE_HEIGHT={
 display:36,headline:28,pageTitle:28,navigationTitle:24,modalTitle:26,modalSectionTitle:22,
 modalRecipient:18,modalAction:20,sectionTitle:22,body:21,input:21,action:20,secondary:17,caption:16,micro:14,
} as const;
/** Fit content to width without reducing accessible text sizes. */
export function jobeenTypeWidthScale(_screenWidth:number){return 1;}
export const ROYAL_HIVE_TYPE=JOBEEN_TYPE;
export const ROYAL_HIVE_LINE_HEIGHT=JOBEEN_LINE_HEIGHT;

/** Approved profile-first candidate. Existing global tokens remain unchanged until rollout is approved.
 * Width is logical layout width, never physical pixels or the accessibility font multiplier.
 */
const legacyTypography={type:{...JOBEEN_TYPE,segmented:13},lineHeight:{...JOBEEN_LINE_HEIGHT,segmented:18},adaptive:false} as const;
const compactTypography={type:{...JOBEEN_TYPE,headline:20,pageTitle:20,navigationTitle:16,modalTitle:18,modalSectionTitle:15,modalAction:13,modalRecipient:14,sectionTitle:15,body:14,input:14,action:13,segmented:12},lineHeight:{...JOBEEN_LINE_HEIGHT,headline:26,pageTitle:26,navigationTitle:22,modalTitle:24,modalSectionTitle:20,modalAction:18,sectionTitle:20,body:20,input:20,action:18,segmented:16,secondary:16},adaptive:true} as const;
const standardTypography={type:{...JOBEEN_TYPE,headline:21,pageTitle:21,navigationTitle:17,modalTitle:19,modalSectionTitle:16,modalAction:14,sectionTitle:16,action:14,segmented:13,micro:11},lineHeight:{...JOBEEN_LINE_HEIGHT,headline:27,pageTitle:27,navigationTitle:23,modalTitle:25,modalSectionTitle:21,modalAction:19,sectionTitle:21,action:19,segmented:17,micro:15},adaptive:true} as const;
const wideTypography={type:{...JOBEEN_TYPE,segmented:14,secondary:13,caption:13,micro:11},lineHeight:{...JOBEEN_LINE_HEIGHT,segmented:18,secondary:18,caption:18,micro:15},adaptive:true} as const;
export function royalHiveTypography(width:number,profile=false){
 if(!profile)return legacyTypography;
 if(!Number.isFinite(width)||width<=0)return standardTypography;
 return width<360?compactTypography:width<400?standardTypography:wideTypography;
}
