import {Ionicons} from "@expo/vector-icons";
import {router,Stack,useLocalSearchParams,useFocusEffect} from "expo-router";
import * as ImagePicker from "expo-image-picker";
import {useCallback,useEffect,useRef,useState} from "react";
import {ActivityIndicator,Alert,Image,Pressable,Text,TextInput,View} from "react-native";
import {JShopButton,JShopPage,JShopTitle} from "../../components/JShopUI";
import {readJShopDrafts,saveJShopDraft,deleteJShopDraft} from "../../lib/jshop-local";
import {captureMessageScope,assertMessageScope,type MessageScope} from "../../lib/message-session";
import {publishJShopDraft} from "../../lib/jshop-api";
import {readDefaultSaleLocation,readPendingArticleLocation,clearPendingArticleLocation,type SaleLocation} from "../../lib/jshop-selling-location";
import {readSellerCurrency} from "../../lib/jshop-selling-preferences";
import {JSHOP_CATEGORIES,JSHOP_CONDITIONS,JSHOP_CURRENCIES,parseJShopPrice,type JShopCategory,type JShopCondition,type JShopCurrency,type JShopDraft} from "../../lib/jshop-model";
import {useTheme} from "../../state/ThemeProvider";
import {jobeenTokens} from "../../theme/jobeen";

