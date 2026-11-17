import {memo} from "react";
import Svg,{Circle,Path} from "react-native-svg";
import {LIGHT_JOBEEN} from "../theme/jobeen";

/** Top-view worker bee reads like a create cross: black wings, two negative-space stripes, honeycomb outline. */
function Icon({size=29}:{size?:number}){
 const ink=LIGHT_JOBEEN.ink;
 return <Svg width={size} height={size} viewBox="0 0 32 32" fill="none" accessible={false}>
  {/* Rounded honeycomb boundary. */}
  <Path d="M14.75 2.75Q16 2.03 17.25 2.75L27.2 8.5Q28.45 9.2 28.45 10.65V21.35Q28.45 22.8 27.2 23.5L17.25 29.25Q16 29.97 14.75 29.25L4.8 23.5Q3.55 22.8 3.55 21.35V10.65Q3.55 9.2 4.8 8.5Z"
   stroke={ink} strokeWidth={2.05} strokeLinejoin="round"/>
  {/* Two short antennae terminate within the hexagon. */}
  <Path d="M14.6 11.15Q14.0 8.7 12.05 8.05M17.4 11.15Q18.0 8.7 19.95 8.05"
   stroke={ink} strokeWidth={1.65} strokeLinecap="round"/>
  <Circle cx="11.85" cy="7.9" r="1.15" fill={ink}/>
  <Circle cx="20.15" cy="7.9" r="1.15" fill={ink}/>
  {/* Wings are filled black; no internal or cutout wing stripes. */}
  <Path d="M14.45 16.4C12.25 13.65 9.05 13.18 7.02 14.5C4.7 16.05 5.25 19.27 7.35 20.15C9.93 21.18 12.51 18.55 14.45 16.4Z" fill={ink}/>
  <Path d="M17.55 16.4C19.75 13.65 22.95 13.18 24.98 14.5C27.3 16.05 26.75 19.27 24.65 20.15C22.07 21.18 19.49 18.55 17.55 16.4Z" fill={ink}/>
  {/* Head, rounded thorax and tapered abdomen. */}
  <Path d="M16 10.1C18.25 10.1 19.65 11.69 19.65 13.66C19.65 15.15 19.05 16.07 18.47 16.86C19.58 18.54 19.63 21.4 18.5 23.64L16.82 26.1Q16 27.38 15.18 26.1L13.5 23.64C12.37 21.4 12.42 18.54 13.53 16.86C12.95 16.07 12.35 15.15 12.35 13.66C12.35 11.69 13.75 10.1 16 10.1Z" fill={ink}/>
  {/* Only the two white abdomen bands remain visible. */}
  <Path d="M13.46 19.3H18.54Q18.66 20.12 18.47 20.52H13.53Q13.34 20.12 13.46 19.3Z" fill={LIGHT_JOBEEN.surface}/>
  <Path d="M13.74 22.05H18.26Q18.04 22.85 17.72 23.27H14.28Q13.96 22.85 13.74 22.05Z" fill={LIGHT_JOBEEN.surface}/>
 </Svg>;
}
export const JobeenCreateIcon=memo(Icon);
