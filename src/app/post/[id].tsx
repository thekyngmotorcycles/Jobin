import {router,Stack,useFocusEffect,useLocalSearchParams} from "expo-router";
import {useCallback,useState} from "react";
import {ActivityIndicator,Pressable,ScrollView,Text,View} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";
import {HomePostCard} from "../../components/HomePublishedPosts";
import {captureMessageScope,assertMessageScope} from "../../lib/message-session";
import {loadHomePosts,type FeedPost} from "../../lib/social-content";
import {useUi} from "../../components/ui";
import {useTabClearance} from "../../theme/navigation";

export default function PostDetail(){
 const {id}=useLocalSearchParams<{id:string}>();
 const {s,colors}=useUi();
 const {contentBottom}=useTabClearance();
 const [post,setPost]=useState<FeedPost|null>(null);
 const [viewer,setViewer]=useState("");
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState("");
 useFocusEffect(useCallback(()=>{
  let active=true;setLoading(true);setPost(null);setViewer("");
  void(async()=>{
   try{
    const scope=await captureMessageScope(),user=scope.owner;
    const loaded=id?await loadHomePosts(user,undefined,id,undefined,0,scope):[];
    await assertMessageScope(scope);
    if(active){setPost(loaded[0]??null);setViewer(user);setError("");}
   }catch(e){if(active)setError(e instanceof Error?e.message:"No se pudo abrir esta publicación.");}
   finally{if(active)setLoading(false);}
  })();
  return()=>{active=false;setPost(null);setViewer("");};
 },[id]));
 return <>
  <Stack.Screen options={{title:"Publicación"}}/>
  <SafeAreaView edges={["bottom"]} style={s.screen}>
   <ScrollView contentContainerStyle={{paddingTop:12,paddingBottom:contentBottom+20,gap:16}} showsVerticalScrollIndicator={false}>
    {loading&&<ActivityIndicator color={colors.ink}/>}
    {!!error&&<Text style={[s.muted,{paddingHorizontal:16}]}>{error}</Text>}
    {!loading&&!error&&!post&&<View style={{gap:10,padding:16}}>
     <Text style={s.text}>Esta publicación no está disponible.</Text>
     <Pressable accessibilityRole="button" onPress={()=>router.back()} style={{minHeight:44,justifyContent:"center"}}>
      <Text style={s.muted}>Volver</Text>
     </Pressable>
    </View>}
    {post&&<HomePostCard post={post} viewer={viewer} onHide={()=>router.back()}/>}
   </ScrollView>
  </SafeAreaView>
 </>;
}