export default function JShopPublish(){
 const {draft}=useLocalSearchParams<{draft?:string}>();
 const {theme}=useTheme();const t=jobeenTokens(theme);
 const [ownerId,setOwnerId]=useState("");
 const [existing,setExisting]=useState<JShopDraft|null>(null);
 const [title,setTitle]=useState("");
 const [description,setDescription]=useState("");
 const [category,setCategory]=useState<JShopCategory>("Otros");
 const [condition,setCondition]=useState<JShopCondition>("Usado");
 const [price,setPrice]=useState("");
 const [currency,setCurrency]=useState<JShopCurrency>("USD");
 const session=useRef(draft??("listing-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,10))).current;
 const [defaultPlace,setDefaultPlace]=useState<SaleLocation|null>(null);
 const [articlePlace,setArticlePlace]=useState<SaleLocation|null>(null);
 const [photos,setPhotos]=useState<string[]>([]);
 const [busy,setBusy]=useState(false);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState("");
 const scopeRef=useRef<MessageScope|null>(null),saving=useRef(false),focusRevision=useRef(0);
 useEffect(()=>{
  let live=true;scopeRef.current=null;setOwnerId("");setLoading(true);setDefaultPlace(null);setArticlePlace(null);setExisting(null);setPhotos([]);setTitle("");setDescription("");setPrice("");
  void(async()=>{
   try{
    const scope=await captureMessageScope(),owner=scope.owner;
    if(!live)return;
    const [defaultLocation,preferredCurrency]=await Promise.all([readDefaultSaleLocation(owner,scope),readSellerCurrency(owner)]);
    await assertMessageScope(scope);
    if(!live)return;
    setDefaultPlace(defaultLocation);
    if(!draft)setCurrency(preferredCurrency);
    if(draft){
     const drafts=await readJShopDrafts(owner);await assertMessageScope(scope);
     const found=drafts.find(item=>item.id===draft);
     if(!found)throw new Error("El borrador no existe o pertenece a otra cuenta.");
     if(!live)return;
     setExisting(found);setTitle(found.title);setDescription(found.description);setCategory(found.category);
     setCondition(found.condition);setPrice(found.price===null?"":String(found.price));
     setCurrency(found.currency);setPhotos(found.photos);
     if(typeof found.locationLat==="number"&&typeof found.locationLon==="number"){
      setArticlePlace({city:found.location,label:found.location,lat:found.locationLat,lon:found.locationLon,zoom:11});
     }
    }
    const pending=await readPendingArticleLocation(owner,session,scope);await assertMessageScope(scope);
    if(live){scopeRef.current=scope;setOwnerId(owner);if(pending)setArticlePlace(pending);}
   }catch(e){if(live)setError(e instanceof Error?e.message:"No se pudo abrir el editor.");}
   finally{if(live)setLoading(false);}
  })();
  return()=>{live=false;scopeRef.current=null;focusRevision.current++;};
 },[draft]);
 useFocusEffect(useCallback(()=>{
  const scope=scopeRef.current;if(!scope||scope.owner!==ownerId)return;
  const generation=++focusRevision.current;let active=true;
  void(async()=>{
   try{
    const [freshDefault,pending]=await Promise.all([
     readDefaultSaleLocation(ownerId,scope),readPendingArticleLocation(ownerId,session,scope)
    ]);
    await assertMessageScope(scope);
    if(active&&scopeRef.current===scope&&focusRevision.current===generation){setDefaultPlace(freshDefault);if(pending)setArticlePlace(pending);}
   }catch(e){if(active)setError(e instanceof Error?e.message:"No se pudo actualizar la ubicación de venta.");}
  })();
  return()=>{active=false;focusRevision.current++;};
 },[ownerId,session]));
 const selectedLocation=articlePlace??defaultPlace;
 async function openLocation(){
  const scope=scopeRef.current;if(!scope||saving.current)return;
  try{await captureMessageScope(scope);}catch{return;}
  if(scopeRef.current!==scope)return;
  if(!defaultPlace){router.push({pathname:"/jshop/sale-location",params:{target:"default"}});return;}
  router.push({pathname:"/jshop/sale-location",params:{target:"article",session}});
 }
 async function useDefaultLocation(){
  const scope=scopeRef.current;if(!scope||!defaultPlace||saving.current)return;
  try{await clearPendingArticleLocation(ownerId,session,scope);if(scopeRef.current===scope)setArticlePlace(null);}catch(e){if(scopeRef.current===scope)setError(e instanceof Error?e.message:"No se pudo restaurar la ubicación.");}
 }
 async function pickPhotos(){
  const scope=scopeRef.current;if(!scope||saving.current||photos.length>=5)return;
  try{await captureMessageScope(scope);if(scopeRef.current!==scope)return;
   const result=await ImagePicker.launchImageLibraryAsync({mediaTypes:["images"],allowsMultipleSelection:true,selectionLimit:5-photos.length,quality:0.8});
   await assertMessageScope(scope);if(result.canceled||scopeRef.current!==scope)return;
   setPhotos(current=>[...current,...result.assets.map(x=>x.uri)].slice(0,5));
  }catch(e){setError(e instanceof Error?e.message:"No se pudieron seleccionar las fotografías.");}
 }
 async function save(publish=false){
  const scope=scopeRef.current;if(!scope||scope.owner!==ownerId||saving.current)return;
  if(draft&&!existing){setError("El borrador solicitado no está disponible.");return;}
  if(publish&&!defaultPlace){setError("Primero configurá tu ubicación de venta en JShop.");return;}
  if(publish&&!selectedLocation){setError("Elige la ubicación del artículo antes de publicarlo.");return;}
  if(title.trim().length<3){setError("Escribe un título de al menos 3 caracteres.");return;}
  const amount=parseJShopPrice(price);
  if(price.trim()&&amount===null){setError("Introduce un precio válido mayor que cero o déjalo vacío.");return;}
  saving.current=true;setBusy(true);setError("");
  try{
   await captureMessageScope(scope);if(scopeRef.current!==scope)return;
   const now=Date.now();
   const item:JShopDraft={
    id:existing?.id??("draft-"+now.toString(36)+"-"+Math.random().toString(36).slice(2,9)),
    ownerId,title:title.trim().slice(0,100),description:description.trim().slice(0,2000),
    category,condition,price:amount,currency,location:selectedLocation?.label.slice(0,120)??"",
    locationLat:selectedLocation?.lat??null,locationLon:selectedLocation?.lon??null,
    photos,createdAt:existing?.createdAt??now,updatedAt:now
   };
   if(publish){
    const publishedId=await publishJShopDraft(ownerId,item,scope);
    await assertMessageScope(scope);if(scopeRef.current!==scope)return;
    if(existing)await deleteJShopDraft(ownerId,existing.id).catch(()=>{});
    await clearPendingArticleLocation(ownerId,session,scope).catch(()=>{});
    await assertMessageScope(scope);if(scopeRef.current===scope)router.replace({pathname:"/jshop/item/[id]",params:{id:publishedId}});
   }else{
    await assertMessageScope(scope);await saveJShopDraft(ownerId,item);
    await assertMessageScope(scope);if(scopeRef.current!==scope)return;
    await clearPendingArticleLocation(ownerId,session,scope).catch(()=>{});
    await assertMessageScope(scope);if(scopeRef.current===scope)router.replace("/jshop/mine");
   }
  }catch(e){setError(e instanceof Error?e.message:"No se pudo completar la operación.");}
  finally{saving.current=false;setBusy(false);}
 }
 const field=(label:string,value:string,onChangeText:(value:string)=>void,placeholder:string,options?:{multiline?:boolean;numeric?:boolean;maxLength?:number})=>
  <View style={{gap:7}}><Text style={{fontSize:14,color:t.ink,fontWeight:"700"}}>{label}</Text>
   <TextInput accessibilityLabel={label} value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={t.ink2}
    multiline={options?.multiline} keyboardType={options?.numeric?"decimal-pad":"default"} maxLength={options?.maxLength}
    textAlignVertical={options?.multiline?"top":"center"}
    style={{minHeight:options?.multiline?118:50,borderWidth:1,borderColor:t.line,borderRadius:16,backgroundColor:t.surface,color:t.ink,fontSize:15,paddingHorizontal:14,paddingVertical:12}}/>
  </View>;
 return <>
  <Stack.Screen options={{title:existing?"Editar borrador":"Nuevo anuncio"}}/>
  <JShopPage>
   <JShopTitle title={existing?"Editar borrador":"Preparar un anuncio"} subtitle="Guarda un borrador o publica tu artículo para que otros usuarios lo encuentren."/>
   {loading?<ActivityIndicator color={t.yellow}/>:<>
    <View style={{gap:10}}>
     <View style={{flexDirection:"row",justifyContent:"space-between",alignItems:"center"}}>
      <Text style={{fontSize:16,fontWeight:"800",color:t.ink}}>Fotografías</Text>
      <Text style={{color:t.ink2}}>{photos.length}/5</Text>
     </View>
     <View style={{flexDirection:"row",flexWrap:"wrap",gap:10}}>
      {photos.map((uri,index)=><View key={uri+"-"+index} style={{width:104,height:104,borderRadius:16,overflow:"hidden",borderWidth:1,borderColor:t.line}}>
       <Image source={{uri}} style={{width:"100%",height:"100%"}} resizeMode="cover"/>
       <Pressable accessibilityRole="button" accessibilityLabel={"Eliminar foto "+(index+1)} onPress={()=>setPhotos(current=>current.filter((_,i)=>i!==index))}
        style={{position:"absolute",top:4,right:4,width:35,height:35,borderRadius:18,alignItems:"center",justifyContent:"center",backgroundColor:t.surface}}>
        <Ionicons name="close" size={21} color={t.ink}/>
       </Pressable>
      </View>)}
      {photos.length<5&&<Pressable accessibilityRole="button" accessibilityLabel="Añadir fotografías" onPress={()=>void pickPhotos()}
       style={{width:104,height:104,borderRadius:16,borderWidth:1,borderColor:t.line,backgroundColor:t.cream,alignItems:"center",justifyContent:"center",gap:5}}>
       <Ionicons name="camera-outline" color={t.ink} size={27}/><Text style={{fontSize:12,color:t.ink,fontWeight:"700"}}>Añadir fotos</Text>
      </Pressable>}
     </View>
     <Text style={{fontSize:12,color:t.ink2,lineHeight:18}}>Las fotografías permanecen en el dispositivo y pueden dejar de verse si Android limpia sus archivos temporales.</Text>
    </View>
    {field("Título",title,setTitle,"¿Qué estás vendiendo?",{maxLength:100})}
    {field("Descripción",description,setDescription,"Características, estado y detalles del artículo",{multiline:true,maxLength:2000})}
    <View style={{gap:9}}>
     <Text style={{fontSize:14,fontWeight:"700",color:t.ink}}>Categoría</Text>
     <View style={{flexDirection:"row",flexWrap:"wrap",gap:8}}>
      {JSHOP_CATEGORIES.filter(c=>c!=="Todo").map(item=><Pressable key={item} accessibilityRole="button" accessibilityState={{selected:category===item}} onPress={()=>setCategory(item as JShopCategory)}
       style={{minHeight:44,paddingHorizontal:12,justifyContent:"center",borderRadius:20,borderWidth:1,borderColor:category===item?t.ink:t.line,backgroundColor:category===item?t.ink:t.surface}}>
       <Text style={{color:category===item?t.bg:t.ink,fontWeight:"600",fontSize:13}}>{item}</Text>
      </Pressable>)}
     </View>
    </View>
    <View style={{gap:9}}>
     <Text style={{fontSize:14,fontWeight:"700",color:t.ink}}>Estado</Text>
     <View style={{flexDirection:"row",gap:10}}>
      {JSHOP_CONDITIONS.map(item=><Pressable key={item} accessibilityRole="button" accessibilityState={{selected:condition===item}} onPress={()=>setCondition(item)}
       style={{minHeight:44,flex:1,alignItems:"center",justifyContent:"center",borderRadius:16,backgroundColor:condition===item?t.cream:t.surface,borderWidth:1,borderColor:condition===item?t.yellow:t.line}}>
       <Text style={{fontWeight:"700",color:t.ink}}>{item}</Text>
      </Pressable>)}
     </View>
    </View>
    <View style={{gap:9}}>
     <Text style={{fontSize:14,fontWeight:"700",color:t.ink}}>Moneda</Text>
     <View style={{flexDirection:"row",gap:9}}>
      {JSHOP_CURRENCIES.map(item=><Pressable key={item} accessibilityRole="button" accessibilityState={{selected:currency===item}} onPress={()=>setCurrency(item)}
       style={{minHeight:44,flex:1,alignItems:"center",justifyContent:"center",borderRadius:16,borderWidth:1,borderColor:currency===item?t.ink:t.line,backgroundColor:currency===item?t.ink:t.surface}}>
       <Text style={{fontWeight:"700",color:currency===item?t.bg:t.ink}}>{item}</Text>
      </Pressable>)}
     </View>
    </View>
    {field("Precio",price,setPrice,"Ej. 250",{numeric:true})}
    <View style={{borderWidth:1,borderColor:defaultPlace?t.line:t.yellow,borderRadius:19,padding:14,gap:10,backgroundColor:t.surface}}>
     <View style={{flexDirection:"row",alignItems:"center",gap:10}}>
      <View style={{width:43,height:43,borderRadius:14,backgroundColor:t.cream,alignItems:"center",justifyContent:"center"}}>
       <Ionicons name="location-outline" size={23} color={t.ink}/>
      </View>
      <View style={{flex:1,gap:3}}>
       <Text style={{fontWeight:"800",color:t.ink,fontSize:15}}>Ubicación del artículo</Text>
       <Text numberOfLines={2} style={{fontSize:13,color:selectedLocation?t.ink:t.ink2}}>{selectedLocation?.label??"Primero configurá tu ubicación de venta"}</Text>
      </View>
     </View>
     <JShopButton title={!defaultPlace?"Configurar ubicación de venta":selectedLocation?"Cambiar para este artículo":"Elegir ubicación"}
      secondary icon="map-outline" onPress={openLocation}/>
     {articlePlace&&defaultPlace&&<Pressable accessibilityRole="button" onPress={useDefaultLocation}
      style={{minHeight:40,alignItems:"center",justifyContent:"center"}}>
      <Text style={{fontSize:13,fontWeight:"700",color:t.ink2}}>Usar mi ubicación predeterminada: {defaultPlace.city}</Text>
     </Pressable>}
     <Text style={{fontSize:12,lineHeight:18,color:t.ink2}}>{!defaultPlace?"Es necesaria una ubicación de venta predeterminada para publicar.":articlePlace?"Esta ubicación se guardará solo en este artículo. Tu ubicación predeterminada no cambiará.":"Se utiliza tu ubicación de venta predeterminada. Puedes cambiarla únicamente para este artículo."} Una vez publicado, el anuncio conservará esta ubicación.</Text>
    </View>
    <View style={{borderRadius:18,backgroundColor:t.cream,padding:14,gap:5}}>
     <Text style={{fontWeight:"800",fontSize:13,color:t.ink}}>Publicación de anuncios</Text>
     <Text style={{color:t.ink2,fontSize:12,lineHeight:18}}>Al publicar, el título, las fotografías, el precio y la ubicación serán visibles para otras personas. Los pagos no se gestionan en JShop; contactá al vendedor mediante Mensajes.</Text>
    </View>
    {!!error&&<Text accessibilityLiveRegion="polite" style={{color:t.ink,fontWeight:"600"}}>{error}</Text>}
    <JShopButton title={busy?"Procesando...":"Publicar anuncio"} icon="cloud-upload-outline" disabled={busy||!ownerId||!defaultPlace||!selectedLocation||!!(draft&&!existing)} onPress={()=>Alert.alert("Publicar anuncio","El artículo y sus fotografías serán visibles públicamente en JShop. ¿Quieres continuar?",[{text:"Cancelar",style:"cancel"},{text:"Publicar",onPress:()=>void save(true)}])}/>
    <JShopButton title="Guardar borrador" secondary icon="save-outline" disabled={busy||!ownerId||!!(draft&&!existing)} onPress={()=>void save(false)}/>
    <JShopButton title="Cancelar" secondary onPress={()=>router.back()}/>
   </>}
  </JShopPage>
 </>;
}
