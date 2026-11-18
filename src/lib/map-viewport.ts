import type {MapPoint} from "./jshop-location-core";
export function validMapPoint(value:MapPoint):boolean{
 return Number.isFinite(value.lat)&&Number.isFinite(value.lon)&&Math.abs(value.lat)<=85&&Math.abs(value.lon)<=180;
}
export function roughDistanceKm(a:MapPoint,b:MapPoint):number{
 const kmPerDegree=111.32,latitudeRadians=a.lat*Math.PI/180;
 return kmPerDegree*Math.sqrt((a.lat-b.lat)**2+((a.lon-b.lon)*Math.cos(latitudeRadians))**2);
}
export function formatMapDistance(km:number):string{
 return Number.isFinite(km)?(km<10?km.toFixed(1):Math.round(km).toString())+" km":"Distancia no disponible";
}
