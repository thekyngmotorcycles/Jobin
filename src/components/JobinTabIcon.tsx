import {memo} from "react";
import {Ionicons} from "@expo/vector-icons";
import Svg,{Path,Circle} from "react-native-svg";
import {JobeenMessageIcon} from "./JobeenMessageIcon";

export type JobinTabName="index"|"streams"|"videos"|"shop"|"inbox"|"profile";

/**
 * Jobeen iconography: rounded contours, consistent optical weight and
 * honeycomb geometry when meaningful. Same silhouette in both focus states.
 * See AGENTS.md for the permanent visual standard.
 */
const HOME_SILHOUETTE="M4.4 12.4 12.9 5.4 Q14 4.4 15.1 5.4 L23.6 12.4 Q24.2 12.9 24.2 13.7 V22.3 Q24.2 24 22.5 24 H5.5 Q3.8 24 3.8 22.3 V13.7 Q3.8 12.9 4.4 12.4 Z";
// The outline is intentionally split at the doorway: no horizontal baseline crossing it.
const HOME_OUTLINE="M10.9 24 H5.5 Q3.8 24 3.8 22.3 V13.7 Q3.8 12.9 4.4 12.4 L12.9 5.4 Q14 4.4 15.1 5.4 L23.6 12.4 Q24.2 12.9 24.2 13.7 V22.3 Q24.2 24 22.5 24 H17.1";
// A continuous solid silhouette with an open arched doorway; no lower crossbar.
const HOME_FILLED="M5.5 24 Q3.8 24 3.8 22.3 V13.7 Q3.8 12.9 4.4 12.4 L12.9 5.4 Q14 4.4 15.1 5.4 L23.6 12.4 Q24.2 12.9 24.2 13.7 V22.3 Q24.2 24 22.5 24 H17.1 V17.3 Q17.1 15.6 15.4 15.6 H12.6 Q10.9 15.6 10.9 17.3 V24 Z";
const HOME_DOOR_OUTLINE="M10.9 24 V17.3 Q10.9 15.6 12.6 15.6 H15.4 Q17.1 15.6 17.1 17.3 V24";
const PROFILE_SHOULDERS="M4.8 24.2 Q3.2 24.2 3.2 22.6 V21.6 C3.2 16.9 7.7 14.5 14 14.5 C20.3 14.5 24.8 16.9 24.8 21.6 V22.6 Q24.8 24.2 23.2 24.2 Z";
const HEXA_PLAY="M22.5 5.5 Q26 3.5 29.5 5.5 L43 13.5 Q46 15.2 46 19 V33 Q46 36.8 43 38.5 L29.5 46.5 Q26 48.5 22.5 46.5 L9 38.5 Q6 36.8 6 33 V19 Q6 15.2 9 13.5 Z";
const HEXA_TRIANGLE="M21.5 17.5 Q21.5 16 23 16.8 L34.5 24.5 Q36 26 34.5 27.5 L23 35.2 Q21.5 36 21.5 34.5 Z";

function TabIcon({name,color,focused=false,size=25}:{name:JobinTabName;color:string;focused?:boolean;size?:number}){
 if(name==="inbox")return <JobeenMessageIcon size={size} color={color} filled={focused}/>;
 // Reuse the exact rounded bag-handle icon from Messages > JShop.
 if(name==="shop")return <Ionicons name={focused?"bag-handle":"bag-handle-outline"} size={size} color={color}/>;
 const isVideo=name==="videos";
 const viewBox=isVideo?"0 0 52 52":name==="streams"?"0 0 28 28":"2 2 24 24";
 const coordinateSize=isVideo?52:name==="streams"?28:24;
 const stroke={stroke:color,strokeWidth:coordinateSize*1.55/size,strokeLinecap:"round" as const,strokeLinejoin:"round" as const};
 return <Svg width={size} height={size} viewBox={viewBox} fill="none" accessibilityLabel={name}>
  {name==="index"&&(focused
   ?<Path d={HOME_FILLED} fill={color}/>
   :<><Path d={HOME_OUTLINE} {...stroke}/><Path d={HOME_DOOR_OUTLINE} {...stroke}/></>)}
  {name==="streams"&&<><Circle cx="14" cy="14" r="2.4" fill={color}/><Path d="M9.4 9.4a6.5 6.5 0 0 0 0 9.2M18.6 9.4a6.5 6.5 0 0 1 0 9.2M6.2 6.2a11 11 0 0 0 0 15.6M21.8 6.2a11 11 0 0 1 0 15.6" {...stroke}/></>}
  {name==="videos"&&<>
   {/* A subtle two-layer SVG halo stays behind Hexa Play only, including Android.
       Unlike elevation on a transparent View it never adds a circle or tab background. */}
   <Path d={HEXA_PLAY} transform="translate(0 1.4)" stroke={color} strokeWidth={5.6} strokeLinejoin="round" opacity={0.075}/>
   <Path d={HEXA_PLAY} transform="translate(0 0.8)" stroke={color} strokeWidth={3.4} strokeLinejoin="round" opacity={0.07}/>
   {focused
    ?<Path d={HEXA_PLAY+" "+HEXA_TRIANGLE} fill={color} fillRule="evenodd"/>
    :<><Path d={HEXA_PLAY} {...stroke}/><Path d={HEXA_TRIANGLE} {...stroke}/></>}
  </>}
  {name==="profile"&&(focused
   ?<><Circle cx="14" cy="9" r="4.4" fill={color}/><Path d={PROFILE_SHOULDERS} fill={color}/></>
   :<><Circle cx="14" cy="9" r="4.4" {...stroke}/><Path d={PROFILE_SHOULDERS} {...stroke}/></>)}
 </Svg>;
}
export const JobinTabIcon=memo(TabIcon);
