import {useState} from "react";
import {View,useWindowDimensions,type DimensionValue} from "react-native";
import {JobinLoadingGears} from "./JobinLoadingGears";
import {JCardProfileLayers} from "./JCardProfileLayers";
import {useTheme} from "../state/ThemeProvider";
import {jcardArtTokens} from "../theme/jobeen";
import {businessCardPaper,jcardCommon,jcardSurfaceMetrics,jcardSurfaceSize,jcardProfilePortraitMetrics,jcardProfileIdentitySpace} from "../theme/jcard";

export function JCardLoadingSkeleton({profileInset=16}:{profileInset?:number}){
 const {theme}=useTheme(),t=jcardArtTokens(theme);
 const {width:screenWidth,fontScale}=useWindowDimensions();
 const [measuredWidth,setMeasuredWidth]=useState(0);
 const {height,radius,width}=jcardSurfaceSize({screenWidth,measuredWidth,fontScale,theme,profile:true,horizontalInset:profileInset});
 const portrait=jcardProfilePortraitMetrics(width);
 const identity=jcardProfileIdentitySpace(portrait,fontScale);
 const titleSpace={paddingLeft:identity.paddingLeft,paddingRight:identity.paddingRight,paddingTop:identity.paddingTop,paddingBottom:identity.paddingBottom,minHeight:identity.minHeight,justifyContent:"center" as const};
 const light=theme==="light",fill=light?businessCardPaper.background:t.ink;
 const muted=light?businessCardPaper.border:t.silver;
 const line=(width:DimensionValue,height=12)=><View style={{width,height,borderRadius:Math.min(8,height/2),backgroundColor:muted,opacity:light?0.42:0.26}}/>;
 return <View accessibilityRole="progressbar" accessibilityLabel="Cargando JCard">
  <JCardProfileLayers portrait={portrait} cover={height=><View style={{height,backgroundColor:muted,opacity:0.25}}/>}>
  <View style={{paddingHorizontal:profileInset}}>
   <View style={{width:"100%",maxWidth:jcardSurfaceMetrics.maxWidth,alignSelf:"center",paddingTop:portrait.overlap}}
    onLayout={event=>{const current=Math.round(event.nativeEvent.layout.width);if(current>0)setMeasuredWidth(old=>old!==current?current:old);}}>
    <View style={{height,borderRadius:radius,borderWidth:1,borderColor:t.line,backgroundColor:fill,
     paddingBottom:8,shadowColor:jcardCommon.cardShadowColor,shadowOffset:{width:0,height:6},shadowOpacity:0.10,shadowRadius:12,elevation:3}}>
     <View pointerEvents="none" style={{position:"absolute",top:5,left:5,right:5,bottom:5,borderRadius:radius-5,borderWidth:1,borderColor:t.line,opacity:0.5}}/>
     <View style={titleSpace}><View style={{height:identity.nameHeight,alignItems:"flex-start",justifyContent:"flex-end"}}>{line("76%",16)}</View><View style={{height:identity.subtitleHeight,justifyContent:"center"}}>{line("60%",11)}</View></View>
     <View style={{flex:1,alignItems:"center",justifyContent:"space-evenly",paddingHorizontal:12}}>
      {line("51%",13)}
      <View style={{flexDirection:"row",alignItems:"center",justifyContent:"center",gap:12}}>{line("30%",11)}<View style={{width:1,height:18,backgroundColor:t.line}}/>{line("30%",11)}</View>
      <View style={{flexDirection:"row",alignItems:"center",justifyContent:"center",gap:8}}>
       {(["43%","43%"] as const).map(w=><View key={w} style={{width:w,height:28,borderRadius:16,backgroundColor:t.cream,alignItems:"center",justifyContent:"center"}}>{line("74%",10)}</View>)}
      </View>
      <JobinLoadingGears size={30} mode="loading"/>
     </View>
    </View>
    <View pointerEvents="none" style={{position:"absolute",left:portrait.inset,top:0,width:portrait.width,height:portrait.height,borderRadius:portrait.radius,backgroundColor:muted,opacity:0.8,zIndex:3}}/>
   </View>
  </View>
  </JCardProfileLayers>
 </View>;
}
