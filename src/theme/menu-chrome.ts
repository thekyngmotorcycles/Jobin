import type {ThemeColors,ThemeName} from "./palettes";

/** Shared chrome for drawers, menus and action surfaces; never recolor JCards or media. */
export function menuChrome(theme:ThemeName,colors:ThemeColors){
 const sunflower=theme==="sunflower";
 return {
  surface:sunflower?"#272A2F":theme==="light"?colors.paper:colors.card,
  surfaceTranslucent:sunflower?"rgba(39,42,47,0.96)":theme==="light"?colors.paper:colors.card,
  text:sunflower?"#FFCC01":colors.ink,
  muted:sunflower?"#F3D76B":colors.muted,
  border:sunflower?"rgba(255,204,1,0.27)":colors.line,
  action:sunflower?"#35383D":colors.accent,
  actionText:sunflower?"#FFCC01":colors.ink,
  shadow:sunflower?"#141619":colors.shadow,
  sunflower,
 };
}
