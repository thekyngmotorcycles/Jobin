import {router,Stack,useFocusEffect} from "expo-router";
import {useCallback,useState} from "react";
import {ActivityIndicator,Text} from "react-native";
import {JShopButton,JShopEmpty,JShopPage,JShopTitle} from "../../components/JShopUI";
import {jshopAccountId,readJShopFavorites} from "../../lib/jshop-local";
import {useTheme} from "../../state/ThemeProvider";
import {jobeenTokens} from "../../theme/jobeen";

export default function JShopFavorites(){
 const {theme}=useTheme();const t=jobeenTokens(theme);
 const [saved,setSaved]=useState<string[]>([]);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState("");
 useFocusEffect(useCallback(()=>{
  let live=true;
  void(async()=>{
   try{const user=await jshopAccountId();const items=await readJShopFavorites(user);if(live){setSaved(items);setError("");}}
   catch(e){if(live)setError(e instanceof Error?e.message:"No se pudieron cargar tus guardados.");}
   finally{if(live)setLoading(false);}
  })();return()=>{live=false;};
 },[]));
 return <>
  <Stack.Screen options={{title:"Guardados de JShop"}}/>
  <JShopPage>
   <JShopTitle title="Guardados" subtitle="Los artículos favoritos de tu cuenta."/>
   {loading?<ActivityIndicator color={t.yellow}/>:<JShopEmpty icon="heart-outline" title={saved.length?"Artículos guardados: "+saved.length:"Todavía no guardaste artículos"}
    description={saved.length?"El catálogo público aún no está conectado. Los artículos guardados se mostrarán cuando JShop esté disponible.":"Cuando JShop tenga publicaciones, podrás guardar las que te interesen desde el ícono de corazón."}
    action={{title:"Explorar JShop",onPress:()=>router.push("/(tabs)/shop")}}/>}
   {!!error&&<Text accessibilityLiveRegion="polite" style={{color:t.ink}}>{error}</Text>}
   <JShopButton title="Crear un anuncio" secondary icon="add-circle-outline" onPress={()=>router.push("/jshop/publish")}/>
  </JShopPage>
 </>;
}
