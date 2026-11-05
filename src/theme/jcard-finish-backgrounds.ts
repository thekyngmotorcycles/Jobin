/** Original SVG recreations inspired by user-provided reference images. */
export const JCARD_FINISH_BACKGROUNDS=[
 {id:"finish-nocturne",name:"Nocturne",base:"#242D30",ink:"#F5F7F7",line:"#246A84",pattern:"finish-nocturne",shadow:.28},
 {id:"finish-neon-carbon",name:"Neon Carbon",base:"#0C1115",ink:"#F7FAFB",line:"#16B5D9",pattern:"finish-neon-carbon",shadow:.35},
 {id:"finish-pearl-paper",name:"Pearl Paper",base:"#EDEDE9",ink:"#272B2D",line:"#C4C6C4",pattern:"finish-pearl-paper",shadow:.12},
 {id:"finish-pink-wave",name:"Pink Wave",base:"#F9E5EF",ink:"#642D4B",line:"#E34C9B",pattern:"finish-pink-wave",shadow:.32},
 {id:"finish-black-roses",name:"Black Roses",base:"#131214",ink:"#F4F0F1",line:"#5C5156",pattern:"finish-black-roses",shadow:.32},
 {id:"finish-silver-royal",name:"Silver Royal",base:"#BBC0C6",ink:"#171A20",line:"#EEF0F4",pattern:"finish-silver-royal",shadow:.32},
 {id:"finish-golden-wave",name:"Golden Wave",base:"#C89B36",ink:"#251B0D",line:"#FBE59B",pattern:"finish-golden-wave",shadow:.32},
 {id:"finish-black-gold",name:"Black & Gold",base:"#171719",ink:"#F6E4BD",line:"#AD8A4D",pattern:"finish-black-gold",shadow:.32},
 {id:"finish-chrome-wave",name:"Chrome Wave",base:"#A7B1BC",ink:"#111A24",line:"#EDF4F9",pattern:"finish-chrome-wave",shadow:.32},
 {id:"finish-black-titanium",name:"Black Titanium",base:"#27282C",ink:"#F2F2F4",line:"#8C8F96",pattern:"finish-black-titanium",shadow:.32},
] as const;

/** Centralized artwork palette: UI components must not contain literal colors. */
export const JCARD_FINISH_ART_COLORS = {
 shade0: "#20282B",
 shade1: "#080D10",
 shade2: "#F2F2EF",
 shade3: "#323E42",
 shade4: "#111A20",
 shade5: "#E6E7E3",
 shade6: "#00C4FF",
 shade7: "#176A91",
 shade8: "#0CCFFF",
 shade9: "#1C8DC1",
 shade10: "#2AF5A3",
 shade11: "#62C7E8",
 shade12: "#50606A",
 shade13: "#A4A7A4",
 shade14: "#0E1B21",
 shade15: "#0A151B",
 shade16: "#627D88",
 shade17: "#197AA2",
 shade18: "#071319",
 shade19: "#1C9DCE",
 shade20: "#0BA5CA",
 shade21: "#27F3BD",
 shade22: "#19B9E3",
 shade23: "#13B7F5",
 shade24: "#2EF0A3",
 shade25: "#2BF1A4",
 shade26: "#1CCFF0",
 shade27: "#BEC2BF",
 shade28: "#FFFFFF",
} as const;

export const JCARD_FINISH_EXTRA_COLORS={
 pinkLight:"#FFFFFF",pinkMid:"#F8B9D7",pinkDeep:"#D9308A",pinkLine:"#FFF1F8",
 roseLight:"#51464A",roseDark:"#080709",roseEdge:"#75696F",
 silverLight:"#F8F9FA",silverMid:"#A8ADB3",silverDark:"#59616A",
 goldLight:"#FFF2A7",goldMid:"#CBA04D",goldDark:"#694419",
 black:"#101012",white:"#FFFFFF",chromeLight:"#F9FCFF",chromeMid:"#B9C6D2",chromeDark:"#364453",
 titaniumLight:"#999BA2",titaniumDark:"#18191D"
} as const;
