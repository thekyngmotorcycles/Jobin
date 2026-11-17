/** Geodesic circle and actual distance filtering (not a cosmetic pixel circle). */
export const JSHOP_RADIUS_MILES=[5,10,50,100] as const;
export type JShopRadiusMiles=typeof JSHOP_RADIUS_MILES[number];
export type GeoPoint={lat:number;lon:number};
export const EARTH_RADIUS_MI=3958.7613;
const rad=(degrees:number)=>degrees*Math.PI/180;
const deg=(radians:number)=>radians*180/Math.PI;
export function isJShopRadius(value:unknown):value is JShopRadiusMiles{
 return JSHOP_RADIUS_MILES.some(r=>r===value);
}
export function haversineMiles(a:GeoPoint,b:GeoPoint){
 const dLat=rad(b.lat-a.lat),dLon=rad(b.lon-a.lon);
 const h=Math.sin(dLat/2)**2+Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(dLon/2)**2;
 return 2*EARTH_RADIUS_MI*Math.asin(Math.min(1,Math.sqrt(Math.max(0,h))));
}
export function geodesicCircle(center:GeoPoint,radiusMiles:number,steps=96):number[][]{
 const distance=radiusMiles/EARTH_RADIUS_MI;
 const lat1=rad(center.lat),lon1=rad(center.lon);
 const points:number[][]=[];
 for(let i=0;i<=steps;i++){
  const bearing=2*Math.PI*i/steps;
  const lat2=Math.asin(Math.sin(lat1)*Math.cos(distance)+Math.cos(lat1)*Math.sin(distance)*Math.cos(bearing));
  const lon2=lon1+Math.atan2(Math.sin(bearing)*Math.sin(distance)*Math.cos(lat1),Math.cos(distance)-Math.sin(lat1)*Math.sin(lat2));
  points.push([((deg(lon2)+180)%360+360)%360-180,deg(lat2)]);
 }
 return points;
}
export function mapZoomForRadius(center:GeoPoint,radiusMiles:JShopRadiusMiles,mapHeight=246){
 const lat=Math.max(-80,Math.min(80,center.lat));
 const metersPerPixelAtZero=156543.03392804097*Math.cos(rad(lat));
 const radiusPx=Math.max(60,mapHeight*0.29);
 const zoom=Math.log2(metersPerPixelAtZero*radiusPx/(radiusMiles*1609.344));
 return Math.max(2,Math.min(16,zoom));
}
export function insideJShopRadius(center:GeoPoint,item:GeoPoint|null,radius:JShopRadiusMiles):boolean{
 return !!item&&Number.isFinite(item.lat)&&Number.isFinite(item.lon)&&haversineMiles(center,item)<=radius+0.001;
}
