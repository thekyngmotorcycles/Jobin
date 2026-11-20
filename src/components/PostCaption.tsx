import {useState} from "react";
import {router} from "expo-router";
import {Pressable,Text,View} from "react-native";
import * as Linking from "expo-linking";
import {BottomSheet} from "./social-ui";
import {useUi} from "./ui";

type CaptionMention={id:string;label:string;card?:"personal"|"business"};
type CaptionPiece={value:string;mention?:CaptionMention};

/** Match the exact mention text chosen by the author, not the current company name.
 * The business target remains stable if the company renames its JCard. */
export function captionPieces(text:string,mentions:CaptionMention[]):CaptionPiece[]{
 const choices=mentions.filter(m=>m.label&&text.includes(m.label)).sort((a,b)=>b.label.length-a.label.length);
 if(!choices.length)return [{value:text}];
 const result:CaptionPiece[]=[];let cursor=0;
 while(cursor<text.length){
  let best:CaptionMention|undefined;let position=text.length;
  for(const mention of choices){
   const found=text.indexOf(mention.label,cursor);
   if(found!==-1&&(found<position||(found===position&&mention.card==="business"))){
    position=found;best=mention;
   }
  }
  if(!best){result.push({value:text.slice(cursor)});break;}
  if(position>cursor)result.push({value:text.slice(cursor,position)});
  result.push({value:best.label,mention:best});cursor=position+best.label.length;
 }
 return result;
}

/** Shared caption for actual social feed posts, including typed business links. */
export function PostCaption({text,mentions=[]}:{text:string;mentions?:CaptionMention[]}){
 const [expanded,setExpanded]=useState(false);
 const {s,colors}=useUi();
 const link=text.match(/https?:\/\/[^\s]+/i)?.[0];
 if(!text.trim())return null;
 function openMention(mention:CaptionMention){
  setExpanded(false);
  router.push({pathname:"/jcard",params:{user:mention.id,...(mention.card==="business"?{card:"business"}:{})}});
 }
 const pieces=captionPieces(text,mentions);
 const tagged=pieces.map((piece,i)=>piece.mention?
  <Text key={i} accessibilityRole="link" onPress={()=>openMention(piece.mention!)}
   style={{fontWeight:"700",textDecorationLine:"underline",color:colors.ink}}>{piece.value}</Text>:
  piece.value);
 return <View>
  <Pressable accessibilityRole="button" accessibilityLabel={"Ver descripción completa: "+text}
   accessibilityState={{expanded}} onPress={()=>setExpanded(true)}
   style={{minHeight:36,justifyContent:"center",paddingHorizontal:16}}>
   <Text style={s.text} numberOfLines={1} ellipsizeMode="tail">{tagged}</Text>
  </Pressable>
  <BottomSheet visible={expanded} onClose={()=>setExpanded(false)} title="Descripción">
   <Text selectable style={[s.text,{color:colors.ink,paddingVertical:12}]}>{tagged}</Text>
   {!!mentions.length&&<View style={{gap:5,paddingVertical:8}}>
    <Text style={[s.text,{fontWeight:"700"}]}>Profesionales y empresas etiquetados</Text>
    {mentions.map((mention,i)=><Pressable key={mention.card+":"+mention.id+":"+i} accessibilityRole="link"
     accessibilityLabel={"Ver "+(mention.card==="business"?"JCard de negocio de ":"perfil de ")+mention.label}
     onPress={()=>openMention(mention)} style={{minHeight:40,justifyContent:"center"}}>
     <Text style={[s.text,{textDecorationLine:"underline",color:colors.ink}]}>{mention.label}</Text>
    </Pressable>)}
   </View>}
   {!!link&&<Pressable accessibilityRole="link" accessibilityLabel="Abrir enlace de la descripción" onPress={()=>void Linking.openURL(link)} style={{paddingVertical:12,minHeight:44}}><Text style={[s.text,{color:colors.ink,textDecorationLine:"underline"}]}>{link}</Text></Pressable>}
  </BottomSheet>
 </View>;
}
