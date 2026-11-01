import {useState} from "react";
import {ActivityIndicator,Pressable,ScrollView,Text,TextInput,View} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";
import {router,useLocalSearchParams} from "expo-router";
import {Avatar,IconButton} from "../components/social-ui";
import {Chips,useUi} from "../components/ui";
import {visiblePosts} from "../lib/feed";
import {browseStreams} from "../lib/streams";
import {findProfessionals,type ProfessionalSearchResult} from "../lib/professional-api";

type SearchKind="Profesionales"|"Videos"|"Live";
export default function Search(){
 const {mode}=useLocalSearchParams<{mode?:string}>();
 const {s,colors}=useUi();
 const [query,setQuery]=useState("");
 const [city,setCity]=useState("");
 const [specialty,setSpecialty]=useState("");
 const [kind,setKind]=useState<SearchKind>(mode==="live"?"Live":"Profesionales");
 const [results,setResults]=useState<ProfessionalSearchResult[]>([]);
 const [loading,setLoading]=useState(false);
 const [error,setError]=useState("");
 const [searched,setSearched]=useState(false);
 const posts=visiblePosts("Para ti",[],query),streams=browseStreams("Popular","Todas",query);
 async function runSearch(){
  if(!query.trim()&&!city.trim()&&!specialty.trim()){setError("Escribe qué profesional buscas o indica una ciudad.");return;}
  setLoading(true);setError("");setSearched(true);
  try{setResults(await findProfessionals(query,city,"",specialty));}
  catch(e){setResults([]);setError(e instanceof Error?e.message:"No se pudo buscar profesionales.");}
  finally{setLoading(false);}
 }
 return <SafeAreaView style={s.screen}>
  <View style={{flexDirection:"row",alignItems:"center",padding:12,gap:6}}>
   <IconButton icon="arrow-back" label="Volver" onPress={()=>router.canGoBack()?router.back():router.replace("/")}/>
   <TextInput accessibilityLabel="Buscar en Jobin" placeholder="Ej. Técnico HVAC VRF en Miami" placeholderTextColor={colors.muted} value={query} onChangeText={setQuery} onSubmitEditing={()=>{if(kind==="Profesionales")void runSearch();}} returnKeyType="search" style={{flex:1,minHeight:46,borderRadius:24,backgroundColor:colors.accent,paddingHorizontal:18,color:colors.ink}}/>
   {!!query&&<IconButton icon="close" label="Borrar búsqueda" onPress={()=>{setQuery("");setResults([]);setSearched(false);}}/>}
  </View>
  <View style={{paddingHorizontal:16,paddingBottom:12}}>
   <Chips values={["Profesionales","Videos","Live"] as const} value={kind} onChange={setKind} label="Tipo de búsqueda"/>
  </View>
  <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{padding:20,gap:16}}>
   {kind==="Profesionales"?<>
    <Text style={s.h3}>Encuentra profesionales por profesión, especialidad y ciudad</Text>
    <Text style={s.muted}>Describe lo que necesitas: «Técnico de aire acondicionado especializado en VRF en Miami».</Text>
    <TextInput accessibilityLabel="Ciudad" value={city} onChangeText={setCity} placeholder="Ciudad (opcional si la escribiste arriba)" placeholderTextColor={colors.muted} style={{minHeight:48,paddingHorizontal:14,borderWidth:1,borderColor:colors.line,borderRadius:12,color:colors.ink}}/>
    <TextInput accessibilityLabel="Especialidad" value={specialty} onChangeText={setSpecialty} placeholder="Especialidad (opcional, ej. VRF)" placeholderTextColor={colors.muted} style={{minHeight:48,paddingHorizontal:14,borderWidth:1,borderColor:colors.line,borderRadius:12,color:colors.ink}}/>
    <Pressable accessibilityRole="button" onPress={()=>void runSearch()} disabled={loading} style={{padding:15,borderRadius:14,backgroundColor:colors.ink,alignItems:"center"}}>
     <Text style={{color:colors.paper,fontWeight:"700"}}>{loading?"Buscando…":"Buscar profesionales"}</Text>
    </Pressable>
    <Text style={s.muted}>Primero coincidencia con tu búsqueda; después credenciales y reconocimientos verificados. Las cuentas personales no tienen puntuación por estrellas.</Text>
    {loading&&<ActivityIndicator color={colors.ink}/>}
    {!!error&&<Text style={{color:"#b42318"}}>{error}</Text>}
    {searched&&!loading&&!error&&<Text style={s.muted}>{results.length} resultados encontrados</Text>}
    {results.map(person=><Pressable key={person.id+":"+person.profession_code} accessibilityRole="button" onPress={()=>router.push({pathname:"/jcard",params:{user:person.id}})} style={{padding:14,borderWidth:1,borderColor:colors.line,borderRadius:16,gap:5}}>
     <Text style={s.h3}>{person.name}</Text>
     <Text style={s.text}>{person.profession}</Text>
     <Text style={s.muted}>{[person.city,person.region].filter(Boolean).join(", ")||"Ubicación no especificada"}</Text>
     {!!person.specialties?.length&&<Text style={s.muted} numberOfLines={2}>Especialidades: {person.specialties.join(" · ")}</Text>}
     {person.verified&&<Text style={s.text}>✓ Profesión verificada</Text>}
     {person.verified_seals>0&&<Text style={s.muted}>{person.verified_seals} reconocimiento(s) profesional(es) vigente(s)</Text>}
     {person.account_type==="company"&&person.business_reviews>0&&<Text style={s.muted}>Empresa: {person.business_rating.toFixed(1)}/5 ({person.business_reviews} reseñas)</Text>}
     <Text style={s.muted}>Ver JCard →</Text>
    </Pressable>)}
    {searched&&!loading&&!error&&results.length===0&&<Text style={s.text}>No encontramos perfiles que coincidan. Prueba otra ciudad o una especialidad más amplia.</Text>}
   </>:kind==="Videos"?<>
    <Text style={s.muted}>{query?"Resultados de videos":"Explorar videos de demostración"}</Text>
    {posts.map(post=><Pressable key={post.postId} accessibilityRole="button" onPress={()=>router.replace({pathname:"/",params:{post:post.postId}})} style={{flexDirection:"row",gap:14,alignItems:"center",paddingVertical:12,borderBottomWidth:1,borderBottomColor:colors.line}}>
     <Avatar uri={post.avatar} name={post.author}/><View style={{flex:1,gap:5}}><Text style={s.h3}>@{post.handle}</Text><Text style={s.muted} numberOfLines={2}>{post.caption}</Text></View>
    </Pressable>)}
   </>:<>
    <Text style={s.muted}>{query?"Resultados de transmisiones":"Explorar transmisiones de demostración"}</Text>
    {streams.map(room=><Pressable key={room.id} accessibilityRole="button" onPress={()=>router.replace({pathname:"/stream/[id]",params:{id:room.id}})} style={{flexDirection:"row",gap:14,alignItems:"center",paddingVertical:12,borderBottomWidth:1,borderBottomColor:colors.line}}>
     <Avatar uri={room.avatar} name={room.host}/><View style={{flex:1,gap:5}}><Text style={s.h3}>{room.title}</Text><Text style={s.muted}>{room.host} · {room.city} · Demo room</Text></View>
    </Pressable>)}
   </>}
  </ScrollView>
 </SafeAreaView>;
}
