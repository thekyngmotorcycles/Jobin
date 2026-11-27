import type {Profession} from "./professional-types";
/** Catalog families, not a separate asset for every trade. Split climate and electricity only for visual identity. */
import type {BannerFamily} from "../theme/employment-art";
const FAMILIES=new Set<string>(["hvac","refrigeration","electricity","construction","maintenance","climate","transport","automotive","technology","business","commerce","legal","health","animals","hospitality","hotels","beauty","sports","education","arts","design","engineering","fashion","security","industry","agriculture","logistics","generic"]);
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
 return category&&FAMILIES.has(category)?category as BannerFamily:"generic";
}
