import type {JShopPlace} from "./jshop-location-core";
import {clampMapLatitude,normalizeCityName,normalizeMapLongitude} from "./jshop-location-core";

type OsmAddress={city?:string;town?:string;village?:string;municipality?:string;borough?:string;suburb?:string;county?:string;state?:string;country?:string};
type OsmPlace={lat:string;lon:string;display_name:string;address?:OsmAddress};
const cache=new Map<string,JShopPlace[]>();
let lastRequest=0;
async function request(url:string):Promise<OsmPlace[]|OsmPlace>{
 // The public Nominatim endpoint is used only on explicit user actions, never per keystroke.
 const delay=Math.max(0,1200-(Date.now()-lastRequest));
 if(delay)await new Promise(resolve=>setTimeout(resolve,delay));
 lastRequest=Date.now();
 const response=await fetch(url,{headers:{"Accept":"application/json","Accept-Language":"es","User-Agent":"Jobeen/0.2.0 (https://github.com/thekyngmotorcycles/Jobin)"}});
 if(!response.ok)throw Error("El servicio de ubicaciones no responde. Puedes escribir una ciudad manualmente.");
 return await response.json() as OsmPlace[];
}
function normalize(raw:OsmPlace):JShopPlace|null{
 const lat=Number(raw.lat),lon=Number(raw.lon);
 if(!Number.isFinite(lat)||!Number.isFinite(lon))return null;
 const place=raw.address;
 const city=normalizeCityName(place?.city||place?.town||place?.village||place?.municipality||place?.borough||place?.suburb||place?.county||raw.display_name.split(",")[0]);
 if(!city)return null;
 return {city,label:normalizeCityName(raw.display_name).slice(0,120),lat:clampMapLatitude(lat),lon:normalizeMapLongitude(lon),zoom:11};
}
export async function findJShopPlaces(query:string):Promise<JShopPlace[]>{
 const text=normalizeCityName(query);
 if(text.length<2)throw Error("Escribe al menos dos caracteres para buscar una ubicación.");
 const key=text.toLocaleLowerCase();
 if(cache.has(key))return cache.get(key)!;
 const url="https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=5&q="+encodeURIComponent(text);
 const received=await request(url);
 const rows=Array.isArray(received)?received:[received];
 const matches=rows.map(normalize).filter((p):p is JShopPlace=>p!==null);
 cache.set(key,matches);
 return matches;
}
export async function placeAtMapCenter(lat:number,lon:number):Promise<JShopPlace>{
 const url="https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=12&addressdetails=1&lat="+encodeURIComponent(lat.toFixed(6))+"&lon="+encodeURIComponent(lon.toFixed(6));
 const data=await request(url);
 const point=normalize(Array.isArray(data)?data[0]:data);
 if(!point)throw Error("No se encontró una ciudad para este punto. Prueba otro punto del mapa.");
 return {...point,lat,lon};
}
