import type { ThemeName } from "../state/ThemeProvider";
import type { JCardTier } from "../lib/jcard";

/** JCard-specific tokens. Existing global theme palettes remain unchanged. */
const darkBase = {
  start: "#161616", end: "#161616", text: "#ffffff", secondary: "#d5d5d5",
  line: "#656565", sealFill: "#343434", sealText: "#ffffff",
  pendingText: "#bcbcbc", pendingLine: "#858585", pendingFill: "#161616",
};
const lightBase = {
  start: "#fafafa", end: "#fafafa", text: "#111111", secondary: "#494949",
  line: "#999999", sealFill: "#dedede", sealText: "#111111",
  pendingText: "#606060", pendingLine: "#777777", pendingFill: "#fafafa",
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
const finishes = {
  light: { base: darkBase, silver, gold },
  dark: { base: lightBase, silver, gold },
  pink: { base: darkBase, silver, gold },
};
export const jcardLayout = {
  avatar: 64, qr: 72, qrQuietZone: 4, radius: 18, padding: 14,
  gap: 5, minimumSealWidth: 38,
};
export const jcardCommon = {
  scrim: "#000000aa", qrPaper: "#ffffff", qrInk: "#111111",
};
export function jcardTokens(theme: ThemeName, tier: JCardTier) {
  return finishes[theme][tier];
}
