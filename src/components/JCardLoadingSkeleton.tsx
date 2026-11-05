import {ActivityIndicator,View,Text} from "react-native";
import {useUi} from "./ui";
import {jcardLayout,businessCardPaper} from "../theme/jcard";

/** Stable-size JCard placeholder while the authenticated workspace is fetched. */
export function JCardLoadingSkeleton(){
 const {colors}=useUi();
 const line=(width:string,height=13)=><View style={{width:width as any,height,borderRadius:8,backgroundColor:businessCardPaper.muted,opacity:0.5}}/>;
 return <View accessibilityLabel="Cargando JCard" accessibilityRole="progressbar" style={{height:450,borderRadius:jcardLayout.radius,borderWidth:2,borderColor:businessCardPaper.border,backgroundColor:businessCardPaper.background,overflow:"hidden",padding:20,justifyContent:"space-between"}}>
  <View pointerEvents="none" style={{position:"absolute",top:5,bottom:5,left:5,right:5,borderWidth:1,borderRadius:jcardLayout.radius-4,borderColor:businessCardPaper.border,opacity:0.55}}/>
  <View style={{alignItems:"center",gap:6}}><Text style={{fontFamily:"serif",fontStyle:"italic",fontSize:22,color:businessCardPaper.ink}}>JCard</Text>{line("23%",8)}</View>
  <View style={{flexDirection:"row",justifyContent:"space-between"}}><View style={{width:60,height:60,borderRadius:30,backgroundColor:businessCardPaper.muted,opacity:0.5}}/><View style={{width:64,height:64,borderRadius:6,backgroundColor:"#FFFFFF",borderWidth:1,borderColor:businessCardPaper.border}}/></View>
  <View style={{gap:12}}>{line("67%",20)}{line("45%")}{line("83%")}{line("60%")}</View>
  <View style={{flexDirection:"row",justifyContent:"space-around",borderTopWidth:1,borderTopColor:businessCardPaper.border,paddingTop:18}}>{line("28%",40)}{line("28%",40)}</View>
  <View style={{flexDirection:"row",alignItems:"center",justifyContent:"center",gap:9}}><ActivityIndicator size="small" color={colors.muted}/><Text style={{color:businessCardPaper.secondary,fontSize:12}}>Cargando datos…</Text></View>
 </View>;
}
