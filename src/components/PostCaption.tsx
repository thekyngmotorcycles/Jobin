import {useState} from "react";
import {router} from "expo-router";
import {Pressable,Text,View} from "react-native";
import * as Linking from "expo-linking";
import {BottomSheet} from "./social-ui";
import {useUi} from "./ui";

/** Shared single-line caption used by demo and real Home publications. */
export function PostCaption({text,mentions=[]}:{text:string;mentions?:{id:string;label:string}[]}){
 const [expanded,setExpanded]=useState(false);
 const {s,colors}=useUi();
 const link=text.match(/https?:\/\/[^\s]+/i)?.[0];
 if(!text.trim())return null;
 return <View>
  <Pressable accessibilityRole="button" accessibilityLabel={"Ver descripción completa: "+text}
   accessibilityState={{expanded}} onPress={()=>setExpanded(true)}
   style={{minHeight:36,justifyContent:"center",paddingHorizontal:16}}>
   <Text style={s.text} numberOfLines={1} ellipsizeMode="tail">{text}</Text>
  </Pressable>
  <BottomSheet visible={expanded} onClose={()=>setExpanded(false)} title="Descripción">
   <Text selectable style={[s.text,{color:colors.ink,paddingVertical:12}]}>{text}</Text>
   {!!mentions.length&&<View style={{gap:5,paddingVertical:8}}>
    <Text style={[s.text,{fontWeight:"700"}]}>Profesionales y empresas etiquetados</Text>
    {mentions.map(mention=><Pressable key={mention.id} accessibilityRole="link"
     accessibilityLabel={"Ver perfil de "+mention.label}
     onPress={()=>{setExpanded(false);router.push({pathname:"/jcard",params:{user:mention.id}});}}
     style={{minHeight:40,justifyContent:"center"}}>
     <Text style={[s.text,{textDecorationLine:"underline",color:colors.ink}]}>{mention.label}</Text>
    </Pressable>)}
   </View>}
   {!!link&&<Pressable accessibilityRole="link" accessibilityLabel="Abrir enlace de la descripción" onPress={()=>void Linking.openURL(link)} style={{paddingVertical:12,minHeight:44}}><Text style={[s.text,{color:colors.ink,textDecorationLine:"underline"}]}>{link}</Text></Pressable>}
  </BottomSheet>
 </View>;
}
