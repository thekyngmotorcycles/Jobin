import {Ionicons} from "@expo/vector-icons";
import {Stack} from "expo-router";
import {Text,View} from "react-native";
import {JShopPage} from "../../components/JShopUI";
import {useTheme} from "../../state/ThemeProvider";
import {jobeenTokens} from "../../theme/jobeen";

/** Actual current listing requirements. Not a substitute for formally approved commerce policies. */
export default function JShopPublishingGuide(){
 const {theme}=useTheme();const t=jobeenTokens(theme);
 const guidance=[
  {icon:"images-outline" as const,title:"Fotografías",text:"Agregá entre 1 y 5 fotos claras del artículo."},
  {icon:"create-outline" as const,title:"Información",text:"Incluí un título, descripción, precio y estado del artículo."},
  {icon:"location-outline" as const,title:"Zona de venta",text:"Elegí una ciudad o zona aproximada. No publiques tu domicilio particular."},
  {icon:"shield-checkmark-outline" as const,title:"Seguridad",text:"Describí el producto con precisión y respetá las leyes y reglas aplicables a su venta."}
 ];
 return <>
  <Stack.Screen options={{title:"Guía para publicar",headerShadowVisible:false,
   headerStyle:{backgroundColor:t.bg},headerTintColor:t.ink}}/>
  <JShopPage>
   <View style={{width:"100%",maxWidth:640,alignSelf:"center",gap:18}}>
    <Text style={{fontSize:13,color:t.ink2,lineHeight:19}}>Requisitos actuales para publicar un artículo en JShop.</Text>
    <View style={{borderRadius:18,borderWidth:1,borderColor:t.line,backgroundColor:t.surface,overflow:"hidden"}}>
     {guidance.map((item,index)=><View key={item.title} style={{paddingHorizontal:14,paddingVertical:15,gap:12,
      borderTopWidth:index===0?0:1,borderColor:t.line,flexDirection:"row",alignItems:"flex-start"}}>
      <Ionicons name={item.icon} size={23} color={t.ink}/>
      <View style={{flex:1,gap:5}}>
       <Text style={{fontSize:14,color:t.ink,fontWeight:"800"}}>{item.title}</Text>
       <Text style={{fontSize:12,color:t.ink2,lineHeight:18}}>{item.text}</Text>
      </View>
     </View>)}
    </View>
   </View>
  </JShopPage>
 </>;
}
