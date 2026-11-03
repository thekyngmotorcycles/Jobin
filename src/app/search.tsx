import {useState} from "react";
import {ActivityIndicator,Pressable,ScrollView,Text,TextInput,View} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";
import {router,useLocalSearchParams} from "expo-router";
import {Avatar,IconButton} from "../components/social-ui";
import {Chips,useUi} from "../components/ui";
import {visiblePosts} from "../lib/feed";
import {browseStreams} from "../lib/streams";
import {interpretJobinSearch,matchJobinTerms} from "../lib/jobin-search";
import {findProfessionals,loadCatalog,loadSpecialtyCatalog,type ProfessionalSearchResult} from "../lib/professional-api";
import {useProfessionalData} from "../state/useProfessionalData";

type SearchKind="Profesionales"|"Empresas"|"Flashes"|"Streams";
export default function Search(){
 const {mode}=useLocalSearchParams<{mode?:string}>();
 const {s,colors}=useUi();
 const catalog=useProfessionalData(loadCatalog);
 const specialtyCatalog=useProfessionalData(loadSpecialtyCatalog);
 const [query,setQuery]=useState("");
 const [city,setCity]=useState("");
 const [specialty,setSpecialty]=useState("");
 const [kind,setKind]=useState<SearchKind>(mode==="live"?"Streams":"Profesionales");
 const [filtersOpen,setFiltersOpen]=useState(false);
 const [filterChosen,setFilterChosen]=useState(false);
 const [results,setResults]=useState<ProfessionalSearchResult[]>([]);
 const [loading,setLoading]=useState(false);
 const [error,setError]=useState("");
 const [searched,setSearched]=useState(false);
 const intent=interpretJobinSearch(query,["Miami","Miami Beach","Orlando","Fort Lauderdale","New York","Los Angeles","Chicago","Houston","Dallas","Tampa","Buenos Aires","Ciudad de México","Lima","Bogotá","Medellín","Santiago","Madrid","Barcelona"],catalog.data,specialtyCatalog.data??undefined);
 const words=intent.terms;
 const posts=visiblePosts("Para ti",[],query);
 const streams=browseStreams("Popular","Todas","").filter(room=>(!intent.city||room.city.toLowerCase()===intent.city.toLowerCase())&&matchJobinTerms([room.title,room.host,room.city,room.profession].join(" "),words));
 const effectiveKind=filterChosen?kind:(intent.target??kind);
 const displayedResults=results.filter(person=>effectiveKind==="Empresas"?person.account_type==="company":person.account_type==="personal");
 async function runSearch(){
  if(!query.trim()&&!city.trim()&&!specialty.trim()){setError("Escribe qué profesional buscas o indica una ciudad.");return;}
  setLoading(true);setError("");setSearched(true);
  try{setResults(await findProfessionals(query,city||intent.city,intent.professionCode,specialty||intent.specialty));}
  catch(e){setResults([]);setError(e instanceof Error?e.message:"No se pudo buscar profesionales.");}
  finally{setLoading(false);}
 }
 return <SafeAreaView style={s.screen}>
  <View style={{flexDirection:"row",alignItems:"center",padding:12,gap:6}}>
   <IconButton icon="arrow-back" label="Volver" onPress={()=>router.canGoBack()?router.back():router.replace("/")}/>
   <TextInput accessibilityLabel="Buscar en Jobin" placeholder="Ej. electricista en vivo en Miami" placeholderTextColor={colors.muted} value={query} onChangeText={setQuery} onSubmitEditing={()=>{if(effectiveKind==="Profesionales"||effectiveKind==="Empresas")void runSearch();}} returnKeyType="search" style={{flex:1,minHeight:46,borderRadius:24,backgroundColor:colors.accent,paddingHorizontal:18,color:colors.ink}}/>
   {!!query&&<IconButton icon="close" label="Borrar búsqueda" onPress={()=>{setQuery("");setResults([]);setSearched(false);}}/>}
  </View>
  <View style={{paddingHorizontal:16,paddingBottom:12}}>
   {!!query.trim()&&(intent.target||intent.professionCode||intent.specialty)&&<Text style={[s.muted,{paddingTop:6}]}>Detectado: {[!filterChosen?intent.target:null,intent.profession,intent.specialty,intent.city].filter(Boolean).join(" · ")}</Text>}
   <Pressable accessibilityRole="button" accessibilityState={{expanded:filtersOpen}} onPress={()=>setFiltersOpen(v=>!v)} style={{flexDirection:"row",alignItems:"center",padding:10,borderRadius:12,borderWidth:1,borderColor:colors.line}}><Text style={{color:colors.ink,flex:1}}>Buscar en: {effectiveKind} (opcional)</Text><Text style={{color:colors.ink}}>{filtersOpen?"▲":"▼"}</Text></Pressable>
   {filtersOpen&&<Chips values={["Profesionales","Empresas","Flashes","Streams"] as const} value={kind} onChange={v=>{setKind(v);setFilterChosen(true);setResults([]);setSearched(false);setError("");setFiltersOpen(false);}} label="Tipo de búsqueda"/>}
  </View>
  <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{padding:20,gap:16}}>
   {(kind==="Profesionales"||effectiveKind==="Empresas")?<>
    <Text style={s.h3}>{effectiveKind==="Empresas"?"Encuentra empresas por sector, servicio y ciudad":"Encuentra profesionales por profesión, especialidad y ciudad"}</Text>
    <Text style={s.muted}>Describe lo que necesitas: «Técnico de aire acondicionado especializado en VRF en Miami».</Text>
    <TextInput accessibilityLabel="Ciudad" value={city} onChangeText={setCity} placeholder="Ciudad (opcional si la escribiste arriba)" placeholderTextColor={colors.muted} style={{minHeight:48,paddingHorizontal:14,borderWidth:1,borderColor:colors.line,borderRadius:12,color:colors.ink}}/>
    <TextInput accessibilityLabel="Especialidad" value={specialty} onChangeText={setSpecialty} placeholder="Especialidad (opcional, ej. VRF)" placeholderTextColor={colors.muted} style={{minHeight:48,paddingHorizontal:14,borderWidth:1,borderColor:colors.line,borderRadius:12,color:colors.ink}}/>
    <Pressable accessibilityRole="button" onPress={()=>void runSearch()} disabled={loading} style={{padding:15,borderRadius:14,backgroundColor:colors.ink,alignItems:"center"}}>
     <Text style={{color:colors.paper,fontWeight:"700"}}>{loading?"Buscando…":kind==="Empresas"?"Buscar empresas":"Buscar profesionales"}</Text>
    </Pressable>
    <Text style={s.muted}>Primero coincidencia con tu búsqueda; después credenciales y reconocimientos verificados. Las cuentas personales no tienen puntuación por estrellas.</Text>
    {loading&&<ActivityIndicator color={colors.ink}/>}
    {!!error&&<Text style={{color:colors.ink}}>{error}</Text>}
    {searched&&!loading&&!error&&<Text style={s.muted}>{displayedResults.length} resultados encontrados</Text>}
    {displayedResults.map(person=><Pressable key={person.id+":"+person.profession_code} accessibilityRole="button" onPress={()=>router.push({pathname:"/jcard",params:{user:person.id}})} style={{padding:14,borderWidth:1,borderColor:colors.line,borderRadius:16,gap:5}}>
     <Text style={s.h3}>{person.name}</Text>
     <Text style={s.text}>{person.profession}</Text>
     <Text style={s.muted}>{[person.city,person.region].filter(Boolean).join(", ")||"Ubicación no especificada"}</Text>
     {!!person.specialties?.length&&<Text style={s.muted} numberOfLines={2}>Especialidades: {person.specialties.join(" · ")}</Text>}
     {person.verified&&<Text style={s.text}>✓ Profesión verificada</Text>}
     {person.verified_seals>0&&<Text style={s.muted}>{person.verified_seals} reconocimiento(s) profesional(es) vigente(s)</Text>}
     {person.account_type==="company"&&person.business_reviews>0&&<Text style={s.muted}>Empresa: {person.business_rating.toFixed(1)}/5 ({person.business_reviews} reseñas)</Text>}
     <Text style={s.muted}>Ver JCard →</Text>
    </Pressable>)}
    {searched&&!loading&&!error&&displayedResults.length===0&&<Text style={s.text}>No encontramos perfiles que coincidan. Prueba otra ciudad o una especialidad más amplia.</Text>}
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
