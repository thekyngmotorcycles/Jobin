import {router,Stack,useFocusEffect} from "expo-router";
import {useCallback,useState} from "react";
import {ActivityIndicator,Text,View} from "react-native";
import {JShopButton,JShopEmpty,JShopItemCard,JShopPage,JShopTitle} from "../../components/JShopUI";
import {jshopAccountId} from "../../lib/jshop-local";
import {loadFavoriteJShopListings,setJShopFavorite} from "../../lib/jshop-api";
import type {JShopListing} from "../../lib/jshop-model";
import {useTheme} from "../../state/ThemeProvider";
import {jobeenTokens} from "../../theme/jobeen";

export default function JShopFavorites(){
 const {theme}=useTheme();const t=jobeenTokens(theme);
 const [userId,setUserId]=useState("");
 const [saved,setSaved]=useState<JShopListing[]>([]);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState("");
 useFocusEffect(useCallback(()=>{
  let live=true;setLoading(true);
  void(async()=>{
   try{
    const user=await jshopAccountId();const items=await loadFavoriteJShopListings(user);
    if(live){setUserId(user);setSaved(items);setError("");}
   }catch(e){if(live){setSaved([]);setError(e instanceof Error?e.message:"No se pudieron cargar tus guardados.");}}
   finally{if(live)setLoading(false);}
  })();
  return()=>{live=false;};
 },[]));
 async function removeFavorite(id:string){
  if(!userId)return;
  try{await setJShopFavorite(userId,id,false);setSaved(current=>current.filter(item=>item.id!==id));setError("");}
  catch(e){setError(e instanceof Error?e.message:"No se pudo quitar el artículo de guardados.");}
 }
 return <>
  <Stack.Screen options={{title:"Guardados de JShop"}}/>
  <JShopPage>
   <JShopTitle title="Guardados" subtitle="Los artículos que guardás se sincronizan con tu cuenta."/>
   {loading?<ActivityIndicator color={t.yellow}/>:saved.length?
    <View style={{gap:10}}>
     {saved.map(item=><JShopItemCard key={item.id} item={item} saved
      onOpen={()=>router.push({pathname:"/jshop/item/[id]",params:{id:item.id}})}
      onFavorite={()=>void removeFavorite(item.id)}/>)}
    </View>:
    <JShopEmpty icon="heart-outline" title="Todavía no guardaste artículos"
     description="Cuando encuentres un artículo que te interese, toca el corazón para guardarlo."
     action={{title:"Explorar JShop",onPress:()=>router.push("/(tabs)/shop")}}/>}
   {!!error&&<Text accessibilityLiveRegion="polite" style={{color:t.ink}}>{error}</Text>}
   <JShopButton title="Volver a JShop" secondary onPress={()=>router.push("/(tabs)/shop")}/>
  </JShopPage>
 </>;
}
