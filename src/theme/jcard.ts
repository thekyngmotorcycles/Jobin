import { composite,opacity,contrastRatio,secondaryText } from "./color.ts";
import type { ThemeName } from "../state/ThemeProvider";
import type { JCardTier } from "../lib/jcard";

/** JCard-specific tokens. Existing global theme palettes remain unchanged. */
const silver = {
  start: "#454950", end: "#555a62", text: "#ffffff", secondary: "#eeeeee",
  line: "#989ca3", sealFill: "#33373d", sealText: "#ffffff",
  pendingText: "#e0e0e0", pendingLine: "#b8bbc0", pendingFill: "#4a4f56",
};
const gold = {
  start: "#a47b36", end: "#b78e48", text: "#111111", secondary: "#111111",
  line: "#644718", sealFill: "#302519", sealText: "#ffffff",
  pendingText: "#24201a", pendingLine: "#49371f", pendingFill: "#ac833e",
};
function inverted(theme:ThemeName){
 const p=theme==="light"?{paper:"#F5F4F0",ink:"#171717"}:{paper:"#000000",ink:"#ffffff"};const fill=composite(opacity(p.paper,.12),p.ink);
 return {start:p.ink,end:p.ink,text:p.paper,secondary:secondaryText(p.paper,[p.ink]),line:opacity(p.paper,.3),sealFill:fill,sealText:p.paper,pendingText:secondaryText(p.paper,[p.ink]),pendingLine:opacity(p.paper,.5),pendingFill:p.ink};
}
const finishes = {light:{base:inverted("light"),silver,gold},dark:{base:inverted("dark"),silver,gold}};
export const jcardLayout = {
  avatar: 64, qr: 56, qrQuietZone: 4, radius: 18, padding: 14,
  gap: 5, minimumSealWidth: 38,
};
/** Shared responsive measurements for real JCard faces and the loading skeleton. */
export const jcardSurfaceMetrics={
 maxWidth:520, horizontalScreenInset:32, compactThreshold:350,
 lightHeight:330, darkHeight:400, compactHeightExtra:8,
 maxFontScale:1.3, fontScaleExtra:40, radius:30,
} as const;
export function jcardSurfaceSize(args:{screenWidth:number;measuredWidth?:number;fontScale:number;theme:ThemeName}){
 const m=jcardSurfaceMetrics;
 const width=args.measuredWidth&&args.measuredWidth>0?args.measuredWidth:Math.min(Math.max(args.screenWidth-m.horizontalScreenInset,0),m.maxWidth);
 const compact=width<m.compactThreshold;
 const height=(args.theme==="light"?m.lightHeight:m.darkHeight)+(compact?m.compactHeightExtra:0)+
  Math.round(Math.max(0,Math.min(args.fontScale,m.maxFontScale)-1)*m.fontScaleExtra);
 return {width,height,compact,radius:m.radius};
}
export function jcardProfilePortraitMetrics(cardWidth:number){
 const width=Math.max(60,Math.min(86,Math.round(cardWidth*.24)));
 const height=Math.round(width*1.1);
 return {width,height,overlap:height/4,inset:14,radius:14,coverHeight:Math.max(82,Math.min(148,Math.round(cardWidth*.30)))};
}
export type JCardProfilePortraitMetrics=ReturnType<typeof jcardProfilePortraitMetrics>;
export const proficiencyColors = {low:'#d84b54',middle:'#e4af42',high:'#219765'};
export const businessCardAccents = {name:"#151B24",category:"#465B6C",contact:"#354553",icon:"#416477"};
export const businessCardPaper = { background:"#ffffff", ink:"#111111", secondary:"#5d6165", border:"#dedede", muted:"#f5f5f5", outerBorder:"#e5e5e5" }; 
export const jcardReviewGlass = { border:"rgba(255,255,255,0.72)",fill:"rgba(238,243,249,0.17)",shadow:"#4D5C70",highlight:"#FFFFFF",highlightSoft:"#FFFFFF",mid:"#C4CFDA",shade:"#8C9BAC",ink:"#303B49",pending:"#687788",textHighlight:"rgba(255,255,255,0.75)" } as const;
export const jcardFloating = { modalBackdrop:"rgba(0,0,0,0.55)", shadow:"#000000", reviewFill:"rgba(32,33,36,0.68)", reviewInk:"#FFFFFF", awardFill:"rgba(245,245,245,0.13)", ribbonFill:"rgba(240,240,240,0.78)" } as const;
export const jcardCommon = {
  cardShadowColor:"#000000", cardShadowSurface:"#FFFFFF",
  scrim: "#000000aa", qrPaper: "#ffffff", qrBorder: "#d1d5db", qrInk: "#111111", editBackground: "#e5e5e5", editInk: "#555555", flipShadow: "rgba(0,0,0,0.09)", flipSurface: "rgba(0,0,0,0.035)", flipOutline: "rgba(0,0,0,0.10)", flipShadowDark: "rgba(255,255,255,0.22)", flipSurfaceDark: "rgba(255,255,255,0.13)", flipOutlineDark: "rgba(255,255,255,0.32)", flipInkDark:"#ffffff", glintEdge:"#ffffff",glintCenter:"#ffffff", verifiedBubble: "#38bdf8", unverifiedBubble: "#9ca3af", businessBronze:"#a36b43",businessSilver:"#a9b0bb",businessGold:"#c99a38",
};
export function jcardTokens(theme: ThemeName, tier: JCardTier) {
  // Rating-based silver and gold finishes remain unchanged in every appearance.
  if (tier === "silver") return silver;
  if (tier === "gold") return gold;
  // Only the unrated/base card switches between black and white.
  return theme === "dark" ? finishes.dark.base : finishes.light.base;
}

/** Opaque surfaces with guaranteed readable foreground for business ratings and badges. */
export const BUSINESS_INFORMATION_SURFACES={light:"#FFFFFF",dark:"#202124",lightInk:"#202124",darkInk:"#FFFFFF",lightBorder:"#74777D",darkBorder:"#9EA2A8",pendingLight:"#43464C",pendingDark:"#DADDE1"} as const;
export function businessInformationSurface(background:string){
 const t=BUSINESS_INFORMATION_SURFACES;
 const dark=contrastRatio(t.darkInk,background)>=4.5;
 return {fill:dark?t.dark:t.light,ink:dark?t.darkInk:t.lightInk,border:dark?t.darkBorder:t.lightBorder,pending:dark?t.pendingDark:t.pendingLight};
}

export const avatarEditorColors = {background:"#0B0D10",preview:"#20252B",guide:"rgba(20,26,38,0.30)",accent:"#B8C8FF",text:"#FFFFFF"} as const;

/** Shadow follows the rotating face instead of drawing a fixed Android elevation plate. */
export const jcardFlipShadow={rest:"0px 8px 18px rgba(0,0,0,0.22)"} as const;
