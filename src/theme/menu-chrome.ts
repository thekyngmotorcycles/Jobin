import {ROYAL_HIVE_PALETTE,type ThemeColors,type ThemeName} from "./palettes";
import {opacity} from "./color";
/** Shared menu chrome, preserving JCard and media-specific artwork. */
export function menuChrome(theme:ThemeName,colors:ThemeColors){
 const p=ROYAL_HIVE_PALETTE[theme];
 return {surface:p.modal,surfaceTranslucent:opacity(p.modal,.96),text:p.ink,muted:p.muted,
  border:p.line,action:p.surface,actionText:p.ink,selected:p.selected,iconSurface:p.selected,
  iconText:p.ink,shadow:colors.shadow};
}
