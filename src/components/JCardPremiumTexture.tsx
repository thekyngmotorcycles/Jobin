import {JCardAdditionalFinishes} from "./JCardAdditionalFinishes";
import {JCardFinishArtwork} from "./JCardFinishArtwork";
import {memo,useId,useMemo} from "react";
import Svg,{Defs,LinearGradient,Stop,Rect,Path} from "react-native-svg";
import {getPremiumBackground,type JCardPremiumBackgroundId} from "../theme/jcard-premium-backgrounds";
/** Visual preview only. Does not grant membership or change the saved JCard. */
function PremiumTexture({id,width=160,height=210}:{id:JCardPremiumBackgroundId;width?:number;height?:number}){
 const t=getPremiumBackground(id);
 const uid=useId().replace(/[^a-zA-Z0-9]/g,"");
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
 if(id==="original"){
  const base="navy-"+uid,glow="glow-"+uid,shadow="shadow-"+uid,gold="gold-"+uid;
  const bands=[
   "M -55 185 C 35 148 79 106 179 48",
   "M -45 205 C 35 174 81 137 191 93",
   "M -20 235 C 48 200 94 171 186 147",
   "M 10 252 C 65 221 116 199 197 184"
  ];
  return <Svg width={width} height={height} viewBox="0 0 160 210" preserveAspectRatio="none" accessible={false}>
   <Defs>
    <LinearGradient id={base} x1="0%" y1="0%" x2="100%" y2="100%"><Stop offset="0%" stopColor="#00072E"/><Stop offset="52%" stopColor="#020B36"/><Stop offset="100%" stopColor="#00051D"/></LinearGradient>
    <LinearGradient id={glow} x1="0%" y1="0%" x2="100%" y2="100%"><Stop offset="0%" stopColor="#23345D" stopOpacity="0.48"/><Stop offset="48%" stopColor="#14224D" stopOpacity="0.16"/><Stop offset="100%" stopColor="#000316" stopOpacity="0.65"/></LinearGradient>
    <LinearGradient id={shadow} x1="0%" y1="0%" x2="100%" y2="0%"><Stop offset="0%" stopColor="#00020F" stopOpacity="0.9"/><Stop offset="48%" stopColor="#06123B" stopOpacity="0.45"/><Stop offset="100%" stopColor="#27375D" stopOpacity="0.65"/></LinearGradient>
    <LinearGradient id={gold} x1="0%" y1="0%" x2="100%" y2="100%"><Stop offset="0%" stopColor="#866C36"/><Stop offset="32%" stopColor="#E5C67E"/><Stop offset="70%" stopColor="#AD8649"/><Stop offset="100%" stopColor="#F0D79B"/></LinearGradient>
   </Defs>
   <Rect width="160" height="210" fill={`url(#${base})`}/>
   <Path d="M -35 0 H 175 V 42 C 87 78 44 133 -25 158 Z" fill={`url(#${glow})`}/>
   <Path d="M -30 185 C 40 137 91 111 177 43 L 177 82 C 105 134 49 162 -30 211 Z" fill={`url(#${shadow})`} opacity="0.83"/>
   <Path d="M -30 226 C 44 183 92 143 177 92 L 177 132 C 103 164 53 198 -10 236 Z" fill={`url(#${glow})`} opacity="0.6"/>
   {bands.map((d,i)=><Path key={"shade"+i} d={d} stroke="#00020F" strokeWidth={i===0?4.8:3.5} strokeOpacity="0.7" fill="none" transform="translate(0 2)"/>)}
   {bands.map((d,i)=><Path key={"highlight"+i} d={d} stroke="#34436B" strokeWidth="2.8" strokeOpacity="0.35" fill="none" transform="translate(0 -1.5)"/>)}
   {bands.map((d,i)=><Path key={"metal"+i} d={d} stroke={`url(#${gold})`} strokeWidth={i===0?0.8:0.65} strokeOpacity="0.82" fill="none"/>)}
  </Svg>;
 }
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
