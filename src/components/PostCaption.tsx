import {useState} from "react";
import {Pressable,Text,View} from "react-native";
import * as Linking from "expo-linking";
import {BottomSheet} from "./social-ui";
import {useUi} from "./ui";

/** Shared single-line caption used by demo and real Home publications. */
export function PostCaption({text}:{text:string}){
 const [expanded,setExpanded]=useState(false);
 const {s,colors}=useUi();
 const link=text.match(/https?:\\/\\/[^\\s]+/i)?.[0];
 if(!text.trim())return null;
 return <View>
  <Pressable accessibilityRole="button" accessibilityLabel={"Ver descripción completa: "+text}
   accessibilityState={{expanded}} onPress={()=>setExpanded(true)}
   style={{minHeight:36,justifyContent:"center",paddingHorizontal:16}}>
   <Text style={s.text} numberOfLines={1} ellipsizeMode="tail">{text}</Text>
  </Pressable>
  <BottomSheet visible={expanded} onClose={()=>setExpanded(false)} title="Descripción">
   <Text selectable style={[s.text,{color:colors.ink,paddingVertical:12}]}>{text}</Text>
   {!!link&&<Pressable accessibilityRole="link" accessibilityLabel="Abrir enlace de la descripción" onPress={()=>void Linking.openURL(link)} style={{paddingVertical:12,minHeight:44}}><Text style={[s.text,{color:colors.ink,textDecorationLine:"underline"}]}>{link}</Text></Pressable>}
  </BottomSheet>
 </View>;
}
