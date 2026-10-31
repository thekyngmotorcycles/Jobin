import { useLocalSearchParams } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { Avatar } from "../../components/social-ui";
import { Screen, useUi } from "../../components/ui";
import { FEED_POSTS } from "../../lib/feed";
import { professionals } from "../../lib/data";
import { useSocial } from "../../state/SocialProvider";

export default function CreatorProfile(){
 const {id}=useLocalSearchParams<{id:string}>();
 const {s,colors}=useUi();const social=useSocial();
 const clip=FEED_POSTS.find(p=>p.creatorId===id);
 if(!clip)return <Screen title="Perfil"><Text style={s.muted}>Perfil no disponible.</Text></Screen>;
 const following=social.following.includes(clip.creatorId);
 const rating=professionals.find(p=>p.id===clip.creatorId)?.rating;
 return <Screen title="Perfil del creador">
  <View style={{alignItems:"center",gap:12,padding:20}}>
   <Avatar uri={clip.avatar} name={clip.author} size={96}/>
   <Text style={s.h2}>{clip.author}</Text>
   <Text style={s.muted}>@{clip.handle}</Text>
   <Text style={s.text}>{clip.role}</Text>
   {rating!==undefined&&<Text style={s.text}>★ {rating.toFixed(1)}</Text>}
   <Pressable accessibilityRole="button" accessibilityLabel={following?"Dejar de seguir":"Seguir"} onPress={()=>social.toggleFollow(clip.creatorId)} style={{backgroundColor:colors.ink,paddingHorizontal:26,paddingVertical:14,borderRadius:28}}>
    <Text style={{color:colors.inverse,fontWeight:"700"}}>{following?"Following":"Follow"}</Text>
   </Pressable>
   <Text style={s.muted}>Perfil de ejemplo · Datos de demostración.</Text>
  </View>
 </Screen>;
}
