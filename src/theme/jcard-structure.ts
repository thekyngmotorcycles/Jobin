import type {ThemeName} from "../state/ThemeProvider";

/**
 * B+C Phase 2, change 1: centralize the existing approved JCard measurements.
 * These values intentionally preserve the current visual output.
 */
export const jcardSectionStyles={
 header:{flexShrink:0},
 content:{flex:1,minHeight:0},
 footer:{flexShrink:0}
} as const;

export const jcardSectionMetrics={
 gridUnit:4,
 personal:{
  light:{padding:12,gap:5,footerHeight:76},
  other:{padding:14,gap:8,footerHeight:92,footerWithSecondaryHeight:166}
 },
 business:{
  light:{paddingHorizontal:10,paddingTop:10,paddingBottom:8,gap:1},
  other:{paddingHorizontal:14,paddingTop:16,paddingBottom:9,gap:5},
  footerHeight:64
 }
} as const;

/** Retain the current personal-card dimensions for all themes and data states. */
export function personalJCardFaceMetrics(theme:ThemeName,hasSecondaryProfessions:boolean){
 const p=jcardSectionMetrics.personal;
 return {
  padding:theme==="light"?p.light.padding:p.other.padding,
  gap:theme==="light"?p.light.gap:p.other.gap,
  footerHeight:theme==="light"?p.light.footerHeight:
   hasSecondaryProfessions?p.other.footerWithSecondaryHeight:p.other.footerHeight
 };
}

/** Retain the current business-card dimensions independently of content length. */
export function businessJCardFaceMetrics(theme:ThemeName){
 const b=jcardSectionMetrics.business;
 return {...(theme==="light"?b.light:b.other),footerHeight:b.footerHeight};
}
