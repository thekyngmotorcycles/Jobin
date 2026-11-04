/** Jobin Premium JCard background catalog.
 * The approved original JCard is the default and remains unchanged.
 * Premium access must be validated server-side before a paid style is applied.
 */
export const JCARD_PREMIUM_BACKGROUNDS=[
 {id:"pearl-ripple",name:"Pearl Ripple",base:"#F3F1EC",ink:"#252525",line:"#B9B6B0",pattern:"ripple",shadow:.12},
 {id:"obsidian-silk",name:"Obsidian Silk",base:"#111215",ink:"#F4F1EA",line:"#777D86",pattern:"silk",shadow:.30},
 {id:"champagne-arc",name:"Champagne Arc",base:"#E9DFCB",ink:"#342D26",line:"#B39C73",pattern:"arc",shadow:.15},
 {id:"graphite-wave",name:"Graphite Wave",base:"#292B30",ink:"#F4F3EF",line:"#83878D",pattern:"wave",shadow:.27},
 {id:"ivory-contour",name:"Ivory Contour",base:"#F4EFE4",ink:"#34322D",line:"#A9A49A",pattern:"contour",shadow:.12},
 {id:"midnight-grid",name:"Midnight Grid",base:"#111C2A",ink:"#F4F4F1",line:"#70879B",pattern:"grid",shadow:.26},
 {id:"rose-quartz",name:"Rose Quartz",base:"#EEDFE1",ink:"#392E33",line:"#B99BA4",pattern:"fan",shadow:.13},
 {id:"emerald-satin",name:"Emerald Satin",base:"#143A32",ink:"#F5F3EB",line:"#71998C",pattern:"satin",shadow:.27},
 {id:"silver-fog",name:"Silver Fog",base:"#DEE1E2",ink:"#282D32",line:"#9AA4AA",pattern:"mist",shadow:.16},
 {id:"bronze-dune",name:"Bronze Dune",base:"#66503E",ink:"#FAF2E7",line:"#B08D6B",pattern:"dune",shadow:.25},
] as const;
export type JCardPremiumBackgroundId=typeof JCARD_PREMIUM_BACKGROUNDS[number]["id"];
export const JCARD_DEFAULT_BACKGROUND_ID="original" as const;
export function getPremiumBackground(id:string){return JCARD_PREMIUM_BACKGROUNDS.find(item=>item.id===id)??null;}
