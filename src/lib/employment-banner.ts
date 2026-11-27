import type {Profession} from "./professional-types";
import {BANNER_PALETTES,type BannerFamily} from "../theme/employment-art.ts";

/** Category is resolved from the existing catalog; artwork is not a second taxonomy.
 * New records retain the selected profession code. Older authorized CV projections
 * without a code may resolve an exact, unambiguous catalog name only.
 */
const normalize=(s:string)=>s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim().replace(/[^a-z0-9]+/g,"_");
function artworkFor(category:string|undefined):BannerFamily{
 return category&&Object.prototype.hasOwnProperty.call(BANNER_PALETTES,category)?category as BannerFamily:"generic";
}
export function employmentBannerFamily(role:string,professions:readonly string[]=[],catalog:readonly Profession[]=[]):BannerFamily{
 const selected=professions.filter(Boolean);
 if(selected.length){
  const matches=selected.map(code=>catalog.find(p=>p.code===code));
  if(matches.some(p=>!p))return "generic";
  const categories=new Set(matches.map(p=>p!.category));
  return categories.size===1?artworkFor(matches[0]?.category):"generic";
 }
 const key=normalize(role);
 if(!key)return "generic";
 const matches=catalog.filter(p=>[p.code,p.label,p.short_label].filter(Boolean).some(value=>normalize(value)===key));
 return matches.length===1?artworkFor(matches[0].category):"generic";
}
