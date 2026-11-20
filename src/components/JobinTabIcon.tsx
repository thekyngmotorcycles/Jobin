import {memo} from "react";
import Svg,{Path,Circle,Rect} from "react-native-svg";
import {JobeenMessageIcon} from "./JobeenMessageIcon";

export type JobinTabName="index"|"streams"|"videos"|"shop"|"inbox"|"profile";

/**
 * Five public tabs: hollow when inactive, solid when selected.
 * Uses only theme-supplied colors. Videos keeps the larger size assigned by
 * the tab layout; no geometry, navigation or focus effects live here.
 */
function TabIcon({name,color,focused=false,size=25}:{name:JobinTabName;color:string;focused?:boolean;size?:number}){
 if(name==="inbox")return <JobeenMessageIcon size={size} color={color} filled={focused}/>;
 // Normalize the optical silhouette of the four standard tabs against Messages.
 // Identical canvas in active/inactive states prevents icon jumps.
 // Keep the visible outline close to the Messages icon's ~1.5px line weight.
 const isLargeCanvas=name==="videos"||name==="streams";
 const viewBox=isLargeCanvas?"0 0 28 28":"2 2 24 24";
 const stroke={stroke:color,strokeWidth:(isLargeCanvas?28:24)*1.55/size,strokeLinecap:"round" as const,strokeLinejoin:"round" as const};
 return <Svg width={size} height={size} viewBox={viewBox} fill="none" accessibilityLabel={name}>
  {name==="index"&&(focused
   ?<Path d="M3.5 12.3 14 3.8l10.5 8.5V24H3.5V12.3Z M10.6 15.9h6.8v8.3h-6.8v-8.3Z" fill={color} fillRule="evenodd"/>
   :<Path d="M3.5 12.3 14 3.8l10.5 8.5V24h-7.1v-8h-6.8v8H3.5V12.3Z" {...stroke}/>)}
  {name==="streams"&&<><Circle cx="14" cy="14" r="2.4" fill={color}/><Path d="M9.4 9.4a6.5 6.5 0 0 0 0 9.2M18.6 9.4a6.5 6.5 0 0 1 0 9.2M6.2 6.2a11 11 0 0 0 0 15.6M21.8 6.2a11 11 0 0 1 0 15.6" {...stroke}/></>}
  {name==="videos"&&(focused
   ?<Path d="M9.7 3.6H18.3C22.3 3.6 24.4 5.7 24.4 9.7V18.3C24.4 22.3 22.3 24.4 18.3 24.4H9.7C5.7 24.4 3.6 22.3 3.6 18.3V9.7C3.6 5.7 5.7 3.6 9.7 3.6Z M10 9.6 18 14l-8 4.4V9.6Z" fill={color} fillRule="evenodd"/>
   :<><Rect x="3.6" y="3.6" width="20.8" height="20.8" rx="6" {...stroke}/><Path d="M10 9.6 18 14l-8 4.4V9.6Z" {...stroke}/></>)}
  {name==="shop"&&(focused
   ?<><Path d="M3.7 10.2h20.6l-1.2 13.9H4.9l-1.2-13.9Z M11.1 15.4h5.8v1.9h-5.8v-1.9Z" fill={color} fillRule="evenodd"/><Path d="M10.1 10.1V8a3.9 3.9 0 0 1 7.8 0v2.1" {...stroke}/></>
   :<><Path d="M3.7 10.2h20.6l-1.2 13.9H4.9l-1.2-13.9ZM10.1 10.1V8a3.9 3.9 0 0 1 7.8 0v2.1" {...stroke}/><Path d="M12 15.2h4" {...stroke}/></>)}
  {name==="profile"&&(focused
   ?<><Circle cx="14" cy="9" r="4.4" fill={color}/><Path d="M3 24.4v-2.7c0-4.65 4.7-7.2 11-7.2s11 2.55 11 7.2v2.7H3Z" fill={color}/></>
   :<><Circle cx="14" cy="9" r="4.4" {...stroke}/><Path d="M3 24.4v-2.7c0-4.65 4.7-7.2 11-7.2s11 2.55 11 7.2v2.7H3Z" {...stroke}/></>)}
 </Svg>;
}
export const JobinTabIcon=memo(TabIcon);
