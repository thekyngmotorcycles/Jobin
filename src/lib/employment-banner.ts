import type {Profession} from "./professional-types";
/** Catalog families, not a separate asset for every trade. Split climate and electricity only for visual identity. */
export const BANNER_PALETTES={
 hvac:["#092A43","#3189B7"],refrigeration:["#251F45","#8C74C8"],electricity:["#482C0C","#D69A38"],
 construction:["#3A2D1C","#B89659"],maintenance:["#1E2B38","#8299A9"],climate:["#123644","#45B5BC"],
 transport:["#172D48","#6396B7"],automotive:["#371E21","#AC5848"],technology:["#10244C","#567DCF"],
 business:["#203344","#719EAA"],commerce:["#38274D","#A17EB7"],legal:["#30283E","#9E91BD"],
 health:["#163B3A","#67B9A9"],animals:["#313A28","#9AAE69"],hospitality:["#462B1C","#C08B59"],
 hotels:["#292C43","#9E8FBD"],beauty:["#442C42","#C28BA8"],sports:["#223C34","#7FBF8B"],
 education:["#193A35","#5CA98C"],arts:["#3B274A","#A371BD"],design:["#293952","#7B9FDC"],
 engineering:["#203746","#7FB3C9"],fashion:["#403045","#C48CA9"],security:["#212D3B","#7B91A7"],
 industry:["#2E333B","#A2A8AF"],agriculture:["#2C3923","#99B76A"],logistics:["#2A374A","#85A1BD"],
 generic:["#203043","#74899D"]
} as const;
export type BannerFamily=keyof typeof BANNER_PALETTES;
const normalize=(s:string)=>s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim().replace(/[^a-z0-9]+/g,"_");
export function employmentBannerFamily(role:string,professions:readonly string[]=[],catalog:readonly Profession[]=[]):BannerFamily{
 const candidates=[role,...professions].map(normalize).filter(Boolean);
 const entry=catalog.find(p=>candidates.some(c=>[p.code,p.label,p.short_label].filter(Boolean).map(normalize).includes(c)));
 const keys=[...candidates,entry?normalize(entry.code):""];
 if(keys.some(k=>/^(refrigeracion|tecnico_en_refrigeracion|tecnico_refrigeracion|tecnico_frigorista)$/.test(k)))return "refrigeration";
 if(keys.some(k=>/hvac|aire_acondicionado|climatizacion/.test(k)))return "hvac";
 if(keys.some(k=>/electricista|electricidad/.test(k)))return "electricity";
 if(keys.some(k=>/handyman|mantenimiento_general|tecnico_de_mantenimiento/.test(k)))return "maintenance";
 const category=entry?.category;
 return category&&Object.prototype.hasOwnProperty.call(BANNER_PALETTES,category)?category as BannerFamily:"generic";
}
