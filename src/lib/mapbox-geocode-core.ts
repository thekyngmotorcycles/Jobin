import type {JShopPlace} from "./jshop-location-core";
// Kept dependency-free so the parser can run under Node's strip-types test runner.
const clampMapLatitude=(lat:number)=>Math.max(-85.05112878,Math.min(85.05112878,lat));
const normalizeCityName=(input:string)=>input.trim().replace(/\\s+/g," ").slice(0,90);
const normalizeMapLongitude=(lon:number)=>((lon+180)%360+360)%360-180;

/** Mapbox Geocoding v6 point and administrative hierarchy. */
export type MapboxFeature={
 geometry?:{coordinates?:number[]};
 properties?:{
  name?:string;name_preferred?:string;place_formatted?:string;full_address?:string;
  feature_type?:string;
  context?:Record<string,{name?:string}|undefined>;
 };
};
export type MapboxResponse={features?:MapboxFeature[]};
export function mapboxPlace(feature:MapboxFeature):JShopPlace|null{
 const lon=feature.geometry?.coordinates?.[0],lat=feature.geometry?.coordinates?.[1],p=feature.properties;
 if(typeof lon!=="number"||typeof lat!=="number"||!Number.isFinite(lon)||!Number.isFinite(lat)||!p)return null;
 if(Math.abs(lat)>90||Math.abs(lon)>180)return null;
 const city=normalizeCityName(p.context?.place?.name??p.context?.locality?.name??p.name_preferred??p.name??"");
 if(!city)return null;
 const label=([p.name_preferred??p.name??city,p.place_formatted].filter(Boolean).join(", ")||city).slice(0,120);
 const type=p.feature_type;
 const zoom=type==="country"?5:type==="region"?7:type==="place"?11:type==="locality"?12:13;
 return {lat:clampMapLatitude(lat),lon:normalizeMapLongitude(lon),label,city,zoom};
}
export function mapboxPlaces(response:MapboxResponse):JShopPlace[]{
 return (response.features??[]).map(mapboxPlace).filter((p):p is JShopPlace=>p!==null);
}
export const LOCATION_TYPES="place,locality,neighborhood,region,country";
