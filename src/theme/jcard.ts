import { themeTokens } from "./palettes.ts";
import { composite,opacity,contrastRatio,readableInk,secondaryText } from "./color.ts";
import type { ThemeName } from "../state/ThemeProvider";
import type { JCardTier } from "../lib/jcard";

/** JCard-specific tokens. Existing global theme palettes remain unchanged. */
const darkBase = {
  start: "#161616", end: "#161616", text: "#ffffff", secondary: "#d5d5d5",
  line: "#656565", sealFill: "#343434", sealText: "#ffffff",
  pendingText: "#bcbcbc", pendingLine: "#858585", pendingFill: "#161616",
};
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
 const p=themeTokens(theme);const fill=composite(opacity(p.paper,.12),p.ink);
 return {start:p.ink,end:p.ink,text:p.paper,secondary:secondaryText(p.paper,[p.ink]),line:opacity(p.paper,.3),sealFill:fill,sealText:p.paper,pendingText:secondaryText(p.paper,[p.ink]),pendingLine:opacity(p.paper,.5),pendingFill:p.ink};
}
function finish(theme:ThemeName,metal:typeof silver){
 const p=themeTokens(theme);const backgrounds=[metal.start,metal.end];
 const text=backgrounds.every(bg=>contrastRatio(p.ink,bg)>=4.5)?p.ink:backgrounds.every(bg=>contrastRatio(p.paper,bg)>=4.5)?p.paper:readableInk(p.ink,backgrounds);
 return {...metal,text,secondary:secondaryText(text,backgrounds)};
}
const finishes = {
 light:{base:inverted("light"),silver,gold},dark:{base:inverted("dark"),silver,gold},
 pink:{base:darkBase,silver,gold},
 "navy-green":{base:inverted("navy-green"),silver:finish("navy-green",silver),gold:finish("navy-green",gold)},
 camel:{base:inverted("camel"),silver:finish("camel",silver),gold:finish("camel",gold)},
};
export const jcardLayout = {
  avatar: 64, qr: 56, qrQuietZone: 4, radius: 18, padding: 14,
  gap: 5, minimumSealWidth: 38,
};
export const proficiencyColors = {low:'#d84b54',middle:'#e4af42',high:'#219765'};
export const jcardCommon = {
  scrim: "#000000aa", qrPaper: "#ffffff", qrInk: "#111111", editBackground: "#e5e5e5", editInk: "#555555", verifiedBubble: "#38bdf8",
};
export function jcardTokens(theme: ThemeName, tier: JCardTier) {
  // Rating-based silver and gold finishes remain unchanged in every appearance.
  if (tier === "silver") return silver;
  if (tier === "gold") return gold;
  // Only the unrated/base card switches between black and white.
  return theme === "dark" ? finishes.dark.base : finishes.light.base;
}
