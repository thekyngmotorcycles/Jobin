import {memo} from "react";
import Svg,{Path} from "react-native-svg";
import {LIGHT_JOBEEN} from "../theme/jobeen";

/** Minimal honeycomb outline with a centered plus for the shared Create button. */
function Icon({size=29}:{size?:number}){
 const ink=LIGHT_JOBEEN.ink;
 return <Svg width={size} height={size} viewBox="0 0 32 32" fill="none" accessible={false}>
  <Path d="M14.8 4.25 Q16 3.55 17.2 4.25 L25.5 9.1 Q26.3 9.55 26.3 10.55 V21.45 Q26.3 22.45 25.5 22.9 L17.2 27.75 Q16 28.45 14.8 27.75 L6.5 22.9 Q5.7 22.45 5.7 21.45 V10.55 Q5.7 9.55 6.5 9.1 Z"
   stroke={ink} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
  <Path d="M16 10.7V21.3M10.7 16H21.3"
   stroke={ink} strokeWidth={2} strokeLinecap="round"/>
 </Svg>;
}
export const JobeenCreateIcon=memo(Icon);
