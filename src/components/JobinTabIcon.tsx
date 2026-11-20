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
 const stroke={stroke:color,strokeWidth:2.15,strokeLinecap:"round" as const,strokeLinejoin:"round" as const};
 return <Svg width={size} height={size} viewBox="0 0 28 28" fill="none" accessibilityLabel={name}>
  {name==="index"&&(focused
   ?<Path d="M3.5 12.3 14 3.8l10.5 8.5V24H3.5V12.3Z M10.6 15.9h6.8v8.3h-6.8v-8.3Z" fill={color} fillRule="evenodd"/>
   :<Path d="M3.5 12.3 14 3.8l10.5 8.5V24h-7.1v-8h-6.8v8H3.5V12.3Z" {...stroke}/>)}
  {name==="streams"&&<><Circle cx="14" cy="14" r="2.4" fill={color}/><Path d="M9.4 9.4a6.5 6.5 0 0 0 0 9.2M18.6 9.4a6.5 6.5 0 0 1 0 9.2M6.2 6.2a11 11 0 0 0 0 15.6M21.8 6.2a11 11 0 0 1 0 15.6" {...stroke}/></>}
  {name==="videos"&&(focused
   ?<Path d="M9.7 3.6H18.3C22.3 3.6 24.4 5.7 24.4 9.7V18.3C24.4 22.3 22.3 24.4 18.3 24.4H9.7C5.7 24.4 3.6 22.3 3.6 18.3V9.7C3.6 5.7 5.7 3.6 9.7 3.6Z M11.6 9.6 19.6 14l-8 4.4V9.6Z" fill={color} fillRule="evenodd"/>
   :<><Rect x="3.6" y="3.6" width="20.8" height="20.8" rx="6" {...stroke}/><Path d="m11.6 9.6 8 4.4-8 4.4V9.6Z" {...stroke}/></>)}
  {name==="shop"&&(focused
   ?<><Path d="M5.1 10.2h17.8l-1.1 14H6.2l-1.1-14Z M11.2 15.4h5.6v1.9h-5.6v-1.9Z" fill={color} fillRule="evenodd"/><Path d="M10.2 10.1V8a3.8 3.8 0 0 1 7.6 0v2.1" {...stroke}/></>
   :<><Path d="M5.1 10.2h17.8l-1.1 14H6.2l-1.1-14ZM10.2 10.1V8a3.8 3.8 0 0 1 7.6 0v2.1" {...stroke}/><Path d="M12 15.2h4" {...stroke}/></>)}
  {name==="profile"&&(focused
   ?<><Circle cx="14" cy="9" r="4.2" fill={color}/><Path d="M4.2 24v-2.3c0-4.5 4.2-7.1 9.8-7.1s9.8 2.6 9.8 7.1V24H4.2Z" fill={color}/></>
   :<><Circle cx="14" cy="9" r="4.2" {...stroke}/><Path d="M4.2 24v-2.3c0-4.5 4.2-7.1 9.8-7.1s9.8 2.6 9.8 7.1V24H4.2Z" {...stroke}/></>)}
 </Svg>;
}
export const JobinTabIcon=memo(TabIcon);
