import {useEffect,useState} from "react";
import {router} from "expo-router";
import {Pressable,Text,View} from "react-native";
import * as Linking from "expo-linking";
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

/** Expand in place; keep exact mention destinations and HTTP(S) links. */
export function PostCaption({text,mentions=[],interactive=true}:{text:string;mentions?:CaptionMention[];interactive?:boolean}){
 const [expanded,setExpanded]=useState(false);
 const [overflow,setOverflow]=useState(false);
 const {s,colors}=useUi();
 useEffect(()=>{setExpanded(false);setOverflow(false);},[text]);
 if(!text.trim())return null;
 function openMention(mention:CaptionMention){
  router.push({pathname:"/jcard",params:{user:mention.id,...(mention.card==="business"?{card:"business"}:{})}});
 }
 const tagged=captionPieces(text,mentions).map((piece,i)=>piece.mention?
  <Text key={i} accessibilityRole={interactive?"link":undefined} onPress={interactive?()=>openMention(piece.mention!):undefined}
   style={{fontWeight:"700",textDecorationLine:"underline",color:colors.ink}}>{piece.value}</Text>:
  piece.value.split(/(https?:\/\/[^\s]+)/gi).map((part,j)=>/^https?:\/\//i.test(part)?
   <Text key={i+":"+j} accessibilityRole={interactive?"link":undefined} onPress={interactive?()=>void Linking.openURL(part).catch(()=>{}):undefined}
    style={{textDecorationLine:"underline",color:colors.ink}}>{part}</Text>:part));
 return <View style={{paddingHorizontal:16,gap:3}}>
  <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
   style={{position:"absolute",left:16,right:16,opacity:0}}>
   <Text style={s.text} onTextLayout={event=>setOverflow(event.nativeEvent.lines.length>3)}>{tagged}</Text>
  </View>
  <Text style={s.text} numberOfLines={expanded?undefined:3} ellipsizeMode="tail" selectable={expanded}>{tagged}</Text>
  {(overflow||expanded||mentions.length>0)&&<Pressable accessibilityRole="button" accessibilityLabel={expanded?"Ver menos descripción":"Ver descripción completa"}
   accessibilityState={{expanded}} onPress={()=>setExpanded(value=>!value)}
   style={{alignSelf:"flex-start",minHeight:48,justifyContent:"center"}}>
   <Text style={[s.muted,{fontWeight:"600"}]}>{expanded?"Ver menos":"Ver más"}</Text>
  </Pressable>}
  {expanded&&mentions.length>0&&<View style={{gap:4,paddingBottom:6}}>
   <Text style={[s.muted,{fontWeight:"600"}]}>Profesionales y empresas etiquetados</Text>
   {mentions.map((mention,i)=><Pressable key={mention.card+":"+mention.id+":"+i} disabled={!interactive}
    accessibilityRole="link" accessibilityLabel={"Ver "+(mention.card==="business"?"JCard de negocio de ":"perfil de ")+mention.label}
    onPress={()=>openMention(mention)} style={{minHeight:48,justifyContent:"center"}}>
    <Text style={[s.text,{textDecorationLine:"underline",color:colors.ink}]}>{mention.label}</Text>
   </Pressable>)}
  </View>}
 </View>;
}
