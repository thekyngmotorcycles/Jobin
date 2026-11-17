import {Ionicons} from "@expo/vector-icons";
import {router,Stack,useFocusEffect,useLocalSearchParams} from "expo-router";
import {useCallback,useState} from "react";
import {ActivityIndicator,Alert,Image,Pressable,Text,View} from "react-native";
import {JShopButton,JShopEmpty,JShopIconButton,JShopPage,JShopPhoto,JShopTitle} from "../../../components/JShopUI";
import {PublicProfileAvatar} from "../../../components/PublicProfileAvatar";
import {deleteJShopDraft,jshopAccountId,readJShopDrafts} from "../../../lib/jshop-local";
import {formatJShopPrice,type JShopDraft} from "../../../lib/jshop-model";
import {useTheme} from "../../../state/ThemeProvider";
import {jobeenTokens} from "../../../theme/jobeen";

export default function JShopItemDetail(){
 const {id}=useLocalSearchParams<{id:string}>();
 const {theme}=useTheme();const t=jobeenTokens(theme);
 const [ownerId,setOwnerId]=useState("");
 const [item,setItem]=useState<JShopDraft|null>(null);
 const [selectedPhoto,setSelectedPhoto]=useState(0);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState("");
 const [deleting,setDeleting]=useState(false);
 useFocusEffect(useCallback(()=>{
  let live=true;setLoading(true);
  void(async()=>{
   try{
    const owner=await jshopAccountId();const drafts=await readJShopDrafts(owner);
    if(!live)return;
    setOwnerId(owner);setItem(drafts.find(row=>row.id===id)??null);setSelectedPhoto(0);setError("");
   }catch(e){if(live)setError(e instanceof Error?e.message:"No se pudo abrir el artículo.");}
   finally{if(live)setLoading(false);}
  })();
  return()=>{live=false;};
 },[id]));
 function requestDelete(){
  if(!item||!ownerId||deleting)return;
  Alert.alert("Eliminar borrador","¿Eliminar este anuncio del dispositivo? Esta acción no se puede deshacer.",[
   {text:"Cancelar",style:"cancel"},
   {text:"Eliminar",style:"destructive",onPress:()=>{void(async()=>{
    setDeleting(true);
    try{await deleteJShopDraft(ownerId,item.id);router.replace("/jshop/mine");}
    catch(e){setError(e instanceof Error?e.message:"No se pudo eliminar el anuncio.");}
    finally{setDeleting(false);}
   })();}}
  ]);
 }
 return <>
  <Stack.Screen options={{title:"Detalle del artículo"}}/>
  <JShopPage>
   {loading?<ActivityIndicator color={t.yellow}/>:item?<>
    <JShopTitle title="Vista previa" subtitle="Borrador privado, solo visible desde esta cuenta."/>
    <JShopPhoto uri={item.photos[selectedPhoto]} large/>
    {item.photos.length>1&&<View style={{flexDirection:"row",flexWrap:"wrap",gap:8}}>
     {item.photos.map((photo,index)=><Pressable key={photo+"-"+index} accessibilityRole="button" accessibilityLabel={"Ver foto "+(index+1)} accessibilityState={{selected:selectedPhoto===index}}
       onPress={()=>setSelectedPhoto(index)} style={{width:65,height:65,borderWidth:selectedPhoto===index?2:1,borderColor:selectedPhoto===index?t.yellow:t.line,borderRadius:12,overflow:"hidden"}}>
       <Image source={{uri:photo}} style={{width:"100%",height:"100%"}} resizeMode="cover"/>
      </Pressable>)}
    </View>}
    <View style={{gap:8}}>
     <Text style={{fontSize:23,fontWeight:"800",color:t.ink}}>{item.title}</Text>
     <Text style={{fontSize:21,fontWeight:"800",color:t.ink}}>{formatJShopPrice(item.price,item.currency)}</Text>
     <View style={{flexDirection:"row",alignItems:"center",gap:7,flexWrap:"wrap"}}>
      <View style={{backgroundColor:t.cream,paddingHorizontal:11,paddingVertical:7,borderRadius:14}}><Text style={{color:t.ink,fontWeight:"700",fontSize:12}}>{item.category}</Text></View>
      <View style={{backgroundColor:t.surface,paddingHorizontal:11,paddingVertical:7,borderRadius:14,borderWidth:1,borderColor:t.line}}><Text style={{color:t.ink,fontSize:12}}>{item.condition}</Text></View>
     </View>
     {!!item.location&&<View style={{flexDirection:"row",alignItems:"center",gap:7}}><Ionicons name="location-outline" size={18} color={t.ink2}/><Text style={{color:t.ink2}}>{item.location}</Text></View>}
    </View>
    <View style={{padding:15,borderRadius:20,backgroundColor:t.surface,borderWidth:1,borderColor:t.line,gap:10}}>
     <Text style={{fontSize:16,fontWeight:"800",color:t.ink}}>Descripción</Text>
     <Text style={{fontSize:14,lineHeight:21,color:item.description?t.ink:t.ink2}}>{item.description||"Todavía no escribiste una descripción."}</Text>
    </View>
    <View style={{padding:15,borderRadius:20,backgroundColor:t.surface,borderWidth:1,borderColor:t.line,gap:12}}>
     <Text style={{fontSize:16,fontWeight:"800",color:t.ink}}>Vendedor</Text>
     <View style={{flexDirection:"row",alignItems:"center",gap:12}}>
      <PublicProfileAvatar userId={ownerId} name="Mi cuenta" size={48}/>
      <View style={{flex:1,gap:3}}><Text style={{color:t.ink,fontWeight:"700"}}>Mi cuenta</Text><Text style={{color:t.ink2,fontSize:12}}>Perfil profesional de Jobeen</Text></View>
     </View>
     <JShopButton title="Ver mi JCard" secondary icon="id-card-outline" onPress={()=>router.push("/(tabs)/profile")}/>
    </View>
    <View style={{gap:9}}>
     <JShopButton title="Editar borrador" icon="create-outline" onPress={()=>router.push({pathname:"/jshop/publish",params:{draft:item.id}})}/>
     <JShopButton title={deleting?"Eliminando...":"Eliminar borrador"} secondary icon="trash-outline" disabled={deleting} onPress={requestDelete}/>
    </View>
    <View style={{gap:9}}>
     <JShopButton title="Contactar vendedor" icon="chatbubble-ellipses-outline" disabled onPress={()=>{}}/>
     <View style={{flexDirection:"row",justifyContent:"space-around",gap:12}}>
      <JShopIconButton icon="heart-outline" label="Guardar artículo (próximamente)" disabled onPress={()=>{}}/>
      <JShopIconButton icon="share-social-outline" label="Compartir artículo (próximamente)" disabled onPress={()=>{}}/>
      <JShopIconButton icon="flag-outline" label="Denunciar artículo (próximamente)" disabled onPress={()=>{}}/>
     </View>
    </View>
    <View style={{borderRadius:18,padding:14,backgroundColor:t.cream,gap:5}}>
     <Text style={{color:t.ink,fontWeight:"700"}}>Todavía no está publicado</Text>
     <Text style={{color:t.ink2,fontSize:12,lineHeight:18}}>Las funciones Contactar vendedor, Guardar, Compartir y Denunciar estarán disponibles para anuncios públicos cuando activemos el catálogo de JShop.</Text>
    </View>
   </>:<JShopEmpty icon="alert-circle-outline" title="Artículo no disponible" description="No se encontró un borrador de esta cuenta. Los anuncios públicos todavía no están habilitados." action={{title:"Ver mis anuncios",onPress:()=>router.replace("/jshop/mine")}}/>}
   {!!error&&<Text accessibilityLiveRegion="polite" style={{color:t.ink}}>{error}</Text>}
  </JShopPage>
 </>;
}
