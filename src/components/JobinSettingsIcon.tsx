import Svg,{Circle,Path,Rect} from "react-native-svg";
export function JobinSettingsIcon({id,size=26,color}:{id:string;size?:number;color:string}){
 const s={stroke:color,strokeWidth:1.7,strokeLinecap:"round" as const,strokeLinejoin:"round" as const,fill:"none"};
 const n=id.length?Array.from(id).reduce((v,c)=>v+c.charCodeAt(0),0)%6:0;
 const shapes=[
 <><Circle {...s} cx="12" cy="8" r="4"/><Path {...s} d="M4 21c1-5 4-7 8-7s7 2 8 7M17 4l3 2-1 4"/></>,
 <><Path {...s} d="M12 2 20 6v6c0 5-3 8-8 10-5-2-8-5-8-10V6z"/><Path {...s} d="m8 12 3 3 5-6"/></>,
 <><Path {...s} d="M4 6h16M4 12h16M4 18h16"/><Circle cx="9" cy="6" r="2.5" fill={color}/><Circle cx="16" cy="12" r="2.5" fill={color}/><Circle cx="11" cy="18" r="2.5" fill={color}/></>,
 <><Rect {...s} x="3" y="4" width="18" height="16" rx="4"/><Path {...s} d="M7 9h10M7 14h7"/></>,
 <><Path {...s} d="M5 3h14v18H5zM9 8h6M9 12h6M9 16h4"/></>,
 <><Circle {...s} cx="12" cy="12" r="9"/><Path {...s} d="M12 7v5l4 3M8 3l-2-2"/></>,
 ];
 return <Svg width={size} height={size} viewBox="0 0 24 24">{shapes[n]}</Svg>;
}
