import {Ionicons} from "@expo/vector-icons";
import {router,useFocusEffect,Stack} from "expo-router";
import {useCallback,useState} from "react";
import {ActivityIndicator,Pressable,ScrollView,Text,View} from "react-native";
import {JShopButton,JShopEmpty,JShopItemCard,JShopPage,JShopTitle} from "../../components/JShopUI";
import {jshopAccountId,readJShopDrafts} from "../../lib/jshop-local";
import {loadMyJShopListings} from "../../lib/jshop-api";
import type {JShopDraft,JShopListing} from "../../lib/jshop-model";
import {useTheme} from "../../state/ThemeProvider";
import {jobeenTokens} from "../../theme/jobeen";

type MyStatus="all"|"published"|"draft"|"paused"|"sold";
const statuses:{key:MyStatus;label:string}[]=[
 {key:"all",label:"Todos"},
 {key:"published",label:"Publicados"},
 {key:"draft",label:"Borradores"},
 {key:"paused",label:"Pausados"},
 {key:"sold",label:"Vendidos"}
];
type MineItem=JShopListing|JShopDraft;
function filterMine(items:MineItem[],status:MyStatus):MineItem[]{
 if(status==="all")return items;
 return items.filter(item=>("ownerId" in item?status==="draft":item.status===status));
}

export default function MyJShop(){
 const {theme}=useTheme();const t=jobeenTokens(theme);
 const [drafts,setDrafts]=useState<JShopDraft[]>([]);
 const [published,setPublished]=useState<JShopListing[]>([]);
 const [status,setStatus]=useState<MyStatus>("all");
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState("");
 useFocusEffect(useCallback(()=>{
  let live=true;setLoading(true);
  void(async()=>{
   try{
    const owner=await jshopAccountId();
    const [rows,online]=await Promise.all([readJShopDrafts(owner),loadMyJShopListings(owner)]);
    if(live){setDrafts(rows);setPublished(online);setError("");}
   }catch(e){if(live){setDrafts([]);setPublished([]);setError(e instanceof Error?e.message:"No se pudieron cargar los anuncios.");}}
   finally{if(live)setLoading(false);}
  })();return()=>{live=false;};
 },[]));
 const all:MineItem[]=[...published,...drafts].sort((a,b)=>b.createdAt-a.createdAt);
 const filtered=filterMine(all,status);
 function count(tab:MyStatus){return tab==="all"?all.length:filterMine(all,tab).length;}
 return <>
  <Stack.Screen options={{title:"Mis anuncios"}}/>
  <JShopPage>
   <JShopTitle title="Mis anuncios" subtitle="Administrá tus publicaciones y borradores."
    right={<Pressable accessibilityRole="button" accessibilityLabel="Configuración de JShop"
     onPress={()=>router.push("/jshop/settings")}
     style={({pressed})=>({width:46,height:46,borderRadius:16,borderWidth:1,borderColor:t.line,
      alignItems:"center",justifyContent:"center",backgroundColor:pressed?t.cream:t.surface})}>
      <Ionicons name="settings-outline" size={22} color={t.ink}/>
    </Pressable>}/>
   <JShopButton title="Crear anuncio" icon="add-circle-outline" onPress={()=>router.push("/jshop/publish")}/>
   <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="always"
    contentContainerStyle={{gap:8,paddingVertical:2,alignItems:"center"}}>
    {statuses.map(tab=><Pressable key={tab.key} accessibilityRole="button" accessibilityState={{selected:status===tab.key}}
     onPress={()=>setStatus(tab.key)}
     style={({pressed})=>({minHeight:44,paddingHorizontal:14,borderRadius:23,borderWidth:1,
      borderColor:status===tab.key?t.ink:t.line,backgroundColor:status===tab.key?t.ink:t.surface,
      flexDirection:"row",alignItems:"center",gap:6,opacity:pressed?0.7:1})}>
      <Text style={{fontSize:13,fontWeight:"700",color:status===tab.key?t.bg:t.ink}}>{tab.label}</Text>
      <Text style={{fontSize:12,color:status===tab.key?t.bg:t.ink2}}>{count(tab.key)}</Text>
    </Pressable>)}
   </ScrollView>
   {loading?<ActivityIndicator color={t.yellow}/>:filtered.length>0?
    <View style={{gap:10}}>
     {filtered.map(item=><JShopItemCard key={item.id} item={item}
      onOpen={()=>router.push({pathname:"/jshop/item/[id]",params:{id:item.id}})}/>)}
    </View>:
    <JShopEmpty icon="albums-outline"
     title={status==="all"?"Todavía no creaste anuncios":"No hay anuncios en esta sección"}
     description={status==="all"?"Podés crear un anuncio o guardarlo como borrador.":"Seleccioná otro estado para ver tus anuncios."}
     action={status==="all"?{title:"Crear anuncio",onPress:()=>router.push("/jshop/publish")}:undefined}/>
   }
   {!!error&&<Text accessibilityLiveRegion="polite" style={{color:t.ink}}>{error}</Text>}
  </JShopPage>
 </>;
}
