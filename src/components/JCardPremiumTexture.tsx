import {JCardAdditionalFinishes} from "./JCardAdditionalFinishes";
import {JCardFinishArtwork} from "./JCardFinishArtwork";
import {memo,useMemo} from "react";
import {useTheme} from "../state/ThemeProvider";
import {jcardTokens} from "../theme/jcard";
import Svg,{Defs,LinearGradient,Stop,Rect,Path} from "react-native-svg";
import {getPremiumBackground,type JCardPremiumBackgroundId} from "../theme/jcard-premium-backgrounds";
/** Visual preview only. Does not grant membership or change the saved JCard. */
function PremiumTexture({id,width=160,height=210}:{id:JCardPremiumBackgroundId;width?:number;height?:number}){
 const {theme}=useTheme();
 const t=getPremiumBackground(id);
 const original=jcardTokens(theme,"base");
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
 if(id==="original")return <Svg width={width} height={height} viewBox="0 0 160 210" accessible={false}><Rect width="160" height="210" rx="12" fill={original.start}/>{Array.from({length:15},(_,i)=><Path key={"l"+i} d={`M ${-25+i*5} 175 C ${20+i*3} 120, ${-10+i*4} 55, ${38+i*4} -15`} stroke={original.line} strokeOpacity={0.22+(i%3)*0.035} strokeWidth=".55" fill="none"/>)}{Array.from({length:16},(_,i)=><Path key={"b"+i} d={`M ${-20+i*7} 225 C ${35+i*4} 180, ${95+i*3} 180, ${165+i} 125`} stroke={original.line} strokeOpacity={0.20+(i%4)*0.025} strokeWidth=".55" fill="none"/>)}<Rect x="4" y="4" width="152" height="202" rx="10" stroke={original.line} strokeOpacity=".65" strokeWidth=".8" fill="none"/></Svg>;
 if(t.pattern.startsWith("finish-")&&id!=="finish-nocturne"&&id!=="finish-neon-carbon"&&id!=="finish-pearl-paper")return <JCardAdditionalFinishes id={id} width={width} height={height}/>;
 if(t.pattern.startsWith("finish-"))return <JCardFinishArtwork id={id} width={width} height={height}/>;
 if(t.pattern==="solid")return <Svg width={width} height={height} viewBox="0 0 160 210" accessible={false}><Rect width="160" height="210" rx="12" fill={t.base}/></Svg>;
 const grad="premium-"+id;
 return <Svg width={width} height={height} viewBox="0 0 160 210" accessible={false}>
  <Defs><LinearGradient id={grad} x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor={t.base}/><Stop offset=".58" stopColor={t.base}/><Stop offset="1" stopColor={t.line} stopOpacity={t.shadow}/></LinearGradient></Defs>
  <Rect width="160" height="210" rx="12" fill={t.base}/>
  <Rect width="160" height="210" rx="12" fill={`url(#${grad})`}/>
  {paths.map((d,i)=><Path key={i} d={d} stroke={t.line} strokeOpacity={.16+(i%4)*.055} strokeWidth={i%4===0?1.5:.75} fill="none"/>)}
  <Rect x="5" y="5" width="150" height="200" rx="9" stroke={t.line} strokeOpacity=".8" strokeWidth="1.2" fill="none"/>
  <Rect x="9" y="9" width="142" height="192" rx="7" stroke={t.line} strokeOpacity=".5" strokeWidth=".65" fill="none"/>
 </Svg>;
}

export const JCardPremiumTexture=memo(PremiumTexture);
