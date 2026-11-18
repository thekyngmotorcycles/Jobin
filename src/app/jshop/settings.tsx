import {Ionicons} from "@expo/vector-icons";
import {router,Stack,useFocusEffect} from "expo-router";
import {useCallback,useState} from "react";
import {ActivityIndicator,Pressable,Text,View} from "react-native";
import {JShopPage,JShopTitle} from "../../components/JShopUI";
import {jshopAccountId} from "../../lib/jshop-local";
import {readDefaultSaleLocation,type SaleLocation} from "../../lib/jshop-selling-location";
import {useTheme} from "../../state/ThemeProvider";
import {jobeenTokens} from "../../theme/jobeen";

/** Seller preferences only. Buyer's map and radius stay in /jshop/location. */
export default function JShopSettings(){
 const {theme}=useTheme();const t=jobeenTokens(theme);
 const [location,setLocation]=useState<SaleLocation|null>(null);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState("");
 useFocusEffect(useCallback(()=>{
  let active=true;setLoading(true);
  void(async()=>{
   try{
    const owner=await jshopAccountId();
    const place=await readDefaultSaleLocation(owner);
    if(active){setLocation(place);setError("");}
   }catch(e){if(active)setError(e instanceof Error?e.message:"No se pudo cargar tu ubicación de venta.");}
   finally{if(active)setLoading(false);}
  })();
  return()=>{active=false;};
 },[]));
 return <>
  <Stack.Screen options={{title:"Configuración de JShop"}}/>
  <JShopPage>
   <JShopTitle title="Configuración de JShop" subtitle="Preferencias para vender. Los filtros de compra se administran desde la búsqueda."/>
   <View style={{gap:10}}>
    <Text style={{color:t.ink,fontSize:16,fontWeight:"800"}}>Ubicación de venta</Text>
    <Pressable accessibilityRole="button" accessibilityLabel="Cambiar mi ubicación de venta"
     onPress={()=>router.push({pathname:"/jshop/sale-location",params:{target:"default"}})}
     style={({pressed})=>({minHeight:78,flexDirection:"row",alignItems:"center",gap:12,padding:13,
      borderRadius:18,borderWidth:1,borderColor:t.line,backgroundColor:pressed?t.cream:t.surface})}>
     <View style={{width:42,height:42,borderRadius:14,backgroundColor:t.cream,alignItems:"center",justifyContent:"center"}}>
      <Ionicons name="location-outline" size={23} color={t.ink}/>
     </View>
     <View style={{flex:1,gap:5}}>
      <Text style={{fontSize:14,fontWeight:"800",color:t.ink}}>Mi ubicación de venta</Text>
      {loading?<ActivityIndicator size="small" color={t.ink2} style={{alignSelf:"flex-start"}}/>:
       <Text numberOfLines={2} style={{fontSize:12,color:t.ink2}}>{location?.label??"Configurala antes de publicar tu primer artículo"}</Text>}
     </View>
     <Ionicons name="chevron-forward" size={20} color={t.ink2}/>
    </Pressable>
    <Text style={{fontSize:12,lineHeight:19,color:t.ink2}}>
     Se usará como ubicación inicial en los nuevos anuncios. Cambiarla no modifica la ubicación de artículos ya publicados.
    </Text>
    {!!error&&<Text accessibilityLiveRegion="polite" style={{color:t.ink2,fontSize:12}}>{error}</Text>}
   </View>
  </JShopPage>
 </>;
}
