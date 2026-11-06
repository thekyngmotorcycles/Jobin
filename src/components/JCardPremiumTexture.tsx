import {JCardAdditionalFinishes} from "./JCardAdditionalFinishes";
import {JCardFinishArtwork} from "./JCardFinishArtwork";
import {memo,useMemo} from "react";
import Svg,{Defs,LinearGradient,Stop,Rect,Path} from "react-native-svg";
import {getPremiumBackground,type JCardPremiumBackgroundId} from "../theme/jcard-premium-backgrounds";
/** Visual preview only. Does not grant membership or change the saved JCard. */
function PremiumTexture({id,width=160,height=210}:{id:JCardPremiumBackgroundId;width?:number;height?:number}){
 const t=getPremiumBackground(id);
 const paths=useMemo(()=>Array.from({length:13},(_,i)=>{
  const n=i*12;
  switch(t?.pattern){
   case "ripple":return `M ${-60+n} 220 Q ${90+n} 115 ${-35+n} -20`;
   case "silk":return `M ${-80+n} 230 C ${110+n} 165 ${-70+n} 70 ${105+n} -20`;
   case "arc":return `M ${-90+n} 200 A ${130+n} ${130+n} 0 0 1 180 -25`;
   case "wave":return `M -20 ${n*1.8} Q 65 ${n*1.8-65} 180 ${n*1.8}`;
   case "contour":return `M ${-35+n} 230 C ${190+n} 125 ${-110+n} 80 ${140+n} -20`;
   case "fan":return `M 15 220 Q ${-65+n*2} 75 ${n*2} -20`;
   case "satin":return `M ${-80+n} 230 C ${100+n} 155 ${-10+n} 70 ${160+n} -20`;
   case "mist":return `M -30 ${n*1.7} C 40 ${n*1.7-20} 110 ${n*1.7+20} 190 ${n*1.7-15}`;
   case "dune":return `M -30 ${n*1.8} Q 75 ${n*1.8-65} 190 ${n*1.8+10}`;
  }
 }),[t?.pattern]);
 if(!t)return null;
 if(t.pattern.startsWith("finish-")&&id!=="finish-nocturne"&&id!=="finish-neon-carbon"&&id!=="finish-pearl-paper")return <JCardAdditionalFinishes id={id} width={width} height={height}/>;
 if(t.pattern.startsWith("finish-"))return <JCardFinishArtwork id={id} width={width} height={height}/>;
 if(id==="original")return null;

