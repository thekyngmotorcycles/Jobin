import {useEffect,useRef,useState} from "react";
import {ActivityIndicator,Pressable,ScrollView,Text,TextInput,View} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";
import {router,useLocalSearchParams} from "expo-router";
import {Avatar,IconButton} from "../components/social-ui";
import {Ionicons} from "@expo/vector-icons";
import {readRecentSearches,rememberRecentSearch,clearRecentSearches} from "../lib/search-history";
import {suggestionsForQuery} from "../lib/search-history-core";
import {PublicProfileAvatar} from "../components/PublicProfileAvatar";
import {requireSupabase} from "../lib/supabase";
import {useUi} from "../components/ui";
import {visiblePosts} from "../lib/feed";
import {browseStreams} from "../lib/streams";
import {interpretJobinSearch,matchJobinTerms} from "../lib/jobin-search";
import {findAllAccounts,findProfessionals,findPeople,loadCatalog,loadSpecialtyCatalog,type ProfessionalSearchResult,type PersonSearchResult,type AllAccountSearchResult} from "../lib/professional-api";
import {useProfessionalData} from "../state/useProfessionalData";
import {ProfessionalMapExplorer} from "../components/ProfessionalMapExplorer";

type SearchKind="Todo"|"Profesionales"|"Personas"|"Empresas"|"Flashes"|"Streams";
export default function Search(){
 const {mode,view}=useLocalSearchParams<{mode?:string;view?:string}>();
 const [viewMode,setViewMode]=useState<"list"|"map">(view==="map"?"map":"list");
 useEffect(()=>{setViewMode(view==="map"?"map":"list");},[view]);
 const {s,colors}=useUi();
 const catalog=useProfessionalData(loadCatalog);
 const specialtyCatalog=useProfessionalData(loadSpecialtyCatalog);
 const filterScrollRef=useRef<ScrollView>(null);
 const filterPositions=useRef<Partial<Record<SearchKind,{x:number;width:number}>>>({});
 const filterViewportWidth=useRef(0);
 const filterContentWidth=useRef(0);
 const [query,setQuery]=useState("");
 const [city,setCity]=useState("");
 const [specialty,setSpecialty]=useState("");
 const [kind,setKind]=useState<SearchKind>(mode==="live"?"Streams":mode==="flash"?"Flashes":"Todo");
 const [historyOwner,setHistoryOwner]=useState("");
 const [recent,setRecent]=useState<string[]>([]);
 const [showRecent,setShowRecent]=useState(false);
 useEffect(()=>{setKind(mode==="live"?"Streams":mode==="flash"?"Flashes":"Todo");},[mode]);
 useEffect(()=>{let active=true;void(async()=>{
  try{const {data:{user}}=await requireSupabase().auth.getUser();
   const id=user?.id??"";const entries=await readRecentSearches(id);
   if(active){setHistoryOwner(id);setRecent(entries);}
  }catch{if(active){setHistoryOwner("");setRecent([]);}}
 })();return()=>{active=false;};},[]);
 const [results,setResults]=useState<ProfessionalSearchResult[]>([]);
 const [people,setPeople]=useState<PersonSearchResult[]>([]);
 const [allAccounts,setAllAccounts]=useState<AllAccountSearchResult[]>([]);
 const [loading,setLoading]=useState(false);
 const [error,setError]=useState("");
 const [searched,setSearched]=useState(false);
 const intent=interpretJobinSearch(query,["Miami","Miami Beach","Orlando","Fort Lauderdale","New York","Los Angeles","Chicago","Houston","Dallas","Tampa","Buenos Aires","Ciudad de México","Lima","Bogotá","Medellín","Santiago","Madrid","Barcelona"],catalog.data,specialtyCatalog.data??undefined);
 const words=intent.terms;
 const posts=visiblePosts("Para ti",[],query);
 const streams=browseStreams("Popular","Todas","").filter(room=>(!intent.city||room.city.toLowerCase()===intent.city.toLowerCase())&&matchJobinTerms([room.title,room.host,room.city,room.profession].join(" "),words));
 const effectiveKind=kind;
 const displayedResults=results.filter(person=>effectiveKind==="Empresas"?person.account_type==="company":person.account_type==="personal");
 function centerFilter(option:SearchKind,animated:boolean){
  const position=filterPositions.current[option],viewport=filterViewportWidth.current;
  if(!position||!viewport)return;
  const maxScroll=Math.max(0,filterContentWidth.current-viewport);
  const centered=position.x+position.width/2-viewport/2;
  filterScrollRef.current?.scrollTo({x:Math.max(0,Math.min(centered,maxScroll)),animated});
 }
 useEffect(()=>{const frame=requestAnimationFrame(()=>centerFilter(kind,false));return()=>cancelAnimationFrame(frame);},[kind]);
 async function openProfile(id:string){
  try{const {data:{user}}=await requireSupabase().auth.getUser();if(user?.id===id){router.push("/(tabs)/profile");return;}}catch{}
  router.push({pathname:"/jcard",params:{user:id}});
 }
 async function runSearch(nextQuery=query){
  const term=nextQuery.trim();
  const mediaMode=effectiveKind==="Flashes"||effectiveKind==="Streams";
  if(!term&&!city.trim()&&!specialty.trim()&&!mediaMode&&effectiveKind!=="Personas"&&effectiveKind!=="Todo"){setError("Escribe qué profesional buscas o indica una ciudad.");return;}
  setQuery(nextQuery);setShowRecent(false);setError("");setSearched(true);
  if(term&&historyOwner){
   void rememberRecentSearch(historyOwner,term).then(setRecent).catch(()=>{});
  }
  if(mediaMode)return;
  const currentIntent=nextQuery===query?intent:interpretJobinSearch(nextQuery,["Miami","Miami Beach","Orlando","Fort Lauderdale","New York","Los Angeles","Chicago","Houston","Dallas","Tampa","Buenos Aires","Ciudad de México","Lima","Bogotá","Medellín","Santiago","Madrid","Barcelona"],catalog.data,specialtyCatalog.data??undefined);
  setLoading(true);
  try{
   if(effectiveKind==="Todo"){setAllAccounts(await findAllAccounts(term,city||currentIntent.city));setResults([]);setPeople([]);}
   else if(effectiveKind==="Personas"){setPeople(await findPeople(term,city||currentIntent.city));setResults([]);setAllAccounts([]);}
   else{setResults(await findProfessionals(term,city||currentIntent.city,currentIntent.professionCode,specialty||currentIntent.specialty));setPeople([]);setAllAccounts([]);}
  }catch(e){setResults([]);setPeople([]);setAllAccounts([]);setError(e instanceof Error?e.message:"No se pudo buscar profesionales.");}
  finally{setLoading(false);}
 }
 if(viewMode==="map")return <SafeAreaView style={s.screen}>
   <ProfessionalMapExplorer initialQuery={query} onList={next=>{
    setViewMode("list");setQuery(next);
    if(next.trim())void runSearch(next);
   }}/>
  </SafeAreaView>;
  return <SafeAreaView style={s.screen}>
  <View style={{flexDirection:"row",alignItems:"center",padding:12,gap:6}}>
   <IconButton icon="arrow-back" label="Volver" onPress={()=>router.canGoBack()?router.back():router.replace("/")}/>
   <TextInput accessibilityLabel="Buscar en Jobeen" placeholder={effectiveKind==="Flashes"?"Buscar Flashes":effectiveKind==="Streams"?"Buscar Lives":"Buscar personas, negocios o profesiones"} placeholderTextColor={colors.muted} value={query} onFocus={()=>setShowRecent(true)} onChangeText={value=>{setQuery(value);setShowRecent(true);setSearched(false);setResults([]);setPeople([]);setAllAccounts([]);}} onSubmitEditing={()=>void runSearch()} returnKeyType="search" style={{flex:1,minWidth:0,minHeight:46,borderRadius:24,backgroundColor:colors.accent,paddingHorizontal:18,color:colors.ink}}/>
   {!!query&&<IconButton icon="close" label="Borrar búsqueda" onPress={()=>{setQuery("");setShowRecent(true);setResults([]);setPeople([]);setAllAccounts([]);setSearched(false);}}/>}
  </View>
  <View style={{flexDirection:"row",gap:8,paddingHorizontal:16,paddingBottom:9}}>
   <Pressable accessibilityRole="button" accessibilityLabel="Ver resultados en lista" accessibilityState={{selected:true}}
    onPress={()=>setViewMode("list")} style={{flex:1,minHeight:42,backgroundColor:colors.ink,borderRadius:15,alignItems:"center",justifyContent:"center",flexDirection:"row",gap:7}}>
    <Ionicons name="list-outline" size={19} color={colors.paper}/>
    <Text style={{fontWeight:"800",color:colors.paper}}>Lista</Text>
   </Pressable>
   <Pressable accessibilityRole="button" accessibilityLabel="Ver empresas y profesionales en el mapa" onPress={()=>setViewMode("map")}
    style={{flex:1,minHeight:42,backgroundColor:colors.accent,borderRadius:15,alignItems:"center",justifyContent:"center",flexDirection:"row",gap:7}}>
    <Ionicons name="map-outline" size={19} color={colors.ink}/>
    <Text style={{fontWeight:"700",color:colors.ink}}>Mapa</Text>
   </Pressable>
  </View>
  {showRecent&&recent.length>0&&<View style={{marginHorizontal:16,marginBottom:8,padding:8,borderWidth:1,borderColor:colors.line,borderRadius:17,backgroundColor:colors.paper,gap:1}}>
   <View style={{flexDirection:"row",alignItems:"center",justifyContent:"space-between",paddingHorizontal:10,paddingVertical:4}}>
    <Text style={{fontSize:12,fontWeight:"700",color:colors.muted}}>Búsquedas recientes</Text>
    <Pressable accessibilityRole="button" accessibilityLabel="Borrar búsquedas recientes" onPress={()=>{void clearRecentSearches(historyOwner).then(()=>setRecent([])).catch(()=>{});}} style={{minHeight:36,justifyContent:"center",paddingHorizontal:8}}>
     <Text style={{fontSize:12,color:colors.muted}}>Borrar historial</Text>
    </Pressable>
   </View>
   {suggestionsForQuery(recent,query).map(term=><Pressable key={term} accessibilityRole="button" accessibilityLabel={"Buscar de nuevo "+term} onPress={()=>void runSearch(term)}
    style={({pressed})=>({minHeight:46,borderRadius:11,flexDirection:"row",alignItems:"center",paddingHorizontal:12,gap:11,backgroundColor:pressed?colors.accent:colors.transparent})}>
    <Ionicons name="time-outline" size={18} color={colors.muted}/>
    <Text numberOfLines={1} style={{color:colors.ink,fontSize:14,flex:1}}>{term}</Text>
    <Ionicons name="arrow-up-outline" size={17} color={colors.muted}/>
   </Pressable>)}
  </View>}
  <ScrollView ref={filterScrollRef} horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="always"
   removeClippedSubviews={false} style={{flexGrow:0,height:62,minHeight:62}}
   onLayout={event=>{filterViewportWidth.current=event.nativeEvent.layout.width;requestAnimationFrame(()=>centerFilter(kind,false));}}
   onContentSizeChange={width=>{filterContentWidth.current=width;requestAnimationFrame(()=>centerFilter(kind,false));}}
   contentContainerStyle={{paddingHorizontal:16,paddingVertical:7,alignItems:"center",gap:9}}>
   {(["Todo","Profesionales","Personas","Empresas","Flashes","Streams"] as const).map(option=><Pressable key={option}
    accessibilityRole="button" accessibilityState={{selected:kind===option}}
    onLayout={event=>{filterPositions.current[option]={x:event.nativeEvent.layout.x,width:event.nativeEvent.layout.width};}}
    onPress={()=>{
     setKind(option);setShowRecent(false);setResults([]);setPeople([]);setAllAccounts([]);setSearched(false);setError("");
     centerFilter(option,true);
    }}
    style={{height:48,minHeight:48,flexShrink:0,alignItems:"center",justifyContent:"center",paddingHorizontal:17,
     borderRadius:24,backgroundColor:kind===option?colors.ink:colors.paper,
     borderWidth:1,borderColor:kind===option?colors.ink:colors.line}}>
    <Text numberOfLines={1} style={{fontSize:14,lineHeight:20,includeFontPadding:true,textAlignVertical:"center",
     color:kind===option?colors.paper:colors.ink,fontWeight:kind===option?"700":"500"}}>{option}</Text>
   </Pressable>)}
  </ScrollView>
  <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{padding:20,gap:16}}>
   {(effectiveKind==="Todo"||effectiveKind==="Profesionales"||effectiveKind==="Empresas"||effectiveKind==="Personas")?<>
    <Text style={s.h3}>{effectiveKind==="Todo"?"Busca en todas las cuentas de Jobeen":effectiveKind==="Personas"?"Encuentra personas por nombre, usuario o ciudad":effectiveKind==="Empresas"?"Encuentra empresas por sector, servicio y ciudad":"Encuentra profesionales por profesión, especialidad y ciudad"}</Text>
    <Text style={s.muted}>{effectiveKind==="Todo"?"Busca personas, profesionales y negocios por nombre, usuario, profesión o ciudad.":effectiveKind==="Personas"?"Usuarios que no han agregado ninguna profesión a su JCard. Pueden ver videos, streams y buscar profesionales.":"Describe lo que necesitas: «Técnico de aire acondicionado especializado en VRF en Miami»."}</Text>
    <TextInput accessibilityLabel="Ciudad" value={city} onChangeText={setCity} placeholder="Ciudad (opcional si la escribiste arriba)" placeholderTextColor={colors.muted} style={{minHeight:48,paddingHorizontal:14,borderWidth:1,borderColor:colors.line,borderRadius:12,color:colors.ink}}/>
    {effectiveKind!=="Personas"&&effectiveKind!=="Todo"&&<TextInput accessibilityLabel="Especialidad" value={specialty} onChangeText={setSpecialty} placeholder="Especialidad (opcional, ej. VRF)" placeholderTextColor={colors.muted} style={{minHeight:48,paddingHorizontal:14,borderWidth:1,borderColor:colors.line,borderRadius:12,color:colors.ink}}/>}
    <Pressable accessibilityRole="button" onPress={()=>void runSearch()} disabled={loading} style={{padding:15,borderRadius:14,backgroundColor:colors.ink,alignItems:"center"}}>
     <Text style={{color:colors.paper,fontWeight:"700"}}>{loading?"Buscando…":effectiveKind==="Todo"?"Buscar en todo":effectiveKind==="Personas"?"Buscar personas":effectiveKind==="Empresas"?"Buscar empresas":"Buscar profesionales"}</Text>
    </Pressable>
    {effectiveKind!=="Personas"&&effectiveKind!=="Todo"&&<Text style={s.muted}>Primero coincidencia con tu búsqueda; después credenciales y reconocimientos verificados. Las cuentas personales no tienen puntuación por estrellas.</Text>}
    {loading&&<ActivityIndicator color={colors.ink}/>}
    {!!error&&<Text style={{color:colors.ink}}>{error}</Text>}
    {searched&&!loading&&!error&&<Text style={s.muted}>{effectiveKind==="Todo"?allAccounts.length:effectiveKind==="Personas"?people.length:displayedResults.length} resultados encontrados</Text>}
    {effectiveKind==="Todo"&&allAccounts.map(account=><Pressable key={account.id} accessibilityRole="button" accessibilityLabel={"Ver perfil de "+account.name} onPress={()=>void openProfile(account.id)} style={{flexDirection:"row",alignItems:"center",paddingVertical:12,gap:12,borderBottomWidth:1,borderBottomColor:colors.line}}>
      <PublicProfileAvatar userId={account.id} name={account.name} size={54}/>
      <View style={{flex:1,gap:3}}><Text style={{color:colors.ink,fontSize:16,fontWeight:"700"}} numberOfLines={1}>{account.name}</Text><Text style={s.muted} numberOfLines={1}>@{account.handle||"usuario"} · {account.account_type==="company"?"Empresa":account.account_type==="professional"?"Profesional":"Persona"}</Text>{!!account.profession&&<Text style={s.muted} numberOfLines={1}>{account.profession}</Text>}</View>
      <Text style={{fontSize:22,color:colors.muted}}>›</Text>
    </Pressable>)}
    {effectiveKind==="Personas"&&people.map(person=><Pressable key={person.id} accessibilityRole="button" accessibilityLabel={"Ver perfil de "+person.name} onPress={()=>void openProfile(person.id)} style={{flexDirection:"row",alignItems:"center",paddingVertical:12,gap:12,borderBottomWidth:1,borderBottomColor:colors.line}}>
      <PublicProfileAvatar userId={person.id} name={person.name} size={54}/><View style={{flex:1,gap:3}}><Text style={{color:colors.ink,fontSize:16,fontWeight:"700"}} numberOfLines={1}>{person.name}</Text><Text style={s.muted} numberOfLines={1}>@{person.handle||"usuario"} · Persona</Text></View><Text style={{fontSize:22,color:colors.muted}}>›</Text>
    </Pressable>)}
    {effectiveKind!=="Personas"&&effectiveKind!=="Todo"&&displayedResults.map(person=><Pressable key={person.id+":"+person.profession_code} accessibilityRole="button" accessibilityLabel={"Ver perfil de "+person.name} onPress={()=>void openProfile(person.id)} style={{flexDirection:"row",alignItems:"center",paddingVertical:12,gap:12,borderBottomWidth:1,borderBottomColor:colors.line}}>
      <PublicProfileAvatar userId={person.id} name={person.name} size={54}/><View style={{flex:1,gap:3}}><Text style={{color:colors.ink,fontSize:16,fontWeight:"700"}} numberOfLines={1}>{person.name}</Text><Text style={s.muted} numberOfLines={1}>@{person.handle||"usuario"}</Text><Text style={s.muted} numberOfLines={1}>{person.profession}</Text></View><Text style={{fontSize:22,color:colors.muted}}>›</Text>
    </Pressable>)}
    {searched&&!loading&&!error&&(effectiveKind==="Todo"?allAccounts.length===0:effectiveKind==="Personas"?people.length===0:displayedResults.length===0)&&<Text style={s.text}>No encontramos perfiles que coincidan. Prueba otra ciudad o una especialidad más amplia.</Text>}
   </>:effectiveKind==="Flashes"?<>
    <Text style={s.muted}>{query?"Resultados de Flashes":"Explorar Flashes"}</Text>
    {posts.map(post=><Pressable key={post.postId} accessibilityRole="button" onPress={()=>router.replace({pathname:"/videos",params:{post:post.postId}})} style={{flexDirection:"row",gap:14,alignItems:"center",paddingVertical:12,borderBottomWidth:1,borderBottomColor:colors.line}}>
     <Avatar uri={post.avatar} name={post.author}/><View style={{flex:1,gap:5}}><Text style={s.h3}>@{post.handle}</Text><Text style={s.muted} numberOfLines={2}>{post.caption}</Text></View>
    </Pressable>)}
   </>:<>
    <Text style={s.muted}>{query?"Resultados de Streams de demostración":"Explorar Streams de demostración"}</Text>
    {streams.map(room=><Pressable key={room.id} accessibilityRole="button" onPress={()=>router.replace({pathname:"/stream/[id]",params:{id:room.id}})} style={{flexDirection:"row",gap:14,alignItems:"center",paddingVertical:12,borderBottomWidth:1,borderBottomColor:colors.line}}>
     <Avatar uri={room.avatar} name={room.host}/><View style={{flex:1,gap:5}}><Text style={s.h3}>{room.title}</Text><Text style={s.muted}>{room.host} · {room.city} · Demo room</Text></View>
    </Pressable>)}
   </>}
  </ScrollView>
 </SafeAreaView>;
}
