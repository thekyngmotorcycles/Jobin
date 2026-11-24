import {composite,contrastRatio,opacity} from "./color.ts";

/** Royal Hive is the only global visual identity, in light and dark. */
export const ROYAL_HIVE_PALETTE={
 light:{
  paper:"#F5F7FA",surface:"#FFFFFF",modal:"#F0F3F7",primary:"#FFC629",onPrimary:"#0D1B2A",
  ink:"#0D1B2A",muted:"#526071",line:"#DCE3EA",outline:"#526071",disabled:"#E1E5EB",onDisabled:"#687383",
  selected:"#FFF0BC",focus:"#1D497E",media:"#0B1422",onMedia:"#FFFFFF",
  scrim:"rgba(0,0,0,0.48)",mediaScrim:"rgba(0,0,0,0.72)",
 },
 dark:{
  paper:"#0B1422",surface:"#152235",modal:"#152235",primary:"#FFC629",onPrimary:"#0D1B2A",
  ink:"#F4F6FA",muted:"#ADB9C8",line:"#2D3D51",outline:"#8293A8",disabled:"#243348",onDisabled:"#8293A8",
  selected:"#3D341C",focus:"#FFC629",media:"#0B1422",onMedia:"#FFFFFF",
  scrim:"rgba(0,0,0,0.62)",mediaScrim:"rgba(0,0,0,0.72)",
 },
} as const;
export type RoyalHiveMode=keyof typeof ROYAL_HIVE_PALETTE;
export const ROYAL_HIVE_BRAND={jcard:"#00072E",silver:"#C9CCD1",mediaGold:"#C8A95C"} as const;

/** Shared semantic states from Master Plan v1.1. */
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

export const THEMES=[{id:"light",label:"Royal Hive Light"},{id:"dark",label:"Royal Hive Dark"}] as const;
export type ThemeName=typeof THEMES[number]["id"];
export const THEME_PREFERENCES=[...THEMES,{id:"system",label:"Usar configuración del sistema"}] as const;
export type ThemePreference=typeof THEME_PREFERENCES[number]["id"];
export function isThemeName(value:unknown):value is ThemeName{return value==="light"||value==="dark";}
export function isThemePreference(value:unknown):value is ThemePreference{return isThemeName(value)||value==="system";}
/** Preserve explicit light/dark selections; obsolete or absent preferences follow the OS. */
export function normalizeThemePreference(value:unknown):ThemePreference{return isThemePreference(value)?value:"system";}
export function resolveThemePreference(preference:ThemePreference,system:ThemeName|null|undefined):ThemeName{
 return preference==="system"?(system==="dark"?"dark":"light"):preference;
}
const neutral={white:"#FFFFFF",black:"#000000"};
function makeTheme(theme:ThemeName){
 const p=ROYAL_HIVE_PALETTE[theme];const states=ROYAL_HIVE_STATES[theme];
 const media=p.media,mediaInk=p.onMedia;
 const colors={
  ink:p.ink,paper:p.paper,card:p.surface,accent:p.selected,inverse:p.paper,line:p.line,muted:p.muted,
  primary:p.primary,onPrimary:p.onPrimary,outline:p.outline,disabled:p.disabled,onDisabled:p.onDisabled,focus:p.focus,
  reaction:p.ink,wordmark:p.ink,icon:p.ink,navIcon:p.ink,transparent:opacity(p.ink,0),
  scrim:p.scrim,shadow:opacity(neutral.black,.22),statusLive:states.live.background,statusInactive:p.muted,
  mediaProgress:opacity(ROYAL_HIVE_BRAND.mediaGold,.45),mediaProgressActive:ROYAL_HIVE_BRAND.mediaGold,
  mediaProgressTrack:opacity(mediaInk,.24),mediaProgressTrackActive:opacity(mediaInk,.52),mediaNavigationHandle:opacity(ROYAL_HIVE_BRAND.silver,.80),
  mediaText:mediaInk,mediaSurface:opacity(media,.92),mediaSoftSurface:opacity(media,.72),
  mediaControl:opacity(media,.94),mediaMuted:opacity(mediaInk,.90),mediaBorder:opacity(mediaInk,.32),
  mediaShadow:opacity(neutral.black,.65),mediaTint:opacity(media,.2),mediaChip:opacity(media,.94),
  mediaChat:opacity(media,.94),mediaNotice:opacity(media,.96),mediaCaption:opacity(media,.94),
  mediaInput:opacity(media,.94),mediaFollow:opacity(media,.94),mediaWelcome:opacity(media,.94),
  mediaInputLine:opacity(mediaInk,.38),mediaSubtle:opacity(mediaInk,.94),mediaHint:opacity(mediaInk,.90),
  mediaQuiet:opacity(mediaInk,.84),mediaPlay:opacity(mediaInk,.90),mediaPosterPlay:mediaInk,
  mediaDiscLine:opacity(mediaInk,.32),mediaDisc:media,mediaPovBackground:mediaInk,mediaPovText:media,
  glassPanel:opacity(media,.83),glassBorder:opacity(mediaInk,.26),glassShadow:"#17191C",glassText:mediaInk,glassMuted:"#E2E4E6",
  glassPromo:opacity(media,.84),glassCaption:opacity(media,.86),
  qrPaper:neutral.white,qrInk:p.onPrimary,
 };
 let navigationOpacity=.4;
 for(;navigationOpacity<.98;navigationOpacity+=.01){
  if([neutral.black,neutral.white].every(image=>contrastRatio(colors.navIcon,composite(opacity(colors.paper,navigationOpacity),image))>=3))break;
 }
 return {...colors,navigationOpacity:Math.min(1,navigationOpacity+.06)};
}
export const palettes={light:makeTheme("light"),dark:makeTheme("dark")};
export type ThemeColors=ReturnType<typeof makeTheme>;
export function themeTokens(theme:ThemeName){return palettes[theme];}
