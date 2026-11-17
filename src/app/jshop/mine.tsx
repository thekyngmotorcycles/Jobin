import {router,useFocusEffect,Stack} from "expo-router";
import {useCallback,useState} from "react";
import {ActivityIndicator,Text,View} from "react-native";
import {JShopButton,JShopEmpty,JShopItemCard,JShopPage,JShopTitle} from "../../components/JShopUI";
import {jshopAccountId,readJShopDrafts} from "../../lib/jshop-local";
import {loadMyJShopListings} from "../../lib/jshop-api";
import type {JShopDraft,JShopListing} from "../../lib/jshop-model";
import {useTheme} from "../../state/ThemeProvider";
import {jobeenTokens} from "../../theme/jobeen";

export default function MyJShop(){
 const {theme}=useTheme();const t=jobeenTokens(theme);
 const [drafts,setDrafts]=useState<JShopDraft[]>([]);
 const [published,setPublished]=useState<JShopListing[]>([]);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState("");
 useFocusEffect(useCallback(()=>{
  let live=true;setLoading(true);
  void(async()=>{
   try{const owner=await jshopAccountId();const [rows,online]=await Promise.all([readJShopDrafts(owner),loadMyJShopListings(owner)]);
    if(live){setDrafts(rows);setPublished(online);setError("");}
   }catch(e){if(live){setDrafts([]);setPublished([]);setError(e instanceof Error?e.message:"No se pudieron cargar los anuncios.");}}
   finally{if(live)setLoading(false);}
  })();return()=>{live=false;};
 },[]));
 return <>
  <Stack.Screen options={{title:"Mis anuncios"}}/>
  <JShopPage>
   <JShopTitle title="Mis anuncios" subtitle="Administrá tus publicaciones y borradores."/>
   <JShopButton title="Crear anuncio" icon="add-circle-outline" onPress={()=>router.push("/jshop/publish")}/>
   {loading?<ActivityIndicator color={t.yellow}/>:<>
    {!!published.length&&<View style={{gap:12}}>
     <Text style={{color:t.ink,fontWeight:"800",fontSize:17}}>Publicados y administrados ({published.length})</Text>
     <View style={{flexDirection:"row",flexWrap:"wrap",justifyContent:"space-between",rowGap:12}}>
      {published.map(item=><JShopItemCard key={item.id} item={item} onOpen={()=>router.push({pathname:"/jshop/item/[id]",params:{id:item.id}})}/>) }
     </View>
    </View>}
    {drafts.length?
    <View style={{gap:12}}>
     <Text style={{color:t.ink2,fontWeight:"600"}}>{drafts.length} borrador{drafts.length!==1?"es":""} sin publicar</Text>
     <View style={{flexDirection:"row",flexWrap:"wrap",justifyContent:"space-between",rowGap:12}}>
      {drafts.map(item=><JShopItemCard key={item.id} item={item} onOpen={()=>router.push({pathname:"/jshop/item/[id]",params:{id:item.id}})}/>)}
     </View>
    </View>:!published.length&&<JShopEmpty icon="albums-outline" title="Todavía no creaste anuncios" description="Podés guardar borradores y publicar tus artículos para que otras personas los encuentren."
       action={{title:"Crear anuncio",onPress:()=>router.push("/jshop/publish")}}/>}</>}
   {!!error&&<Text accessibilityLiveRegion="polite" style={{color:t.ink}}>{error}</Text>}
   <JShopButton title="Volver a explorar" secondary onPress={()=>router.push("/(tabs)/shop")}/>
  </JShopPage>
 </>;
}
