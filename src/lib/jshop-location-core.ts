/** Slippy-map (Web Mercator) coordinates for the JShop location picker. */
export type MapPoint={lat:number;lon:number};
export const WEB_MERCATOR_LAT=85.05112878;
export function clampMapLatitude(lat:number){return Math.max(-WEB_MERCATOR_LAT,Math.min(WEB_MERCATOR_LAT,lat));}
export function normalizeMapLongitude(lon:number){return ((lon+180)%360+360)%360-180;}
export function pointToTile(point:MapPoint,zoom:number){
 const n=2**zoom,lat=clampMapLatitude(point.lat)*Math.PI/180;
 return {x:(normalizeMapLongitude(point.lon)+180)/360*n,
  y:(1-Math.asinh(Math.tan(lat))/Math.PI)/2*n};
}
export function tileToPoint(x:number,y:number,zoom:number):MapPoint{
 const n=2**zoom;
 return {lat:Math.atan(Math.sinh(Math.PI*(1-2*Math.max(0,Math.min(n,y))/n)))*180/Math.PI,
  lon:normalizeMapLongitude(x/n*360-180)};
}
export function moveMapPoint(point:MapPoint,zoom:number,dx:number,dy:number){
 const start=pointToTile(point,zoom);
 return tileToPoint(start.x-dx/256,start.y-dy/256,zoom);
}
export function tileSource(x:number,y:number,zoom:number){
 const n=2**zoom;if(y<0||y>=n)return null;
 return `https://tile.openstreetmap.org/${zoom}/${((x%n)+n)%n}/${y}.png`;
}
export function normalizeCityName(input:string){
 return input.trim().replace(/\s+/g," ").slice(0,90);
}
export function locationMatches(listingLocation:string,selectedLocation:string){
 const selected=normalizeCityName(selectedLocation).toLocaleLowerCase();
 const local=normalizeCityName(listingLocation).toLocaleLowerCase();
 return !selected||local.includes(selected);
}
export type JShopPlace={label:string;city:string;lat:number;lon:number;zoom:number};
