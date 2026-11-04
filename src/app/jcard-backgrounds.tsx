import {useState} from "react";
import {ScrollView,Pressable,Text,View,useWindowDimensions} from "react-native";
import {router} from "expo-router";
import {useTheme} from "../state/ThemeProvider";
import {JCardPremiumTexture} from "../components/JCardPremiumTexture";
import {JCardPremiumSample} from "../components/JCardPremiumSample";
import {JCARD_PREMIUM_BACKGROUNDS,type JCardPremiumBackgroundId} from "../theme/jcard-premium-backgrounds";
/** Read-only gallery: previews are not applied or persisted until premium entitlement is implemented. */
export default function JCardBackgroundGallery(){
 const {colors}=useTheme();const {width}=useWindowDimensions();
 const [selected,setSelected]=useState<JCardPremiumBackgroundId|null>("pearl-ripple");
 const columns=width>=700?4:2;
 const cell=Math.min(180,(width-48-(columns-1)*12)/columns);
 return <View style={{flex:1,backgroundColor:colors.paper}}>
  <ScrollView contentContainerStyle={{padding:16,paddingBottom:60,gap:16}}>
   <Pressable accessibilityRole="button" onPress={()=>router.back()} style={{minHeight:44,justifyContent:"center"}}><Text style={{fontSize:16,color:colors.ink}}>‹ Volver</Text></Pressable>
   <Text style={{fontSize:24,fontWeight:"700",color:colors.ink}}>Fondos JCard Premium</Text>
   <Text style={{fontSize:14,lineHeight:21,color:colors.muted}}>Explora diez acabados exclusivos. Tu JCard original no cambiará. Esta galería es una vista previa; las suscripciones todavía no están activadas.</Text>
   {selected&&<View style={{gap:10,alignItems:"center",paddingVertical:12,borderRadius:18,backgroundColor:colors.card}}><Text style={{fontSize:17,fontWeight:"700",color:colors.ink}}>Vista previa ampliada</Text><JCardPremiumSample id={selected} width={Math.min(width-64,340)}/><Text style={{fontSize:12,color:colors.muted,textAlign:"center",paddingHorizontal:12}}>Ejemplo ilustrativo con datos ficticios. Los sellos y QR reales se conservarán al implementar el fondo.</Text></View>}
   <View style={{flexDirection:"row",flexWrap:"wrap",gap:12}}>
    {JCARD_PREMIUM_BACKGROUNDS.map(item=><Pressable key={item.id} accessibilityRole="button" accessibilityLabel={"Vista previa "+item.name} onPress={()=>setSelected(item.id)} style={{width:cell,alignItems:"center",padding:6,borderRadius:14,borderWidth:selected===item.id?2:1,borderColor:selected===item.id?colors.ink:colors.line,gap:7}}>
      <JCardPremiumTexture id={item.id} width={cell-14} height={(cell-14)*1.25}/>
      <Text style={{fontSize:12,fontWeight:"600",color:colors.ink,textAlign:"center"}}>{item.name}</Text>
    </Pressable>)}
   </View>
   <Text style={{fontSize:13,color:colors.muted}}>La selección es solo una demostración visual. Para aplicar un fondo se requerirá una membresía Premium válida.</Text>
  </ScrollView>
 </View>;
}
