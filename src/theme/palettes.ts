import { composite,contrastRatio,opacity,secondaryText } from "./color.ts";
export const CAMEL_FOREGROUND="#5B4A47"; // Single reference swatch; change Camel here.
export const THEMES=[
 {id:"light",label:"Light"},{id:"dark",label:"Dark"},{id:"pink",label:"Pink"},
 {id:"navy-green",label:"Navy Green"},{id:"camel",label:"Camel"},
 {id:"sunflower",label:"Amarillo · #FFCC01"},
] as const;
export type ThemeName=typeof THEMES[number]["id"];
export function isThemeName(value:unknown):value is ThemeName{return THEMES.some(t=>t.id===value);}
const bases={
 light:{paper:"#F5F4F0",ink:"#171717"},
 dark:{paper:"#000000",ink:"#ffffff"},
 pink:{paper:"#fce5ef",ink:"#54243a"},
 "navy-green":{paper:"#E2ECD4",ink:"#35530A"},
 camel:{paper:"#F5EBDD",ink:CAMEL_FOREGROUND},
 sunflower:{paper:"#FFCC01",ink:"#272A2F"},
};
/** Pink's original palette is intentionally preserved byte-for-byte. */
export const ORIGINAL_PINK={ink:"#54243a",muted:"#80566a",paper:"#fce5ef",line:"#e5b5cb",accent:"#f7cddd",card:"#fff6fa",inverse:"#ffffff",reaction:"#b7386c"};
const neutral={white:"#ffffff",black:"#000000"};
function makeTheme(theme:ThemeName){
 const base=bases[theme];const glass=theme==="sunflower";const card=glass?composite(opacity("#FFFFFF",.20),base.paper):composite(opacity(base.ink,.025),base.paper);const accent=glass?composite(opacity("#FFFFFF",.12),base.paper):composite(opacity(base.ink,.06),base.paper);
 const legacy=theme==="pink"?ORIGINAL_PINK:null;
 const colors={
  ink:base.ink,paper:base.paper,card:legacy?.card??card,accent:legacy?.accent??accent,
  inverse:legacy?.inverse??base.paper,line:legacy?.line??opacity(base.ink,glass?.22:.18),
  muted:legacy?.muted??secondaryText(base.ink,[base.paper,card,accent]),
  reaction:legacy?.reaction??base.ink,wordmark:base.ink,icon:base.ink,
  navIcon:theme==="pink"?neutral.black:base.ink,transparent:opacity(base.ink,0),
  scrim:opacity(base.ink,.58),shadow:opacity(base.ink,.22),statusLive:theme==="pink"?"#22c55e":base.ink,statusInactive:theme==="pink"?"#555555":base.ink,
  mediaText:theme==="pink"?neutral.white:base.ink,
  mediaSurface:theme==="pink"?opacity(neutral.black,.80):opacity(base.paper,.92),
  mediaSoftSurface:theme==="pink"?opacity(neutral.black,.30):opacity(base.paper,.20),
  mediaControl:theme==="pink"?opacity(neutral.black,.84):opacity(base.paper,.94),
  mediaMuted:theme==="pink"?opacity(neutral.white,.84):opacity(base.ink,.94),
  mediaBorder:theme==="pink"?opacity(neutral.white,.24):opacity(base.ink,.24),
  mediaShadow:theme==="pink"?opacity(neutral.black,.6):opacity(base.paper,.65),
  mediaTint:opacity(theme==="pink"?neutral.black:base.paper,.2),
  mediaChip:opacity(theme==="pink"?neutral.black:base.paper,.94),
  mediaChat:opacity(theme==="pink"?neutral.black:base.paper,.94),
  mediaNotice:opacity(theme==="pink"?neutral.black:base.paper,.96),
  mediaCaption:opacity(theme==="pink"?neutral.black:base.paper,.94),
  mediaInput:theme==="pink"?opacity(neutral.white,36/255):opacity(base.paper,.94),
  mediaFollow:theme==="pink"?opacity(neutral.white,38/255):opacity(base.paper,.94),
  mediaWelcome:theme==="pink"?opacity(neutral.white,32/255):opacity(base.paper,.94),
  mediaInputLine:theme==="pink"?opacity(neutral.white,53/255):opacity(base.ink,.24),
  mediaSubtle:theme==="pink"?"#dddddd":opacity(base.ink,.94),
  mediaHint:theme==="pink"?"#eeeeee":secondaryText(base.ink,[base.paper]),
  mediaQuiet:opacity(theme==="pink"?neutral.white:base.ink,170/255),
  mediaPlay:opacity(theme==="pink"?neutral.white:base.ink,189/255),
  mediaPosterPlay:theme==="pink"?opacity(neutral.white,217/255):base.ink,
  mediaDiscLine:theme==="pink"?"#232323":opacity(base.ink,.25),
  mediaDisc:theme==="pink"?"#555555":base.paper,
  mediaPovBackground:theme==="pink"?neutral.white:base.ink,
  mediaPovText:theme==="pink"?"#111111":base.paper,
  glassPanel:opacity(base.ink,.83),glassBorder:opacity(neutral.white,.26),glassShadow:"#17191C",glassText:neutral.white,glassMuted:"#E2E4E6",
  glassPromo:opacity(base.ink,.84),glassCaption:opacity(base.ink,.86),
  qrPaper:neutral.white,qrInk:theme==="dark"?neutral.black:base.ink,
 };
 // The fade's icon-level opacity is the minimum needed for 3:1 over either extreme of an image.
 let navigationOpacity=.4;
 for(;navigationOpacity<.98;navigationOpacity+=.01){
  if([neutral.black,neutral.white].every(image=>contrastRatio(colors.navIcon,composite(opacity(colors.paper,navigationOpacity),image))>=3))break;
 }
 return {...colors,navigationOpacity:Math.min(1,navigationOpacity+.06)};
}
export const palettes=Object.fromEntries(THEMES.map(({id})=>[id,makeTheme(id)])) as Record<ThemeName,ReturnType<typeof makeTheme>>;
export type ThemeColors=ReturnType<typeof makeTheme>;
export function themeTokens(theme:ThemeName){return palettes[theme];}
