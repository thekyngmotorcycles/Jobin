import {JCARD_FINISH_ART_COLORS as palette} from "../theme/jcard-finish-backgrounds";
import {memo,useId} from "react";
import Svg,{Defs,LinearGradient,Stop,Rect,Path,Circle,Pattern} from "react-native-svg";
import type {JCardPremiumBackgroundId} from "../theme/jcard-premium-backgrounds";

/** Decorative vector artwork only: no copied stock image, watermark or card data. */
function FinishArtwork({id,width,height}:{id:JCardPremiumBackgroundId;width:number;height:number}){
 const uid=useId().replace(/[^a-zA-Z0-9]/g,"");
 const bg="finishBg"+uid,glow="finishGlow"+uid,mesh="finishMesh"+uid;
 const nocturne=id==="finish-nocturne";
 const carbon=id==="finish-neon-carbon";
 return <Svg width={width} height={height} viewBox="0 0 160 210" accessible={false}>
  <Defs>
   <LinearGradient id={bg} x1="0" y1="0" x2="0.7" y2="1">
    <Stop offset="0" stopColor={nocturne?palette.shade0:carbon?palette.shade1:palette.shade2}/>
    <Stop offset="1" stopColor={nocturne?palette.shade3:carbon?palette.shade4:palette.shade5}/>
   </LinearGradient>
   <LinearGradient id={glow} x1="0" y1="0" x2="1" y2="0.8">
    <Stop offset="0" stopColor={carbon?palette.shade6:palette.shade7} stopOpacity="0"/>
    <Stop offset=".6" stopColor={carbon?palette.shade8:palette.shade9} stopOpacity=".85"/>
    <Stop offset="1" stopColor={carbon?palette.shade10:palette.shade11} stopOpacity=".55"/>
   </LinearGradient>
   <Pattern id={mesh} width={carbon?5:3} height={carbon?5:3} patternUnits="userSpaceOnUse">
    {carbon?<><Path d="M 0 1 L 3 0 M 2 5 L 5 3" stroke=palette.shade12 strokeOpacity=".22" strokeWidth=".7"/></>:<><Path d="M0 0 L1 1 M2 1 L3 2 M0 2 L1 3" stroke=palette.shade13 strokeOpacity=".18" strokeWidth=".4"/></>}
   </Pattern>
  </Defs>
  <Rect width="160" height="210" rx="12" fill={`url(#${bg})`}/>
  {nocturne&&<>
   <Path d="M-50 192 Q90 195 182 70 L182 210 L-50 210Z" fill=palette.shade14 opacity=".38"/>
   <Path d="M-60 225 Q90 196 180 62" stroke=palette.shade15 strokeWidth="24" strokeOpacity=".40" fill="none"/>
   <Path d="M-50 230 Q90 197 182 78" stroke=palette.shade16 strokeWidth="7" strokeOpacity=".17" fill="none"/>
   {Array.from({length:8},(_,i)=><Path key={i} d={`M ${-45+i*8} 218 Q ${62+i*3} ${204-i*7} ${184+i*2} ${63-i*11}`} stroke={i%3===0?palette.shade17:palette.shade18} strokeOpacity={i%3===0?.42:.65} strokeWidth={i%3===0?.7:.55} fill="none"/>)}
   <Path d="M-25 162 Q 92 178 185 92" stroke=palette.shade19 strokeOpacity=".33" strokeWidth="1.1" fill="none"/>
  </>}
  {carbon&&<>
   <Rect width="160" height="210" fill={`url(#${mesh})`}/>
   <Path d="M75 -30 Q 115 36 174 61 M104 -30 Q 135 31 184 47" stroke=palette.shade20 strokeOpacity=".24" strokeWidth="19" fill="none"/>
   {Array.from({length:19},(_,i)=><Path key={i} d={`M ${92+i*2.5} -15 Q ${105+i*1.9} 52 ${176+i*1.2} ${82+i*2.7}`} stroke={i%3===0?palette.shade21:palette.shade22} strokeOpacity={.14+(i%4)*.045} strokeWidth=".45" fill="none"/>)}
   <Path d="M57 26 C 95 8 120 64 183 57" stroke=palette.shade23 strokeWidth="2.6" strokeOpacity=".88" fill="none"/>
   <Path d="M70 75 C 116 42 137 89 182 80" stroke=palette.shade24 strokeWidth="1.5" strokeOpacity=".8" fill="none"/>
   {Array.from({length:10},(_,i)=><Circle key={i} cx={112+(i*19)%49} cy={10+(i*23)%92} r={i%3===0?1.05:.55} fill={i%2?palette.shade25:palette.shade26} opacity=".7"/>)}
  </>}
  {!nocturne&&!carbon&&<>
   <Rect width="160" height="210" fill={`url(#${mesh})`}/>
   {Array.from({length:38},(_,i)=><Path key={i} d={`M -5 ${i*6} q 17 -2 34 1 t 34 -1 t 34 1 t 34 -1 t 34 1`} stroke={i%3===0?palette.shade27:palette.shade28} strokeOpacity={i%3===0?.16:.25} strokeWidth=".35" fill="none"/>)}
  </>}
 </Svg>;
}
export const JCardFinishArtwork=memo(FinishArtwork);
