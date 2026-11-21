import {Ionicons} from "@expo/vector-icons";
import {router,useFocusEffect} from "expo-router";
import {useCallback,useState} from "react";
import {Pressable,ScrollView,Text,View} from "react-native";
import {PublicProfileAvatar} from "./PublicProfileAvatar";
import {currentSocialUser,loadActiveStories,type SocialStory} from "../lib/social-content";
import {useTheme} from "../state/ThemeProvider";
import {jobeenTokens} from "../theme/jobeen";

/** Shared real stories strip rendered in both Home and Messages. */
export function StoryStrip(){
 const {theme}=useTheme();const t=jobeenTokens(theme);
 const [userId,setUserId]=useState("");
 const [stories,setStories]=useState<SocialStory[]>([]);
 const [error,setError]=useState("");
 useFocusEffect(useCallback(()=>{
  let active=true;
  void(async()=>{
   try{
    const [owner,loaded]=await Promise.all([currentSocialUser().catch(()=>"") ,loadActiveStories()]);
    if(active){setUserId(owner);setStories(loaded);setError("");}
   }catch(e){if(active)setError(e instanceof Error?e.message:"No se pudieron cargar las historias.");}
  })();
  return()=>{active=false;};
 },[]));
 const latestByAuthor=new Map<string,SocialStory>();
 for(const story of stories)if(!latestByAuthor.has(story.authorId))latestByAuthor.set(story.authorId,story);
 const own=userId?latestByAuthor.get(userId):undefined;
 const others=[...latestByAuthor.values()].filter(x=>x.authorId!==userId);
 return <View style={{gap:8}}>
  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{paddingHorizontal:16,paddingVertical:3,gap:16}}>
   <View style={{width:72,alignItems:"center",gap:6}}>
    <Pressable accessibilityRole="button" accessibilityLabel={own?"Ver mi historia":"Crear mi historia"}
     onPress={()=>router.push(own?{pathname:"/story/[id]",params:{id:own.id}}:"/story/create")}
     style={{width:66,height:79,borderRadius:16,borderWidth:2,borderColor:t.yellow,padding:3,alignItems:"center",justifyContent:"center"}}>
     {userId?<PublicProfileAvatar userId={userId} name="Yo" size={54} height={65} shape="portrait" framed={false}/>:<Ionicons name="person-outline" size={40} color={t.ink}/>}
    </Pressable>
    <Pressable accessibilityRole="button" accessibilityLabel="Añadir historia" onPress={()=>router.push("/story/create")}
     style={{position:"absolute",right:2,top:54,width:25,height:25,borderRadius:13,backgroundColor:t.yellow,borderWidth:2,borderColor:t.surface,alignItems:"center",justifyContent:"center"}}>
     <Ionicons name="add" size={18} color={t.ink}/>
    </Pressable>
    <Text numberOfLines={1} style={{fontSize:12,color:t.ink2}}>Tu historia</Text>
   </View>
   {others.map(story=><Pressable key={story.authorId} accessibilityRole="button"
    accessibilityLabel={"Ver historia de "+story.authorName} onPress={()=>router.push({pathname:"/story/[id]",params:{id:story.id}})}
    style={{width:72,alignItems:"center",gap:6}}>
    <View style={{width:66,height:79,borderRadius:16,borderWidth:2,borderColor:t.yellow,padding:3,alignItems:"center",justifyContent:"center"}}>
     <PublicProfileAvatar userId={story.authorId} name={story.authorName} size={54} height={65} shape="portrait" framed={false}/>
    </View>
    <Text numberOfLines={1} style={{fontSize:12,color:t.ink2}}>{story.authorName}</Text>
   </Pressable>)}
  </ScrollView>
  {!!error&&<Text accessibilityLiveRegion="polite" style={{paddingHorizontal:17,fontSize:11,color:t.ink2}}>{error}</Text>}
 </View>;
}
