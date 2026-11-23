import {ROYAL_HIVE_PALETTE,ROYAL_HIVE_STATES,ROYAL_HIVE_BRAND,type ThemeName} from "./palettes";
export const JOBEEN_MODAL_RADIUS={sheet:30,dialog:26,popover:18,control:12} as const;
export type JobeenNoticeTone="neutral"|"info"|"success"|"warning"|"danger";
/** One modal family in both Royal Hive appearances; severity never replaces the sheet surface. */
export function jobeenModalTokens(theme:ThemeName,tone:JobeenNoticeTone="neutral"){
 const p=ROYAL_HIVE_PALETTE[theme],states=ROYAL_HIVE_STATES[theme];
 const state=tone==="neutral"?{background:p.modal,foreground:p.ink}:states[tone];
 return {surface:p.modal,inner:p.surface,border:p.line,accent:p.primary,onAccent:p.onPrimary,
  text:p.ink,muted:p.muted,soft:p.selected,scrim:p.scrim,handle:ROYAL_HIVE_BRAND.silver,
  outline:p.outline,background:state.background,foreground:state.foreground,icon:state.foreground,
  destructiveOnColor:states.danger.foreground,radius:JOBEEN_MODAL_RADIUS};
}
export {ROYAL_HIVE_STATES} from "./palettes";
