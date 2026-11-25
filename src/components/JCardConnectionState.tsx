import {Pressable,Text,View} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {useTheme} from "../state/ThemeProvider";
import {jobeenTokens} from "../theme/jobeen";
import {JobinLoadingGears} from "./JobinLoadingGears";
import {JCardLoadingSkeleton} from "./JCardLoadingSkeleton";
import {ProfessionalStatus} from "./ProfessionalStatus";
import {NAVIGATION_ROW_HEIGHT} from "../theme/navigation";

/** A failed request is not necessarily an offline phone; avoid false claims. */
export function isJCardConnectivityError(message:string){
 return /network|failed to fetch|fetch failed|offline|internet|connection|timed?\s*out|timeout|network request failed/i.test(message);
}

export function JCardOfflineNotice({retry,cached=false}:{retry:()=>void;cached?:boolean}){
 const {theme}=useTheme(),t=jobeenTokens(theme);
 return <View accessibilityRole="alert" style={{width:"100%",gap:11,alignItems:"center",
  paddingHorizontal:15,paddingVertical:17,borderRadius:19,borderWidth:1,borderColor:t.line,backgroundColor:t.surface}}>
  <JobinLoadingGears mode="offline" size={36}/>
  <View style={{gap:4,alignItems:"center"}}>
   <Text style={{color:t.ink,fontSize:14,fontWeight:"800",textAlign:"center"}}>
    {cached?"Mostrando la última JCard guardada":"No se pudo conectar con Jobeen"}
   </Text>
   <Text style={{color:t.ink2,fontSize:12,lineHeight:18,textAlign:"center"}}>
    {cached?"No pudimos actualizar tus datos. Comprueba la conexión.":"Revisa tu conexión a internet e inténtalo de nuevo."}
   </Text>
  </View>
  <Pressable accessibilityRole="button" accessibilityLabel="Reintentar carga de JCard"
   onPress={retry} style={{minHeight:44,paddingHorizontal:19,borderRadius:14,alignItems:"center",
    justifyContent:"center",backgroundColor:t.cream,borderWidth:1,borderColor:t.line,
    flexDirection:"row",gap:8}}>
   <Ionicons name="refresh-outline" color={t.ink} size={18}/>
   <Text style={{fontSize:13,color:t.ink,fontWeight:"700"}}>Reintentar</Text>
  </Pressable>
 </View>;
}

export function JCardLoadState({loading,error,retry,profileInset}:{loading:boolean;error:string;retry:()=>void;profileInset:number}){
 if(loading)return <JCardLoadingSkeleton profileInset={profileInset}/>;
 return <View style={{paddingHorizontal:profileInset,paddingTop:NAVIGATION_ROW_HEIGHT+12}}>
  {error&&isJCardConnectivityError(error)?<JCardOfflineNotice retry={retry}/>:<ProfessionalStatus loading={false} error={error} retry={retry}/>}
 </View>;
}
