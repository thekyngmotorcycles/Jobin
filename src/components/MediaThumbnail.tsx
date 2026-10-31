import { useEffect,useState } from "react";
import { Image,StyleSheet,Text,View,type StyleProp,type ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../state/ThemeProvider";
export function MediaThumbnail({uri,label,style}:{uri?:string;label:string;style?:StyleProp<ViewStyle>}){
 const {colors}=useTheme();const [loaded,setLoaded]=useState(false);const [failed,setFailed]=useState(false);
 useEffect(()=>{setLoaded(false);setFailed(false);},[uri]);
 return <View style={[{flex:1,overflow:"hidden",backgroundColor:colors.accent},style]}>
  {(!loaded||failed||!uri)&&<View testID="profile-thumbnail-placeholder" accessible accessibilityLabel={"Vista previa: "+label} style={[StyleSheet.absoluteFill,{justifyContent:"center",alignItems:"center",padding:8,gap:6}]}>
   <Ionicons name="image-outline" size={25} color={colors.muted}/><Text style={{fontSize:10,color:colors.muted,textAlign:"center"}}>Video profesional</Text>
  </View>}
  {!!uri&&!failed&&<Image source={{uri}} accessibilityLabel={label} onLoad={()=>setLoaded(true)} onError={()=>setFailed(true)} style={[StyleSheet.absoluteFill,{opacity:loaded?1:0}]}/>}
 </View>;
}
