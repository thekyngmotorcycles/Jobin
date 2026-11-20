import {Ionicons} from "@expo/vector-icons";
import {Text,View} from "react-native";
import {useTheme} from "../state/ThemeProvider";
import {jobeenTokens} from "../theme/jobeen";

/**
 * Phase 1: private owner-only JCard collection layout.
 *
 * Saving cards, favorites, live synchronization and notifications are separate
 * approved phases. Until persistence exists, do not render fictional cards,
 * pretend a card has been saved or expose this collection on public profiles.
 */
export function SavedJCardsGallery(){
 const {theme}=useTheme();
 const colors=jobeenTokens(theme);
 return <View style={{gap:16}}>
  <View style={{gap:4}}>
   <Text accessibilityRole="header" style={{color:colors.ink,fontSize:20,fontWeight:"800"}}>Mis JCards</Text>
   <Text style={{color:colors.ink2,fontSize:13,lineHeight:19}}>Tu colección privada de negocios y contactos profesionales.</Text>
  </View>
  <View style={{borderRadius:20,borderWidth:1,borderColor:colors.line,backgroundColor:colors.surface,paddingHorizontal:20,paddingVertical:30,alignItems:"center",gap:10}}>
   <View style={{width:68,height:68,borderRadius:21,backgroundColor:colors.cream,alignItems:"center",justifyContent:"center"}}>
    <Ionicons name="albums-outline" size={32} color={colors.ink}/>
   </View>
   <Text style={{fontSize:16,fontWeight:"700",textAlign:"center",color:colors.ink}}>Todavía no guardaste ninguna JCard</Text>
   <Text style={{fontSize:13,lineHeight:20,textAlign:"center",color:colors.ink2}}>
    Aquí podrás consultar las tarjetas de tus negocios favoritos sin volver a buscarlos.
   </Text>
  </View>
  <Text style={{fontSize:12,lineHeight:18,color:colors.ink2,textAlign:"center"}}>
   El guardado de tarjetas y las notificaciones de cambios se habilitarán en las siguientes etapas.
  </Text>
 </View>;
}
