import {Ionicons} from "@expo/vector-icons";
import {router,Stack,useFocusEffect,useLocalSearchParams} from "expo-router";
import * as Linking from "expo-linking";
import {useCallback,useRef,useState} from "react";
import {ActivityIndicator,Alert,Image,Pressable,Text,View} from "react-native";
import {JShopButton,JShopEmpty,JShopIconButton,JShopPage,JShopPhoto,JShopTitle} from "../../../components/JShopUI";
import {PublicProfileAvatar} from "../../../components/PublicProfileAvatar";
import {JobeenShareSheet} from "../../../components/JCardShareSheet";
import {deleteJShopDraft,jshopAccountId,readJShopDrafts} from "../../../lib/jshop-local";
import {deleteJShopListing,loadJShopFavoriteIds,loadJShopListing,setJShopFavorite,setJShopListingStatus} from "../../../lib/jshop-api";
import {formatJShopPrice,type JShopDraft,type JShopListing} from "../../../lib/jshop-model";
import {startJShopConversation} from "../../../lib/jshop-messaging";
import {assertMessageScope,captureMessageScope,type MessageScope} from "../../../lib/message-session";
import {useTheme} from "../../../state/ThemeProvider";
import {jobeenTokens} from "../../../theme/jobeen";

export default function JShopItemDetail(){
 const {id}=useLocalSearchParams<{id:string}>();
 const {theme}=useTheme();const t=jobeenTokens(theme);
 const scopeRef=useRef<MessageScope|null>(null);
 const [viewer,setViewer]=useState("");
 const [item,setItem]=useState<JShopListing|JShopDraft|null>(null);
 const [saved,setSaved]=useState(false);
 const [selectedPhoto,setSelectedPhoto]=useState(0);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState("");
 const [shareOpen,setShareOpen]=useState(false);
 const [busy,setBusy]=useState(false);
 useFocusEffect(useCallback(()=>{
  let live=true;scopeRef.current=null;setLoading(true);
  void(async()=>{
   try{
    const scope=await captureMessageScope();
    const user=await jshopAccountId();
    if(user!==scope.owner)throw Error("La sesión cambió.");
    let found:JShopListing|JShopDraft|null=await loadJShopListing(id);
    if(!found){const drafts=await readJShopDrafts(user);found=drafts.find(row=>row.id===id)??null;}
    const favorites=found&&!("ownerId" in found)?await loadJShopFavoriteIds(user):[];
    await assertMessageScope(scope);
    if(live){scopeRef.current=scope;setViewer(user);setItem(found);setSaved(favorites.includes(id));setSelectedPhoto(0);setError("");}
   }catch(e){if(live){setItem(null);setError(e instanceof Error?e.message:"No se pudo abrir el artículo.");}}
   finally{if(live)setLoading(false);}
  })();
  return()=>{live=false;scopeRef.current=null;};
 },[id]));
 const listing=item&&!('ownerId' in item)?item:null;
 const draft=item&&'ownerId' in item?item:null;
 const owner=!!listing&&viewer===listing.sellerId;
 async function changeStatus(status:"published"|"paused"|"sold"){
  if(!listing||!owner||busy)return;
  setBusy(true);
  try{await setJShopListingStatus(viewer,listing.id,status);setItem({...listing,status});setError("");}
  catch(e){setError(e instanceof Error?e.message:"No se pudo cambiar el estado.");}
  finally{setBusy(false);}
 }
 async function toggleFavorite(){
  if(!listing||owner||busy)return;
  setBusy(true);
  try{await setJShopFavorite(viewer,listing.id,!saved);setSaved(!saved);setError("");}
  catch(e){setError(e instanceof Error?e.message:"No se pudo actualizar el favorito.");}
  finally{setBusy(false);}
 }
 async function deleteItem(){
  if(!item||busy)return;setBusy(true);
  try{
   if(draft)await deleteJShopDraft(viewer,draft.id);
   else if(listing&&owner)await deleteJShopListing(viewer,listing);
   else throw Error("No tienes permiso para eliminar este artículo.");
   router.replace("/jshop/mine");
  }catch(e){setError(e instanceof Error?e.message:"No se pudo eliminar el anuncio.");}
  finally{setBusy(false);}
 }
 const requestDelete=()=>Alert.alert("Eliminar anuncio","Esta acción no se puede deshacer.",[
  {text:"Cancelar",style:"cancel"},{text:"Eliminar",style:"destructive",onPress:()=>void deleteItem()}
 ]);
 async function contactSeller(){
  const scope=scopeRef.current;
  if(!scope||!listing||owner||busy||scope.owner!==viewer)return;
  setBusy(true);setError("");
  try{
   const conversation=await startJShopConversation(listing,scope);
   if(scopeRef.current!==scope)return;
   router.push({pathname:"/message",params:{user:listing.sellerId,name:listing.sellerName,conversation:conversation.id}});
  }catch(e){setError(e instanceof Error?e.message:"No se pudo abrir la conversación con el vendedor.");}
  finally{setBusy(false);}
 }
 function share(){if(listing){setError("");setShareOpen(true);}}
 return <>
  <Stack.Screen options={{title:"Detalle del artículo"}}/>
  <JShopPage>
   {loading?<ActivityIndicator color={t.yellow}/>:item?<>
    {draft&&<JShopTitle title="Vista previa" subtitle="Borrador privado, visible solo desde esta cuenta."/>}
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
      <View style={{backgroundColor:t.cream,paddingHorizontal:11,paddingVertical:7,borderRadius:14}}>
       <Text style={{color:t.ink,fontWeight:"700",fontSize:12}}>{item.category}</Text>
      </View>
      <View style={{backgroundColor:t.surface,paddingHorizontal:11,paddingVertical:7,borderRadius:14,borderWidth:1,borderColor:t.line}}>
       <Text style={{color:t.ink,fontSize:12}}>{item.condition}</Text>
      </View>
      {!!listing&&listing.status!=="published"&&<Text style={{color:t.ink,fontWeight:"800"}}>{listing.status==="sold"?"Vendido":"Pausado"}</Text>}
     </View>
     {!!item.location&&<View style={{flexDirection:"row",alignItems:"center",gap:7}}>
      <Ionicons name="location-outline" size={18} color={t.ink2}/><Text style={{color:t.ink2}}>{item.location}</Text>
     </View>}
    </View>
    <View style={{padding:15,borderRadius:20,backgroundColor:t.surface,borderWidth:1,borderColor:t.line,gap:10}}>
     <Text style={{fontSize:16,fontWeight:"800",color:t.ink}}>Descripción</Text>
     <Text style={{fontSize:14,lineHeight:21,color:item.description?t.ink:t.ink2}}>{item.description||"Todavía no hay descripción."}</Text>
    </View>
    <View style={{padding:15,borderRadius:20,backgroundColor:t.surface,borderWidth:1,borderColor:t.line,gap:12}}>
     <Text style={{fontSize:16,fontWeight:"800",color:t.ink}}>Vendedor</Text>
     <View style={{flexDirection:"row",alignItems:"center",gap:12}}>
      <PublicProfileAvatar userId={listing?.sellerId??viewer} name={listing?.sellerName??"Mi cuenta"} size={48}/>
      <View style={{flex:1,gap:3}}>
       <Text style={{color:t.ink,fontWeight:"700"}}>{listing?.sellerName??"Mi cuenta"}</Text>
       <Text style={{color:t.ink2,fontSize:12}}>{listing?.sellerHandle?"@"+listing.sellerHandle:"Perfil profesional Jobeen"}</Text>
      </View>
     </View>
     <JShopButton title={draft||owner?"Ver mi JCard":"Ver JCard"} secondary icon="id-card-outline"
      onPress={()=>draft||owner?router.push("/(tabs)/profile"):router.push({pathname:"/jcard",params:{user:listing?.sellerId??""}})}/>
    </View>
    {draft?<View style={{gap:9}}>
     <JShopButton title="Editar borrador" icon="create-outline" onPress={()=>router.push({pathname:"/jshop/publish",params:{draft:draft.id}})}/>
     <JShopButton title={busy?"Eliminando...":"Eliminar borrador"} secondary icon="trash-outline" disabled={busy} onPress={requestDelete}/>
     <Text style={{color:t.ink2,fontSize:12,lineHeight:19}}>Este borrador no está publicado. Entrá en Editar borrador para publicarlo.</Text>
    </View>:owner&&listing?<View style={{gap:9}}>
     <JShopTitle title="Administrar anuncio" subtitle="Solo vos puedes modificar su estado."/>
     {listing.status==="published"?<>
      <JShopButton title="Pausar anuncio" secondary icon="pause-circle-outline" disabled={busy} onPress={()=>void changeStatus("paused")}/>
      <JShopButton title="Marcar como vendido" secondary icon="checkmark-circle-outline" disabled={busy} onPress={()=>void changeStatus("sold")}/>
     </>:<JShopButton title="Volver a publicar" icon="refresh-outline" disabled={busy} onPress={()=>void changeStatus("published")}/>}
     <JShopButton title="Eliminar anuncio" secondary icon="trash-outline" disabled={busy} onPress={requestDelete}/>
    </View>:listing&&<View style={{gap:10}}>
     <JShopButton title={busy?"Abriendo chat...":"Contactar vendedor"} icon="chatbubble-ellipses-outline" disabled={listing.status!=="published"||busy}
      onPress={()=>void contactSeller()}/>
     <View style={{flexDirection:"row",justifyContent:"space-around",gap:12}}>
      <JShopIconButton icon={saved?"heart":"heart-outline"} label={saved?"Quitar de guardados":"Guardar artículo"} selected={saved} onPress={()=>void toggleFavorite()}/>
      <JShopIconButton icon="share-social-outline" label="Compartir artículo" onPress={()=>void share()}/>
      <JShopIconButton icon="flag-outline" label="Denunciar artículo"
       onPress={()=>router.push({pathname:"/jshop/report",params:{listing:listing.id}})}/>
     </View>
    </View>}
    {!!error&&<Text accessibilityLiveRegion="polite" style={{color:t.ink,fontWeight:"600"}}>{error}</Text>}
    <View style={{borderRadius:18,padding:14,backgroundColor:t.cream,gap:5}}>
     <Text style={{color:t.ink,fontWeight:"700"}}>Compra entre usuarios</Text>
     <Text style={{color:t.ink2,fontSize:12,lineHeight:18}}>JShop permite descubrir artículos y contactar vendedores. No procesa cobros ni garantiza transacciones. Evitá adelantos de dinero y verifica el producto y al vendedor.</Text>
    </View>
   </>:<JShopEmpty icon="alert-circle-outline" title="Artículo no disponible"
    description="El anuncio no existe, no está publicado o no pertenece a esta cuenta."
    action={{title:"Volver a JShop",onPress:()=>router.replace("/(tabs)/shop")}}/>}
   {!!error&&!item&&<Text accessibilityLiveRegion="polite" style={{color:t.ink}}>{error}</Text>}
  </JShopPage>
 <JobeenShareSheet visible={shareOpen} onClose={()=>setShareOpen(false)} theme={theme} label={listing?.title??"Artículo"}
  contentTitle="Compartir artículo" link={listing?Linking.createURL("/jshop/item/"+listing.id):""}
  contentMessage={listing?listing.title+" · "+formatJShopPrice(listing.price,listing.currency)+"\n"+Linking.createURL("/jshop/item/"+listing.id):""}
  onError={setError}/>
 </>;
}
