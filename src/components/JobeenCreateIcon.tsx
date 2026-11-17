import {memo} from "react";
import Svg,{Path} from "react-native-svg";
import {LIGHT_JOBEEN} from "../theme/jobeen";

/** Minimal honeycomb outline with a centered plus for the shared Create button. */
function Icon({size=29}:{size?:number}){
 const ink=LIGHT_JOBEEN.ink;
 return <Svg width={size} height={size} viewBox="0 0 32 32" fill="none" accessible={false}>
  <Path d="M16 3.8L26.3 9.8V22.2L16 28.2L5.7 22.2V9.8Z"
   stroke={ink} strokeWidth={1.8} strokeLinejoin="round"/>
  <Path d="M16 10.7V21.3M10.7 16H21.3"
   stroke={ink} strokeWidth={2} strokeLinecap="round"/>
 </Svg>;
}
export const JobeenCreateIcon=memo(Icon);
