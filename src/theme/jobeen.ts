import {themeTokens,ROYAL_HIVE_PALETTE,ROYAL_HIVE_STATES,ROYAL_HIVE_BRAND,type ThemeName} from "./palettes";
import {composite,opacity,secondaryText} from "./color";

/** Preserved JCard artwork/export palette; not a selectable global appearance. */
export const LIGHT_JOBEEN={
 bg:"#FFFDF7",surface:"#FFFFFF",cream:"#FFF4CC",biz:"#FFF9E3",
 bizBorder:"#F0DFA0",yellow:"#F5C842",line:"#EFE7CF",
 ink:"#1C1C1C",ink2:"#555555",label:"#333333",textSoft:"#444444",
 starEmpty:"#8A7A3C",chipBorder:"#E2D9BC",
 okBackground:"#E6F4EA",okText:"#14633A",okDot:"#1E9E5A",
 qrBorder:"#E6DDBF",hexFront:"#F0D77A",hexBack:"#EDCF62",
 videoTile1:"#F2EBD6",videoTile2:"#FFF4CC",videoTile3:"#EDE5CC",
 videoViewsOverlay:"rgba(0,0,0,0.6)",videoViewsText:"#FFFFFF",
 bar:"rgba(255,253,247,0.94)",silver:"#C9CCD1",floatingCardShadow:"#000000",
 feedPhotoCounterBg:"rgba(0,0,0,0.64)",feedPhotoCounterText:"#FFFFFF",feedLiked:"#E64C5B",uploadScrim:"rgba(0,0,0,0.36)",
} as const;

/** Historical artwork tokens are independent of the global appearance palette. */
export function jcardArtTokens(theme:ThemeName){
 if(theme==="light")return LIGHT_JOBEEN;
 const paper="#000000",ink="#ffffff";
 const card=composite(opacity(ink,.025),paper),accent=composite(opacity(ink,.06),paper);
 const line=opacity(ink,.18),muted=secondaryText(ink,[paper,card,accent]);
 return {
  bg:paper,surface:card,cream:accent,biz:card,bizBorder:line,yellow:ink,line,ink,ink2:muted,label:ink,
  textSoft:muted,starEmpty:muted,chipBorder:line,okBackground:card,okText:ink,okDot:ink,
  qrBorder:line,hexFront:accent,hexBack:accent,videoTile1:card,videoTile2:accent,videoTile3:card,
  videoViewsOverlay:"rgba(0,0,0,0.6)",videoViewsText:"#FFFFFF",
  bar:opacity(paper,.94),silver:muted,floatingCardShadow:"#000000",
  feedPhotoCounterBg:"rgba(0,0,0,0.64)",feedPhotoCounterText:"#FFFFFF",feedLiked:ink,uploadScrim:"rgba(0,0,0,0.36)",
 };
}
/** Shared application chrome: Royal Hive, independent of the user's JCard art. */
export function jobeenTokens(theme:ThemeName){
 const p=ROYAL_HIVE_PALETTE[theme],states=ROYAL_HIVE_STATES[theme],art=jcardArtTokens(theme);
 return {...art,bg:p.paper,surface:p.surface,cream:p.selected,biz:p.surface,bizBorder:p.line,
  yellow:p.primary,onYellow:p.onPrimary,accentText:theme==="light"?p.ink:p.primary,
  line:p.line,outline:p.outline,ink:p.ink,ink2:p.muted,label:p.ink,textSoft:p.muted,
  starEmpty:p.muted,chipBorder:p.line,okBackground:states.success.background,okText:states.success.foreground,okDot:states.success.foreground,
  qrBorder:p.line,hexFront:p.selected,hexBack:p.selected,videoTile1:p.surface,videoTile2:p.selected,videoTile3:p.surface,
  bar:opacity(p.paper,.94),silver:ROYAL_HIVE_BRAND.silver,feedLiked:LIGHT_JOBEEN.feedLiked,
 };
}
export const exportedJobeenTokens=LIGHT_JOBEEN;

/** Light sweep for the premium JCard flip; centralized to preserve theme color invariants. */
export const JCARD_FLIP_GLARE=["transparent","rgba(255,255,255,0.55)","transparent"] as const;
