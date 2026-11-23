import {jobeenTokens,LIGHT_JOBEEN} from "./jobeen";
import type {ThemeName} from "./palettes";

/**
 * Provisional Jobeen Premium Warm modal system — pending visual approval on Android.
 * All ordinary menus and sheets share a surface, spacing and typography family.
 * JCard artwork, immersive media and the device-native share chooser are excluded.
 */
export const JOBEEN_MODAL_RADIUS={sheet:30,dialog:26,popover:18,control:16} as const;
export type JobeenNoticeTone="neutral"|"info"|"success"|"warning"|"danger";

export function jobeenModalTokens(theme:ThemeName,tone:JobeenNoticeTone="neutral"){
 const t=jobeenTokens(theme);
 const light=theme==="light";
 const surface=light?"#FCF9F4":t.surface;
 const inner=light?LIGHT_JOBEEN.surface:t.bg;
 const border=light?LIGHT_JOBEEN.line:t.line;
 const accent=light?LIGHT_JOBEEN.yellow:t.yellow;
 const text=t.ink,muted=t.ink2;
 const accents={
  neutral:{background:surface,foreground:text,icon:accent},
  info:{background:light?"#EAF3FF":t.cream,foreground:light?"#1D497E":text,icon:light?"#2966A7":accent},
  success:{background:light?"#E6F4EA":t.cream,foreground:light?"#14633A":text,icon:light?"#1E9E5A":accent},
  warning:{background:light?"#FFF0CA":t.cream,foreground:light?"#71480D":text,icon:light?"#BC8100":accent},
  danger:{background:light?"#FBE8E8":t.cream,foreground:light?"#922B2B":text,icon:light?"#C23F40":accent},
 } as const;
 return {
  surface,inner,border,accent,text,muted,soft:t.cream,
  destructiveOnColor:light?LIGHT_JOBEEN.surface:text,
  scrim:light?"rgba(0,0,0,0.48)":"rgba(0,0,0,0.62)",
  handle:t.silver,
  ...accents[tone],
  radius:JOBEEN_MODAL_RADIUS,
 };
}

/** Candidate semantic states from Master Plan v1.1 §2.2. */
export const ROYAL_HIVE_STATES={
 light:{
  success:{background:"#E6F4EA",foreground:"#14633A"},info:{background:"#EAF3FF",foreground:"#1D497E"},
  warning:{background:"#FFF0CA",foreground:"#71480D"},danger:{background:"#FBE8E8",foreground:"#922B2B"},
  live:{background:"#B91C1C",foreground:"#FFFFFF"},
 },
 dark:{
  success:{background:"#123523",foreground:"#86E3AB"},info:{background:"#152D4A",foreground:"#A9CFFF"},
  warning:{background:"#3D2C14",foreground:"#FFD47A"},danger:{background:"#482329",foreground:"#FFB4B4"},
  live:{background:"#B91C1C",foreground:"#FFFFFF"},
 },
} as const;
