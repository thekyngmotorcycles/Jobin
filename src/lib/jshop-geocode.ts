import type {JShopPlace} from "./jshop-location-core";
import {clampMapLatitude,normalizeCityName,normalizeMapLongitude} from "./jshop-location-core";
import {mapboxAccessToken,mapboxConfigured,mapboxGeocodingBase} from "./mapbox-config";
import {LOCATION_TYPES,mapboxPlaces,type MapboxResponse} from "./mapbox-geocode-core";

/** Temporary Mapbox lookups are never cached; saved selections use permanent geocoding. */
async function mapboxRequest(path:"forward"|"reverse",params:Record<string,string>,permanent=false):Promise<JShopPlace[]>{
 const url=new URL(mapboxGeocodingBase+"/"+path);
 for(const [key,value] of Object.entries(params))url.searchParams.set(key,value);
 url.searchParams.set("access_token",mapboxAccessToken);
 url.searchParams.set("language","es");
 url.searchParams.set("permanent",permanent?"true":"false");
 const response=await fetch(url.toString(),{headers:{"Accept":"application/json"}});
 if(!response.ok){
  if(response.status===401||response.status===403){
   throw new Error(permanent?"Mapbox requiere una cuenta habilitada para geocodificación permanente antes de guardar ubicaciones.":"La clave pública de Mapbox no está autorizada para buscar lugares.");
  }
  if(response.status===429)throw new Error("Se alcanzó el límite de búsquedas de Mapbox. Inténtalo de nuevo.");
  throw new Error("No se pudo consultar Mapbox. Verifica tu conexión.");
 }
 const body=await response.json() as MapboxResponse;
 return mapboxPlaces(body);
}

type OsmAddress={city?:string;town?:string;village?:string;municipality?:string;borough?:string;suburb?:string;county?:string;state?:string;country?:string};
type OsmPlace={lat:string;lon:string;display_name:string;address?:OsmAddress};
let lastOsmRequest=0;
async function osmRequest(url:string):Promise<OsmPlace[]|OsmPlace>{
 // Fallback while Mapbox public token is not configured; never autocomplete Nominatim.
 const delay=Math.max(0,1200-(Date.now()-lastOsmRequest));
 if(delay)await new Promise(resolve=>setTimeout(resolve,delay));
 lastOsmRequest=Date.now();
 const response=await fetch(url,{headers:{"Accept":"application/json","Accept-Language":"es","User-Agent":"Jobeen/0.2.0 (https://github.com/thekyngmotorcycles/Jobin)"}});
 if(!response.ok)throw Error("El servicio de ubicaciones no responde.");
 return await response.json() as OsmPlace[]|OsmPlace;
}
function osmPlace(raw:OsmPlace):JShopPlace|null{
 const lat=Number(raw.lat),lon=Number(raw.lon);
 if(!Number.isFinite(lat)||!Number.isFinite(lon))return null;
 const a=raw.address;
 const city=normalizeCityName(a?.city||a?.town||a?.village||a?.municipality||a?.borough||a?.suburb||a?.county||raw.display_name.split(",")[0]);
 return city?{city,label:normalizeCityName(raw.display_name).slice(0,120),lat:clampMapLatitude(lat),lon:normalizeMapLongitude(lon),zoom:11}:null;
}
export async function findJShopPlaces(query:string):Promise<JShopPlace[]>{
 const value=normalizeCityName(query);
 if(value.length<(mapboxConfigured?3:2))throw Error("Escribe al menos tres caracteres para buscar una ubicación.");
 if(mapboxConfigured){
  return mapboxRequest("forward",{q:value,types:LOCATION_TYPES,limit:"5",autocomplete:"true"});
 }
 const received=await osmRequest("https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=5&q="+encodeURIComponent(value));
 return (Array.isArray(received)?received:[received]).map(osmPlace).filter((p):p is JShopPlace=>p!==null);
}
export async function placeAtMapCenter(lat:number,lon:number):Promise<JShopPlace>{
 if(mapboxConfigured){
  const found=await mapboxRequest("reverse",{longitude:lon.toFixed(6),latitude:lat.toFixed(6),types:LOCATION_TYPES,limit:"5"});
  if(!found.length)throw Error("Mapbox no encontró una ciudad en este punto.");
  // Restore the point actually selected on the map, not the geocoder's administrative centroid.
  return {...found[0],lat,lon};
 }
 const data=await osmRequest("https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=12&addressdetails=1&lat="+encodeURIComponent(lat.toFixed(6))+"&lon="+encodeURIComponent(lon.toFixed(6)));
 const place=osmPlace(Array.isArray(data)?data[0]:data);
 if(!place)throw Error("No se encontró una ciudad para este punto.");
 return {...place,lat,lon};
}
/** For Mapbox, only permanent results may go to AsyncStorage/recent locations. */
export async function confirmJShopPlace(place:JShopPlace):Promise<JShopPlace>{
 if(!mapboxConfigured)return place;
 const found=await mapboxRequest("reverse",{
  longitude:place.lon.toFixed(6),latitude:place.lat.toFixed(6),types:LOCATION_TYPES,limit:"5"
 },true);
 if(!found.length)throw Error("Mapbox no pudo confirmar esta ciudad para guardarla.");
 return {...found[0],lat:place.lat,lon:place.lon,zoom:place.zoom};
}
