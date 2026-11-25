import {JShopListingSkeleton} from "../../components/JShopListingSkeleton";
import {previewSecuredPhoto,watchAttachmentScope} from "../../lib/private-attachment-android";
import type {MessageScope} from "../../lib/message-session";
import {Ionicons} from "@expo/vector-icons";
import {router,useFocusEffect,Stack} from "expo-router";
import {useCallback,useMemo,useState} from "react";
import {Pressable,ScrollView,Text,View} from "react-native";
import {JShopButton,JShopItemCard,JShopPage} from "../../components/JShopUI";
import {readJShopDrafts} from "../../lib/jshop-local";
import {captureMessageScope,assertMessageScope} from "../../lib/message-session";
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

/** Manage seller listings. Buyer search and map filters live only in the main JShop page. */
export default function MyJShop(){
 const {theme}=useTheme();const t=jobeenTokens(theme);
 const [drafts,setDrafts]=useState<JShopDraft[]>([]);
 const [published,setPublished]=useState<JShopListing[]>([]);
 const [status,setStatus]=useState<MyStatus>("all");
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState("");
 useFocusEffect(useCallback(()=>{
  let live=true;let invalidated=false;
  setLoading(true);setError("");setDrafts([]);setPublished([]);
  const selected:{scope:MessageScope|null}={scope:null};
  const stop=watchAttachmentScope(()=>selected.scope,()=>{invalidated=true;setDrafts([]);setPublished([]);});
  void(async()=>{
   try{
    const scope=await captureMessageScope(),owner=scope.owner;
    selected.scope=scope;
    const [rows,online]=await Promise.all([readJShopDrafts(owner,scope),loadMyJShopListings(owner,scope).catch(()=>null)]);
    for(const draft of rows.slice(0,10)){
     const first=draft.privatePhotos?.[0];
     if(first)try{draft.photos=[await previewSecuredPhoto(scope,"draft-photo",first)];}catch{await assertMessageScope(scope);}
    }
    await assertMessageScope(scope);
    if(live&&!invalidated){setDrafts(rows);setPublished(online??[]);setError(online?"":"Anuncios publicados no disponibles sin conexión.");}
   }catch(e){if(live){setDrafts([]);setPublished([]);setError(e instanceof Error?e.message:"No se pudieron cargar los anuncios.");}}
   finally{if(live)setLoading(false);}
  })();return()=>{live=false;stop();setDrafts([]);setPublished([]);};
 },[]));
 const all=useMemo<MineItem[]>(()=>[...published,...drafts].sort((a,b)=>b.createdAt-a.createdAt),[published,drafts]);
 const filtered=useMemo(()=>filterMine(all,status),[all,status]);
 const counts=useMemo(()=>({
  all:all.length,
  published:published.filter(item=>item.status==="published").length,
  draft:drafts.length,
  paused:published.filter(item=>item.status==="paused").length,
  sold:published.filter(item=>item.status==="sold").length
 }),[all.length,published,drafts.length]);
 return <>
  <Stack.Screen options={{
   title:"Mis anuncios",
   headerShadowVisible:false,
   headerStyle:{backgroundColor:t.bg},
   headerTintColor:t.ink,
   headerTitleStyle:{fontWeight:"700"},
   headerRight:()=>(
    <Pressable accessibilityRole="button" accessibilityLabel="Configuración de JShop"
     accessibilityHint="Configurar ubicación y preferencias de venta"
     onPress={()=>router.push("/jshop/settings")}
     style={({pressed})=>({width:44,height:44,borderRadius:14,borderWidth:1,borderColor:t.line,
      backgroundColor:pressed?t.cream:t.surface,alignItems:"center",justifyContent:"center"})}>
     <Ionicons name="settings-outline" size={21} color={t.ink}/>
    </Pressable>
   )
  }}/>
  <JShopPage>
   <View style={{width:"100%",maxWidth:720,alignSelf:"center",gap:14}}>
    <JShopButton title="Crear anuncio" icon="add-circle-outline" onPress={()=>router.push("/jshop/publish")}/>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="always"
     accessibilityLabel="Filtrar mis anuncios por estado"
     style={{flexGrow:0}}
     contentContainerStyle={{gap:8,paddingVertical:2,paddingRight:16,alignItems:"center"}}>
     {statuses.map(tab=><Pressable key={tab.key} accessibilityRole="button"
      accessibilityState={{selected:status===tab.key}} onPress={()=>setStatus(tab.key)}
      style={({pressed})=>({minHeight:44,paddingHorizontal:13,borderRadius:23,borderWidth:1,flexShrink:0,
       borderColor:status===tab.key?t.ink:t.line,backgroundColor:status===tab.key?t.ink:t.surface,
       flexDirection:"row",alignItems:"center",justifyContent:"center",gap:6,opacity:pressed?0.7:1})}>
      <Text numberOfLines={1} style={{fontSize:13,fontWeight:"700",color:status===tab.key?t.bg:t.ink}}>{tab.label}</Text>
      {!loading&&<Text style={{fontSize:12,color:status===tab.key?t.bg:t.ink2}}>{counts[tab.key]}</Text>}
     </Pressable>)}
    </ScrollView>
    {loading?<JShopListingSkeleton withFavorite={false}/>:filtered.length>0?
     <View style={{gap:10}}>
      {filtered.map(item=><JShopItemCard key={item.id} item={item}
       onOpen={()=>router.push({pathname:"/jshop/item/[id]",params:{id:item.id}})}/>)}
     </View>:error?null:
     <View style={{borderRadius:20,borderWidth:1,borderColor:t.line,backgroundColor:t.surface,
      paddingHorizontal:18,paddingVertical:24,gap:9,alignItems:"center"}}>
      <View style={{width:54,height:54,borderRadius:18,backgroundColor:t.cream,
       alignItems:"center",justifyContent:"center",marginBottom:4}}>
       <Ionicons name="albums-outline" size={27} color={t.ink}/>
      </View>
      <Text style={{fontSize:16,fontWeight:"800",color:t.ink,textAlign:"center"}}>
       {status==="all"?"Todavía no creaste anuncios":"No hay anuncios en esta sección"}
      </Text>
      <Text style={{fontSize:13,lineHeight:20,color:t.ink2,textAlign:"center",maxWidth:360}}>
       {status==="all"?"Crea tu primer anuncio con el botón superior.":"Puedes elegir otra categoría de estado para ver tus artículos."}
      </Text>
     </View>
    }
    {!!error&&<Text accessibilityLiveRegion="polite" style={{color:t.ink2,fontSize:12}}>{error}</Text>}
   </View>
  </JShopPage>
 </>;
}
