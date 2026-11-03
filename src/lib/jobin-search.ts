import type { ProfessionalCatalog } from "./professional-types";
/** Deterministic, accent-insensitive intent extraction for Jobin's global search.
 * No network or microphone permissions are required. */
export type SearchTarget="Profesionales"|"Empresas"|"Flashes"|"Streams";
const clean=(value:string)=>value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9\s]/g," ").replace(/\s+/g," ").trim();
const aliases:Record<string,string[]>={
 electricista:["electricista","electricistas","electrician","electricians","electrisista"],
 "tecnico hvac":["hvac","aire acondicionado","climatizacion","air conditioning"],
 mecanico:["mecanico","mecanica","mechanic"],
 plomero:["plomero","plomeria","fontanero","plumber"],
 barbero:["barbero","barber","barberia"],
};
const stop=new Set(["busco","buscar","quiero","necesito","estoy","viendo","ver","video","videos","vivo","directo","transmision","transmisiones","stream","streams","flash","flashes","reel","reels","una","uno","en","de","un","el","la","los","las","por","para","haciendo","que","este","sea","alguien","persona","profesional","profesionales","empresa","empresas","negocio","negocios"]);
export function interpretJobinSearch(query:string,cities:string[]=[],catalog?:ProfessionalCatalog|null,specialties?:Record<string,string[]>){
 const normalized=clean(query);
 const tokens=normalized.split(" ").filter(Boolean);
 const target:SearchTarget|null=/\b(en vivo|en directo|transmision|stream|streams|live)\b/.test(normalized)?"Streams":/\b(flash|flashes|reels|video corto|videos cortos)\b/.test(normalized)?"Flashes":/\b(empresa|empresas|negocio|negocios)\b/.test(normalized)?"Empresas":/\b(profesional|profesionales|persona|personas)\b/.test(normalized)?"Profesionales":null;
 const city=cities.filter(c=>normalized.split(" ").some((_,i,arr)=>arr.slice(i,i+clean(c).split(" ").length).join(" ")===clean(c))).sort((a,b)=>b.length-a.length)[0]??"";
 let profession="";
 let professionCode="";
 let specialty="";
 for(const [label,terms] of Object.entries(aliases)){
  if(terms.some(term=>normalized.includes(clean(term)))){profession=label;break;}
 }
 if(catalog){
  const matches=catalog.professions.map(p=>({code:p.code,label:p.label,normalized:clean(p.label)})).filter(p=>p.normalized.length>3&&normalized.includes(p.normalized)).sort((a,b)=>b.normalized.length-a.normalized.length);
  if(matches.length){profession=matches[0].label;professionCode=matches[0].code;}
  if(!professionCode){const single=catalog.professions.filter(p=>clean(p.label).split(" ").some(word=>word.length>4&&tokens.includes(word)));if(single.length===1){profession=single[0].label;professionCode=single[0].code;}}
  const candidateSpecialties=professionCode?(specialties?.[professionCode]??[]):Object.values(specialties??{}).flat();
  specialty=candidateSpecialties.filter(v=>clean(v).length>2&&normalized.includes(clean(v))).sort((a,b)=>b.length-a.length)[0]??"";
 }
 const cityWords=new Set(clean(city).split(" "));
 const terms=tokens.filter(t=>!stop.has(t)&&!cityWords.has(t));
 const excluded=new Set([...clean(profession).split(" "),...clean(specialty).split(" ")]);
 return {target,city,profession,professionCode,specialty,terms:terms.filter(t=>!excluded.has(t))};
}
export function matchJobinTerms(text:string,terms:string[]):boolean{
 const haystack=clean(text);
 return terms.every(term=>haystack.includes(term)||haystack.split(" ").some(word=>word.startsWith(term)));
}
