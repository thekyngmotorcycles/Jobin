import type {ThemeColors,ThemeName} from "./palettes";
import {opacity} from "./color";
import {LIGHT_JOBEEN} from "./jobeen";

/** Shared premium chrome for menus, settings and sheets; JCards and media retain their own themes. */
export function menuChrome(theme:ThemeName,colors:ThemeColors){
 const sunflower=theme==="sunflower";
 const light=theme==="light";
 return {
  surface:sunflower?"#272A2F":light?LIGHT_JOBEEN.bg:colors.card,
  surfaceTranslucent:sunflower?"rgba(39,42,47,0.96)":light?opacity(LIGHT_JOBEEN.bg,.96):colors.card,
  text:sunflower?"#FFCC01":light?LIGHT_JOBEEN.ink:colors.ink,
  muted:sunflower?"#F3D76B":light?LIGHT_JOBEEN.ink2:colors.muted,
  border:sunflower?"rgba(255,204,1,0.27)":light?LIGHT_JOBEEN.line:colors.line,
  action:sunflower?"#35383D":light?LIGHT_JOBEEN.surface:colors.accent,
  actionText:sunflower?"#FFCC01":light?LIGHT_JOBEEN.ink:colors.ink,
  selected:sunflower?"#35383D":light?LIGHT_JOBEEN.cream:colors.accent,
  iconSurface:sunflower?"#35383D":light?LIGHT_JOBEEN.cream:colors.card,
  iconText:sunflower?"#FFCC01":light?LIGHT_JOBEEN.ink:colors.ink,
  shadow:sunflower?"#141619":colors.shadow,
  sunflower,
 };
}
