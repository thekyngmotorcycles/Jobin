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
 navigationTitle:18,
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

/** Candidate lower bounds from Master Plan v1.1 §13.2; compare with the live scale.
 * Do not change JOBEEN_TYPE or its compact factor until reference screens are reviewed.
 */
export const ROYAL_HIVE_TYPE={
 ...JOBEEN_TYPE,modalTitle:20,modalSectionTitle:17,modalRecipient:14,modalAction:15,
 sectionTitle:17,body:15,input:15,action:15,caption:12,
} as const;
export const ROYAL_HIVE_LINE_HEIGHT={
 display:36,headline:28,pageTitle:28,navigationTitle:24,modalTitle:26,modalSectionTitle:22,
 modalRecipient:18,modalAction:20,sectionTitle:22,body:21,input:21,action:20,secondary:17,caption:16,micro:14,
} as const;
