import {useRef,useState} from "react";
import {ActivityIndicator,Pressable,ScrollView,Text,TextInput,View} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";
import {router,useLocalSearchParams} from "expo-router";
import {Avatar,IconButton} from "../components/social-ui";
import {useUi} from "../components/ui";
import {visiblePosts} from "../lib/feed";
import {browseStreams} from "../lib/streams";
import {interpretJobinSearch,matchJobinTerms} from "../lib/jobin-search";
import {findAllAccounts,findProfessionals,findPeople,loadCatalog,loadSpecialtyCatalog,type ProfessionalSearchResult,type PersonSearchResult,type AllAccountSearchResult} from "../lib/professional-api";
import {useProfessionalData} from "../state/useProfessionalData";

type SearchKind="Todo"|"Profesionales"|"Personas"|"Empresas"|"Flashes"|"Streams";
export default function Search(){
 const {mode}=useLocalSearchParams<{mode?:string}>();
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
 const [kind,setKind]=useState<SearchKind>(mode==="live"?"Streams":"Todo");
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
 async function runSearch(){
  if(!query.trim()&&!city.trim()&&!specialty.trim()&&effectiveKind!=="Personas"&&effectiveKind!=="Todo"){setError("Escribe qué profesional buscas o indica una ciudad.");return;}
  setLoading(true);setError("");setSearched(true);
  try{if(effectiveKind==="Todo"){setAllAccounts(await findAllAccounts(query,city||intent.city));setResults([]);setPeople([]);}else if(effectiveKind==="Personas"){setPeople(await findPeople(query,city||intent.city));setResults([]);}else{setResults(await findProfessionals(query,city||intent.city,intent.professionCode,specialty||intent.specialty));setPeople([]);}}
  catch(e){setResults([]);setPeople([]);setAllAccounts([]);setError(e instanceof Error?e.message:"No se pudo buscar profesionales.");}
  finally{setLoading(false);}
 }
 return <SafeAreaView style={s.screen}>
  <View style={{flexDirection:"row",alignItems:"center",padding:12,gap:6}}>
   <IconButton icon="arrow-back" label="Volver" onPress={()=>router.canGoBack()?router.back():router.replace("/")}/>
   <TextInput accessibilityLabel="Buscar en Jobin" placeholder="Ej. electricista en vivo en Miami" placeholderTextColor={colors.muted} value={query} onChangeText={setQuery} onSubmitEditing={()=>{if(effectiveKind==="Todo"||effectiveKind==="Profesionales"||effectiveKind==="Empresas"||effectiveKind==="Personas")void runSearch();}} returnKeyType="search" style={{flex:1,minHeight:46,borderRadius:24,backgroundColor:colors.accent,paddingHorizontal:18,color:colors.ink}}/>
   {!!query&&<IconButton icon="close" label="Borrar búsqueda" onPress={()=>{setQuery("");setResults([]);setPeople([]);setAllAccounts([]);setSearched(false);}}/>}
  </View>
  <ScrollView ref={filterScrollRef} horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="always" removeClippedSubviews={false} style={{flexGrow:0,overflow:"visible"}} onLayout={event=>{filterViewportWidth.current=event.nativeEvent.layout.width;}} onContentSizeChange={width=>{filterContentWidth.current=width;}} contentContainerStyle={{paddingHorizontal:16,paddingVertical:8,alignItems:"center",gap:8}}>
   {(["Todo","Profesionales","Personas","Empresas","Flashes","Streams"] as const).map(option=><Pressable key={option} accessibilityRole="button" accessibilityState={{selected:kind===option}} onLayout={event=>{filterPositions.current[option]={x:event.nativeEvent.layout.x,width:event.nativeEvent.layout.width};}} onPress={()=>{setKind(option);setResults([]);setPeople([]);setAllAccounts([]);setSearched(false);setError("");const position=filterPositions.current[option];if(position){const viewport=filterViewportWidth.current;const maxScroll=Math.max(0,filterContentWidth.current-viewport);const centered=position.x+position.width/2-viewport/2;filterScrollRef.current?.scrollTo({x:Math.max(0,Math.min(centered,maxScroll)),animated:true});}}} style={{paddingHorizontal:16,paddingVertical:10,borderRadius:24,overflow:"visible",backgroundColor:kind===option?colors.ink:colors.paper,borderWidth:1,borderColor:kind===option?colors.ink:colors.line}}>
    <Text includeFontPadding style={{color:kind===option?colors.paper:colors.ink,fontWeight:kind===option?"700":"500",textAlignVertical:"center"}}>{option}</Text>
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
    {effectiveKind==="Todo"&&allAccounts.map(account=><Pressable key={account.id} accessibilityRole="button" onPress={()=>router.push({pathname:"/jcard",params:{user:account.id}})} style={{padding:14,borderWidth:1,borderColor:colors.line,borderRadius:16,gap:5}}><Text style={s.h3}>{account.name}</Text><Text style={s.muted}>@{account.handle||"usuario"} · {account.account_type==="company"?"Empresa":account.account_type==="professional"?"Profesional":"Persona"}</Text>{!!account.profession&&<Text style={s.text}>{account.profession}</Text>}<Text style={s.muted}>{[account.city,account.region].filter(Boolean).join(", ")||"Ubicación no especificada"}</Text><Text style={s.muted}>Ver JCard →</Text></Pressable>)}
    {effectiveKind==="Personas"&&people.map(person=><Pressable key={person.id} accessibilityRole="button" onPress={()=>router.push({pathname:"/jcard",params:{user:person.id}})} style={{padding:14,borderWidth:1,borderColor:colors.line,borderRadius:16,gap:5}}><Text style={s.h3}>{person.name}</Text><Text style={s.muted}>@{person.handle||"usuario"} · Persona</Text><Text style={s.muted}>{[person.city,person.region].filter(Boolean).join(", ")||"Ubicación no especificada"}</Text><Text style={s.muted}>Ver JCard →</Text></Pressable>)}
    {effectiveKind!=="Personas"&&effectiveKind!=="Todo"&&displayedResults.map(person=><Pressable key={person.id+":"+person.profession_code} accessibilityRole="button" onPress={()=>router.push({pathname:"/jcard",params:{user:person.id}})} style={{padding:14,borderWidth:1,borderColor:colors.line,borderRadius:16,gap:5}}>
     <Text style={s.h3}>{person.name}</Text>
     <Text style={s.text}>{person.profession}</Text>
     <Text style={s.muted}>{[person.city,person.region].filter(Boolean).join(", ")||"Ubicación no especificada"}</Text>
     {!!person.specialties?.length&&<Text style={s.muted} numberOfLines={2}>Especialidades: {person.specialties.join(" · ")}</Text>}
     {person.verified&&<Text style={s.text}>✓ Profesión verificada</Text>}
     {person.verified_seals>0&&<Text style={s.muted}>{person.verified_seals} reconocimiento(s) profesional(es) vigente(s)</Text>}
     {person.account_type==="company"&&person.business_reviews>0&&<Text style={s.muted}>Empresa: {person.business_rating.toFixed(1)}/5 ({person.business_reviews} reseñas)</Text>}
     <Text style={s.muted}>Ver JCard →</Text>
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
