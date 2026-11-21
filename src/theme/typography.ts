/**
 * Jobeen semantic type scale — reference: approved Premium Clean share sheet.
 * dp/sp units for React Native Text. Native font scaling stays enabled.
 * Larger phones use additional room for content, rather than growing every label.
 * Do not apply these to the Jobeen wordmark or JCard-specific artwork.
 */
export const JOBEEN_TYPE={
 display:30,
 headline:22,
 pageTitle:22,
 modalTitle:17,
 modalSectionTitle:13,
 modalRecipient:11,
 modalAction:13,
 sectionTitle:14,
 body:14,
 input:13,
 action:14,
 secondary:12,
 caption:11,
 micro:10,
} as const;

export const JOBEEN_LINE_HEIGHT={
 modalTitle:22,
 sectionTitle:19,
 body:21,
 secondary:18,
 caption:16,
} as const;

/** Keep density consistent across phones; accessibility font scaling remains native. */
export function jobeenTypeWidthScale(screenWidth:number){
 return screenWidth<360?0.95:1;
}
