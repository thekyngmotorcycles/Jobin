import {memo,useId} from "react";
import Svg,{Defs,LinearGradient,Stop,Rect,Path,Circle,Ellipse,Pattern} from "react-native-svg";
import {JCARD_FINISH_EXTRA_COLORS as c} from "../theme/jcard-finish-backgrounds";
import type {JCardPremiumBackgroundId} from "../theme/jcard-premium-backgrounds";

/** Original vector interpretations of supplied material references; never reproduce watermarks or bank details. */
function AdditionalFinishes({id,width,height}:{id:JCardPremiumBackgroundId;width:number;height:number}){
 const uid=useId().replace(/[^a-zA-Z0-9]/g,"");
 const grad="fg"+uid,pattern="fp"+uid,shine="fs"+uid;
 const pink=id==="finish-pink-wave",roses=id==="finish-black-roses",silver=id==="finish-silver-royal",gold=id==="finish-golden-wave",orbs=id==="finish-black-gold",chrome=id==="finish-chrome-wave",titanium=id==="finish-black-titanium";
 const dark=roses||orbs||titanium;
 const start=pink?c.pinkLight:roses?c.roseDark:silver?c.silverMid:gold?c.goldLight:orbs?c.black:chrome?c.chromeDark:c.titaniumDark;
 const end=pink?c.pinkDeep:roses?c.black:silver?c.silverLight:gold?c.goldDark:orbs?c.titaniumDark:chrome?c.chromeLight:c.titaniumLight;
 return <Svg width={width} height={height} viewBox="0 0 160 210" accessible={false}>
 <Defs>
  <LinearGradient id={grad} x1="0" y1="0" x2="1" y2="0.85"><Stop offset="0" stopColor={start}/><Stop offset=".52" stopColor={pink?c.pinkMid:gold?c.goldMid:silver?c.silverMid:chrome?c.chromeMid:start}/><Stop offset="1" stopColor={end}/></LinearGradient>
  <LinearGradient id={shine} x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor={dark?c.roseLight:c.white} stopOpacity=".04"/><Stop offset=".5" stopColor={dark?c.roseEdge:c.white} stopOpacity=".32"/><Stop offset="1" stopColor={dark?c.black:c.silverDark} stopOpacity=".12"/></LinearGradient>
  <Pattern id={pattern} width="5" height="5" patternUnits="userSpaceOnUse"><Path d="M0 0 L5 5 M-1 4 L1 6" stroke={roses?c.roseEdge:c.white} strokeWidth=".24" opacity=".18"/></Pattern>
 </Defs>
 <Rect width="160" height="210" rx="12" fill={`url(#${grad})`}/>
 {pink&&<>
  {Array.from({length:13},(_,i)=><Path key={"p"+i} d={`M ${48+i*11} -22 C ${42+i*8} 48, ${182-i*2} 85, ${104+i*7} 224`} fill="none" stroke={c.pinkLine} strokeWidth=".9" strokeOpacity=".6"/>)}
  {Array.from({length:10},(_,i)=><Path key={"q"+i} d={`M 38 ${-35+i*26} Q 104 ${-15+i*15} 180 ${14+i*18}`} fill="none" stroke={c.pinkLine} strokeWidth=".7" strokeOpacity=".65"/>)}
 </>}
 {roses&&<>
  {Array.from({length:14},(_,i)=>{const x=18+(i%4)*43+(i%2)*9,y=12+Math.floor(i/4)*58,r=21+(i%3)*4;return <ReactRose key={i} x={x} y={y} r={r}/>;})}
  <Rect width="160" height="210" fill={`url(#${shine})`}/>
 </>}
 {silver&&<>
  {Array.from({length:11},(_,i)=><Path key={i} d={`M ${-30+i*20} -20 C ${-4+i*15} 32, ${-15+i*17} 59, ${45+i*13} 75 S ${100+i*7} 135 ${40+i*14} 228`} fill="none" stroke={i%2?c.silverLight:c.silverDark} strokeWidth={i%3===0?5:2} strokeOpacity=".42"/>)}
  {Array.from({length:7},(_,i)=><Path key={"curl"+i} d={`M ${i*25-8} 65 q 24 -34 36 -8 q 8 22 -16 26 q -12 1 -7 -12 q 7 -8 12 0`} stroke={c.silverLight} strokeWidth="3" strokeOpacity=".67" fill="none"/>)}
 </>}
 {gold&&<>
  <Path d="M-20 118 C 32 56 76 178 180 62 L180 128 C 95 201 32 92 -20 169Z" fill={c.goldDark} opacity=".26"/>
  {Array.from({length:10},(_,i)=><Path key={i} d={`M -25 ${74+i*8} C 35 ${-10+i*12} 95 ${197-i*4} 183 ${58+i*8}`} stroke={i%2?c.goldLight:c.goldDark} strokeWidth={i%3===0?3:.8} strokeOpacity=".5" fill="none"/>)}
  <Rect width="160" height="210" fill={`url(#${shine})`}/>
 </>}
 {orbs&&<>
  {Array.from({length:14},(_,i)=>{const x=12+(i*43)%152,y=10+(i*67)%210,r=5+(i%4)*4;return <Ellipse key={i} cx={x} cy={y} rx={r} ry={r} fill={i%3===0?c.goldMid:c.black} stroke={c.goldDark} strokeWidth=".9" opacity={i%3===0?.8:.5}/>;})}
  {Array.from({length:11},(_,i)=><Path key={i} d={`M ${(i*43)%160-15} ${(i*67)%210+8} q 12 -23 24 0 q -12 16 -24 0`} fill="none" stroke={c.goldLight} strokeOpacity=".21" strokeWidth=".8"/>)}
 </>}
 {chrome&&<>
  <Path d="M-35 150 C 12 24 91 117 180 -25 L180 35 C 95 163 29 54 -35 209Z" fill={c.chromeLight} opacity=".85"/>
  <Path d="M-20 184 C 44 68 95 181 180 46" fill="none" stroke={c.chromeDark} strokeWidth="17" strokeOpacity=".75"/>
  {Array.from({length:9},(_,i)=><Path key={i} d={`M -28 ${165+i*4} C 34 ${-12+i*10} 101 ${185-i*5} 184 ${-12+i*12}`} fill="none" stroke={i%2?c.chromeLight:c.chromeDark} strokeOpacity=".52" strokeWidth={i%3===0?3:1}/>)}
 </>}
 {titanium&&<>
  <Path d="M-25 185 L116 -20 L147 -20 L5 220Z" fill={c.titaniumLight} opacity=".46"/>
  <Path d="M16 230 L166 -15 L185 12 L38 230Z" fill={c.black} opacity=".54"/>
  {Array.from({length:7},(_,i)=><Path key={i} d={`M ${-45+i*18} 220 L ${98+i*18} -20`} stroke={i%2?c.titaniumLight:c.black} strokeWidth={i%3===0?3:1} opacity=".52"/>)}
  <Rect width="160" height="210" fill={`url(#${pattern})`}/>
 </>}
 </Svg>;
}
function ReactRose({x,y,r}:{x:number;y:number;r:number}){
 return <><Circle cx={x} cy={y} r={r} fill={c.roseDark} opacity=".7"/>
 {Array.from({length:6},(_,i)=><Path key={i} d={`M ${x-r*.8} ${y+(i-3)*2} C ${x-r*.8} ${y-r*.8}, ${x+r*.9} ${y-r*.6}, ${x+r*.7} ${y+(i-3)*2} C ${x+r*.3} ${y+r*.65}, ${x-r*.7} ${y+r*.6}, ${x-r*.8} ${y+(i-3)*2}`} fill="none" stroke={i%2?c.roseLight:c.roseEdge} strokeWidth={1.6-i*.14} strokeOpacity={.25+i*.045}/>)}
 <Path d={`M ${x-8} ${y+4} C ${x-11} ${y-12}, ${x+12} ${y-10}, ${x+8} ${y+5} Q ${x} ${y+14} ${x-5} ${y+2}`} stroke={c.roseEdge} strokeWidth="1.4" fill="none" opacity=".45"/></>;
}
export const JCardAdditionalFinishes=memo(AdditionalFinishes);
