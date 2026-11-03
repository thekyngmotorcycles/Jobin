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
export function interpretJobinSearch(query:string,cities:string[]=[]){
 const normalized=clean(query);
 const tokens=normalized.split(" ").filter(Boolean);
 const target:SearchTarget|null=/\b(en vivo|en directo|transmision|stream|streams|live)\b/.test(normalized)?"Streams":/\b(flash|flashes|reels|video corto|videos cortos)\b/.test(normalized)?"Flashes":/\b(empresa|empresas|negocio|negocios)\b/.test(normalized)?"Empresas":/\b(profesional|profesionales|persona|personas)\b/.test(normalized)?"Profesionales":null;
 const city=cities.filter(c=>normalized.split(" ").some((_,i,arr)=>arr.slice(i,i+clean(c).split(" ").length).join(" ")===clean(c))).sort((a,b)=>b.length-a.length)[0]??"";
 let profession="";
 for(const [label,terms] of Object.entries(aliases)){
  if(terms.some(term=>normalized.includes(clean(term)))){profession=label;break;}
 }
 const cityWords=new Set(clean(city).split(" "));
 const terms=tokens.filter(t=>!stop.has(t)&&!cityWords.has(t));
 return {target,city,profession,terms};
}
export function matchJobinTerms(text:string,terms:string[]):boolean{
 const haystack=clean(text);
 return terms.every(term=>haystack.includes(term)||haystack.split(" ").some(word=>word.startsWith(term)));
}
