import {memo} from "react";
import Svg,{Path} from "react-native-svg";
import {useTheme} from "../state/ThemeProvider";
import {jobeenTokens} from "../theme/jobeen";

/** Honeycomb + worker-bee wings + dominant plus. Accessible button label belongs to its parent. */
function Icon({size=27,color}:{size?:number;color?:string}){
 const {theme}=useTheme();const t=jobeenTokens(theme);const ink=color??t.ink;
 return <Svg width={size} height={size} viewBox="0 0 32 32" fill="none" accessibilityLabel="Crear">
  <Path d="M15.1 6.1a1.8 1.8 0 0 1 1.8 0l9 5.2a1.8 1.8 0 0 1 .9 1.6v10.3a1.8 1.8 0 0 1-.9 1.6l-9 5.1a1.8 1.8 0 0 1-1.8 0l-9-5.1a1.8 1.8 0 0 1-.9-1.6V12.9a1.8 1.8 0 0 1 .9-1.6l9-5.2Z" stroke={ink} strokeWidth="2" strokeLinejoin="round"/>
  <Path d="M10.8 7.8C9.4 5.6 7.1 4.9 5.6 6.1c-1.5 1.2-1.1 3.5.5 5M21.2 7.8c1.4-2.2 3.7-2.9 5.2-1.7 1.5 1.2 1.1 3.5-.5 5" stroke={ink} strokeWidth="1.5" strokeLinecap="round"/>
  <Path d="M16 13.2v9.6M11.2 18h9.6" stroke={ink} strokeWidth="2.7" strokeLinecap="round"/>
 </Svg>;
}
export const JobeenCreateIcon=memo(Icon);
