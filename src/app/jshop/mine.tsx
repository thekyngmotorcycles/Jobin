import {router,useFocusEffect,Stack} from "expo-router";
import {useCallback,useState} from "react";
import {ActivityIndicator,Text,View} from "react-native";
import {JShopButton,JShopEmpty,JShopItemCard,JShopPage,JShopTitle} from "../../components/JShopUI";
import {jshopAccountId,readJShopDrafts} from "../../lib/jshop-local";
import type {JShopDraft} from "../../lib/jshop-model";
import {useTheme} from "../../state/ThemeProvider";
import {jobeenTokens} from "../../theme/jobeen";

export default function MyJShop(){
 const {theme}=useTheme();const t=jobeenTokens(theme);
 const [drafts,setDrafts]=useState<JShopDraft[]>([]);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState("");
 useFocusEffect(useCallback(()=>{
  let live=true;setLoading(true);
  void(async()=>{
   try{const owner=await jshopAccountId();const rows=await readJShopDrafts(owner);
    if(live){setDrafts(rows);setError("");}
   }catch(e){if(live){setDrafts([]);setError(e instanceof Error?e.message:"No se pudieron cargar los anuncios.");}}
   finally{if(live)setLoading(false);}
  })();return()=>{live=false;};
 },[]));
 return <>
  <Stack.Screen options={{title:"Mis anuncios"}}/>
  <JShopPage>
   <JShopTitle title="Mis anuncios" subtitle="Administrá los borradores de tus artículos."/>
   <JShopButton title="Crear anuncio" icon="add-circle-outline" onPress={()=>router.push("/jshop/publish")}/>
   {loading?<ActivityIndicator color={t.yellow}/>:drafts.length?
    <View style={{gap:12}}>
     <Text style={{color:t.ink2,fontWeight:"600"}}>{drafts.length} borrador{drafts.length!==1?"es":""} sin publicar</Text>
     <View style={{flexDirection:"row",flexWrap:"wrap",justifyContent:"space-between",rowGap:12}}>
      {drafts.map(item=><JShopItemCard key={item.id} item={item} onOpen={()=>router.push({pathname:"/jshop/item/[id]",params:{id:item.id}})}/>)}
     </View>
    </View>:<JShopEmpty icon="albums-outline" title="Todavía no creaste anuncios" description="Prepará tu primer artículo y guardalo como borrador. La publicación pública se habilitará más adelante."
       action={{title:"Crear borrador",onPress:()=>router.push("/jshop/publish")}}/>}
   {!!error&&<Text accessibilityLiveRegion="polite" style={{color:t.ink}}>{error}</Text>}
   <JShopButton title="Volver a explorar" secondary onPress={()=>router.push("/(tabs)/shop")}/>
  </JShopPage>
 </>;
}
