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
