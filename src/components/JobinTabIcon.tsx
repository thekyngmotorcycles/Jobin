import Svg,{Path,Circle,Rect} from "react-native-svg";
export type JobinTabName="index"|"streams"|"videos"|"shop"|"inbox"|"profile";
export function JobinTabIcon({name,color,focused=false,size=25}:{name:JobinTabName;color:string;focused?:boolean;size?:number}){
 const stroke={stroke:color,strokeWidth:2,strokeLinecap:"round" as const,strokeLinejoin:"round" as const};
 return <Svg width={size} height={size} viewBox="0 0 28 28" fill="none" accessibilityLabel={name}>
 {name==="index"&&<Path d="M3.5 12.3 14 3.8l10.5 8.5V24h-7.1v-8h-6.8v8H3.5V12.3Z" {...stroke} fill={focused?color:"none"}/>}
 {name==="streams"&&<><Circle cx="14" cy="14" r="2.4" fill={color}/><Path d="M9.4 9.4a6.5 6.5 0 0 0 0 9.2M18.6 9.4a6.5 6.5 0 0 1 0 9.2M6.2 6.2a11 11 0 0 0 0 15.6M21.8 6.2a11 11 0 0 1 0 15.6" {...stroke}/></>}
 {name==="videos"&&<><Rect x="3.6" y="3.6" width="20.8" height="20.8" rx="6" {...stroke}/><Path d="m11.6 9.6 8 4.4-8 4.4V9.6Z" {...stroke} fill={focused?color:"none"}/></>}
 {name==="shop"&&<><Path d="M5.1 10.2h17.8l-1.1 14H6.2l-1.1-14ZM10.2 10.1V8a3.8 3.8 0 0 1 7.6 0v2.1" {...stroke}/><Path d="M12 15.2h4" {...stroke}/></>}
 {name==="inbox"&&<><Path d="M4.2 8.3A3.2 3.2 0 0 1 7.4 5h13.2a3.2 3.2 0 0 1 3.2 3.3v10.4a3.2 3.2 0 0 1-3.2 3.3H7.4a3.2 3.2 0 0 1-3.2-3.3V8.3Z" {...stroke}/><Path d="m4.8 8 9.2 7 9.2-7" {...stroke}/></>}
 {name==="profile"&&<><Circle cx="14" cy="9" r="4.2" {...stroke}/><Path d="M4.2 24v-2.3c0-4.5 4.2-7.1 9.8-7.1s9.8 2.6 9.8 7.1V24H4.2Z" {...stroke} fill={focused?color:"none"}/></>}
 </Svg>;
}
