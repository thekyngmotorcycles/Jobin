import Svg,{Path,Rect} from "react-native-svg";
import {useTheme} from "../state/ThemeProvider";
import {jobeenTokens} from "../theme/jobeen";

/** Video frame crossed by one bolt, matching the app's monochrome header icons. */
export function JobeenFlashIcon({size=24}:{size?:number}){
 const {theme}=useTheme();const ink=jobeenTokens(theme).ink;
 return <Svg width={size} height={size} viewBox="0 0 32 32" fill="none" accessible={false}>
  <Rect x="2.5" y="5" width="27" height="22" rx="4" stroke={ink} strokeWidth={1.8}/>
  <Path d="M9 5v5M23 5v5M9 22v5M23 22v5" stroke={ink} strokeWidth={1.7} strokeLinecap="round"/>
  <Path d="M17.5 9.5 11.7 17h5l-2 6.5L21.5 15h-5z" stroke={ink} strokeWidth={1.8} strokeLinejoin="round" strokeLinecap="round"/>
 </Svg>;
}
