import AsyncStorage from "@react-native-async-storage/async-storage";
import type {JShopPlace} from "./jshop-location-core";

const key=(owner:string)=>"jobeen.jshop.location.v1."+(owner||"guest");
const historyKey=(owner:string)=>"jobeen.jshop.recent-locations.v1."+(owner||"guest");
function validPlace(input:unknown):input is JShopPlace{
 if(!input||typeof input!=="object")return false;
 const p=input as Partial<JShopPlace>;
 return typeof p.label==="string"&&typeof p.city==="string"&&p.city.length<=90&&
 typeof p.lat==="number"&&Number.isFinite(p.lat)&&Math.abs(p.lat)<=90&&
 typeof p.lon==="number"&&Number.isFinite(p.lon)&&Math.abs(p.lon)<=180&&
 typeof p.zoom==="number"&&p.zoom>=1&&p.zoom<=18;
}
export async function readJShopLocation(owner:string):Promise<JShopPlace|null>{
 try{const raw=await AsyncStorage.getItem(key(owner));if(!raw)return null;const v:unknown=JSON.parse(raw);return validPlace(v)?v:null;}catch{return null;}
}
export async function readRecentJShopLocations(owner:string):Promise<JShopPlace[]>{
 try{const raw=await AsyncStorage.getItem(historyKey(owner));if(!raw)return [];
  const parsed:unknown=JSON.parse(raw);return Array.isArray(parsed)?parsed.filter(validPlace).slice(0,6):[];
 }catch{return [];}
}
export async function saveJShopLocation(owner:string,place:JShopPlace|null):Promise<void>{
 if(place){
  if(!validPlace(place))throw Error("La ubicación seleccionada no es válida.");
  const prior=await readRecentJShopLocations(owner);
  const next=[place,...prior.filter(x=>x.city.toLocaleLowerCase()!==place.city.toLocaleLowerCase())].slice(0,6);
  await AsyncStorage.multiSet([[key(owner),JSON.stringify(place)],[historyKey(owner),JSON.stringify(next)]]);
 }else await AsyncStorage.removeItem(key(owner));
}
