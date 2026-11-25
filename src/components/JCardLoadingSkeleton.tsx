import {useState} from "react";
import {View,useWindowDimensions,type DimensionValue} from "react-native";
import {JobinLoadingGears} from "./JobinLoadingGears";
import {useTheme} from "../state/ThemeProvider";
import {jcardArtTokens} from "../theme/jobeen";
import {businessCardPaper,jcardCommon,jcardSurfaceMetrics,jcardSurfaceSize} from "../theme/jcard";

/** The placeholder uses exactly the real JCard's responsive outer dimensions. */
export function JCardLoadingSkeleton(){
 const {theme}=useTheme(),t=jcardArtTokens(theme);
 const {width:screenWidth,fontScale}=useWindowDimensions();
 const [measuredWidth,setMeasuredWidth]=useState(0);
 const {height,radius,compact}=jcardSurfaceSize({screenWidth,measuredWidth,fontScale,theme});
 const light=theme==="light",fill=light?businessCardPaper.background:t.ink;
 const muted=light?businessCardPaper.border:t.silver;
 const line=(width:DimensionValue,height=12)=><View style={{width,height,borderRadius:Math.min(8,height/2),backgroundColor:muted,opacity:light?0.42:0.26}}/>;
 return <View accessibilityRole="progressbar" accessibilityLabel="Cargando JCard"
  style={{width:"100%",maxWidth:jcardSurfaceMetrics.maxWidth,alignSelf:"center"}}
  onLayout={event=>{const current=Math.round(event.nativeEvent.layout.width);if(current>0)setMeasuredWidth(old=>old!==current?current:old);}}>
  <View style={{height,borderRadius:radius,borderWidth:1,borderColor:t.line,backgroundColor:fill,
   paddingHorizontal:compact?14:19,paddingTop:15,paddingBottom:12,justifyContent:"space-between",
   shadowColor:jcardCommon.cardShadowColor,shadowOffset:{width:0,height:6},shadowOpacity:0.10,shadowRadius:12,elevation:3}}>
   <View pointerEvents="none" style={{position:"absolute",top:5,left:5,right:5,bottom:5,borderRadius:radius-5,borderWidth:1,borderColor:t.line,opacity:0.5}}/>
   <View style={{flexDirection:"row",alignItems:"center",gap:13,paddingHorizontal:2,minHeight:80}}>
    <View style={{width:compact?75:80,height:compact?83:88,borderRadius:14,
     backgroundColor:muted,opacity:0.45}}/>
    <View style={{flex:1,gap:9}}>
     {line("85%",19)}{line("56%",11)}{line("76%",13)}
    </View>
   </View>
   <View style={{flexDirection:"row",justifyContent:"space-between",alignItems:"center",gap:10,paddingHorizontal:3}}>
    <View style={{flex:1,height:35,borderRadius:18,backgroundColor:t.cream,borderWidth:1,borderColor:t.yellow,
     paddingHorizontal:13,justifyContent:"center"}}>{line("83%",10)}</View>
    <View style={{width:compact?91:110,height:35,borderRadius:18,backgroundColor:t.cream,
     alignItems:"center",justifyContent:"center"}}>{line("68%",10)}</View>
   </View>
   <View style={{height:1,backgroundColor:t.line,opacity:0.8,marginHorizontal:4}}/>
   <View style={{flexDirection:"row",alignItems:"center",gap:10,minHeight:43}}>
    {line(compact?51:65,12)}
    <View style={{height:27,width:1,backgroundColor:t.line}}/>
    {[0,1].map(i=><View key={i} style={{flex:1,flexDirection:"row",alignItems:"center",gap:5}}>
     <View style={{width:25,height:25,borderRadius:13,backgroundColor:t.yellow,opacity:0.72}}/>
     <View style={{flex:1,gap:4}}>{line("86%",9)}{line("62%",7)}</View>
    </View>)}
   </View>
   <View style={{alignItems:"center",height:43,justifyContent:"center"}}>
    <JobinLoadingGears size={35} mode="loading"/>
   </View>
  </View>
 </View>;
}
