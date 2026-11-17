import {Ionicons} from "@expo/vector-icons";
import {router,Stack,useLocalSearchParams} from "expo-router";
import * as ImagePicker from "expo-image-picker";
import {useEffect,useState} from "react";
import {ActivityIndicator,Image,Pressable,Text,TextInput,View} from "react-native";
import {JShopButton,JShopPage,JShopTitle} from "../../components/JShopUI";
import {jshopAccountId,readJShopDrafts,saveJShopDraft} from "../../lib/jshop-local";
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
 const [location,setLocation]=useState("");
 const [photos,setPhotos]=useState<string[]>([]);
 const [busy,setBusy]=useState(false);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState("");
 useEffect(()=>{
  let live=true;
  void(async()=>{
   try{
    const owner=await jshopAccountId();
    if(!live)return;
    setOwnerId(owner);
    if(draft){
     const drafts=await readJShopDrafts(owner);
     const found=drafts.find(item=>item.id===draft);
     if(!found)throw new Error("El borrador no existe o pertenece a otra cuenta.");
     if(!live)return;
     setExisting(found);setTitle(found.title);setDescription(found.description);setCategory(found.category);
     setCondition(found.condition);setPrice(found.price===null?"":String(found.price));
     setCurrency(found.currency);setLocation(found.location);setPhotos(found.photos);
    }
   }catch(e){if(live)setError(e instanceof Error?e.message:"No se pudo abrir el editor.");}
   finally{if(live)setLoading(false);}
  })();
  return()=>{live=false;};
 },[draft]);
 async function pickPhotos(){
  if(photos.length>=5)return;
  try{
   const result=await ImagePicker.launchImageLibraryAsync({mediaTypes:["images"],allowsMultipleSelection:true,selectionLimit:5-photos.length,quality:0.8});
   if(result.canceled)return;
   setPhotos(current=>[...current,...result.assets.map(x=>x.uri)].slice(0,5));
  }catch(e){setError(e instanceof Error?e.message:"No se pudieron seleccionar las fotografías.");}
 }
 async function save(){
  if(busy||!ownerId)return;
  if(draft&&!existing){setError("El borrador solicitado no está disponible.");return;}
  if(title.trim().length<3){setError("Escribe un título de al menos 3 caracteres.");return;}
  const amount=parseJShopPrice(price);
  if(price.trim()&&amount===null){setError("Introduce un precio válido mayor que cero o déjalo vacío.");return;}
  setBusy(true);setError("");
  try{
   const now=Date.now();
   const item:JShopDraft={
    id:existing?.id??("draft-"+now.toString(36)+"-"+Math.random().toString(36).slice(2,9)),
    ownerId,title:title.trim().slice(0,100),description:description.trim().slice(0,2000),
    category,condition,price:amount,currency,location:location.trim().slice(0,120),
    photos,createdAt:existing?.createdAt??now,updatedAt:now
   };
   await saveJShopDraft(ownerId,item);
   router.replace("/jshop/mine");
  }catch(e){setError(e instanceof Error?e.message:"No se pudo guardar el borrador.");}
  finally{setBusy(false);}
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
   <JShopTitle title={existing?"Editar borrador":"Preparar un anuncio"} subtitle="El anuncio se guardará en este dispositivo y no será visible para otros usuarios."/>
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
    {field("Ubicación",location,setLocation,"Ciudad o zona donde se encuentra el artículo",{maxLength:120})}
    <View style={{borderRadius:18,backgroundColor:t.cream,padding:14,gap:5}}>
     <Text style={{fontWeight:"800",fontSize:13,color:t.ink}}>Publicación pública próximamente</Text>
     <Text style={{color:t.ink2,fontSize:12,lineHeight:18}}>Los borradores no se comparten ni se muestran en búsquedas. La venta y los pagos no están habilitados todavía.</Text>
    </View>
    {!!error&&<Text accessibilityLiveRegion="polite" style={{color:t.ink,fontWeight:"600"}}>{error}</Text>}
    <JShopButton title={busy?"Guardando...":"Guardar borrador"} icon="save-outline" disabled={busy||!ownerId||!!(draft&&!existing)} onPress={()=>void save()}/>
    <JShopButton title="Cancelar" secondary onPress={()=>router.back()}/>
   </>}
  </JShopPage>
 </>;
}
