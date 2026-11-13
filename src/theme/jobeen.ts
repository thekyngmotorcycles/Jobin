import {themeTokens,type ThemeName} from "./palettes";

/** Phase 1 Jobeen semantic tokens. Exported cards always use LIGHT_JOBEEN. */
export const LIGHT_JOBEEN={
 bg:"#FFFDF7",surface:"#FFFFFF",cream:"#FFF4CC",biz:"#FFF9E3",
 bizBorder:"#F0DFA0",yellow:"#F5C842",line:"#EFE7CF",
 ink:"#1C1C1C",ink2:"#555555",label:"#333333",textSoft:"#444444",
 starEmpty:"#8A7A3C",chipBorder:"#E2D9BC",
 okBackground:"#E6F4EA",okText:"#14633A",okDot:"#1E9E5A",
 qrBorder:"#E6DDBF",hexFront:"#F0D77A",hexBack:"#EDCF62",
 videoTile1:"#F2EBD6",videoTile2:"#FFF4CC",videoTile3:"#EDE5CC",
 bar:"rgba(255,253,247,0.94)",silver:"#C9CCD1",
} as const;

/** Other themes retain their original colors while using identical semantic keys. */
export function jobeenTokens(theme:ThemeName){
 if(theme==="light")return LIGHT_JOBEEN;
 const p=themeTokens(theme);
 return {
  bg:p.paper,surface:p.card,cream:p.accent,biz:p.card,bizBorder:p.line,
  yellow:p.reaction,line:p.line,ink:p.ink,ink2:p.muted,label:p.ink,
  textSoft:p.muted,starEmpty:p.muted,chipBorder:p.line,
  okBackground:p.card,okText:p.ink,okDot:p.statusLive,
  qrBorder:p.line,hexFront:p.accent,hexBack:p.accent,
  videoTile1:p.card,videoTile2:p.accent,videoTile3:p.card,
  bar:p.mediaControl,silver:p.muted,
 };
}
export const exportedJobeenTokens=LIGHT_JOBEEN;
