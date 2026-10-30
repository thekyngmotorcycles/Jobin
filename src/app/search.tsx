import { useState } from "react";
import { Pressable,ScrollView,Text,TextInput,View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router,useLocalSearchParams } from "expo-router";
import { Avatar,IconButton } from "../components/social-ui";
import { Chips,useUi } from "../components/ui";
import { visiblePosts } from "../lib/feed";
import { browseStreams } from "../lib/streams";
export default function Search(){
 const {mode}=useLocalSearchParams<{mode?:string}>();const {s,colors}=useUi();const [query,setQuery]=useState("");const [kind,setKind]=useState<"Videos"|"Live">(mode==="live"?"Live":"Videos");
 const posts=visiblePosts("Para ti",[],query),streams=browseStreams("Popular","Todas",query);
 return <SafeAreaView style={s.screen}>
 <View style={{flexDirection:"row",alignItems:"center",padding:12,gap:6}}><IconButton icon="arrow-back" label="Back" onPress={()=>router.canGoBack()?router.back():router.replace("/")}/>
 <TextInput accessibilityLabel="Search creators, videos and live streams" autoFocus placeholder="Search people, work, live…" placeholderTextColor={colors.muted} value={query} onChangeText={setQuery} returnKeyType="search" style={{flex:1,minHeight:46,borderRadius:24,backgroundColor:colors.accent,paddingHorizontal:18,color:colors.ink}}/>
 {!!query&&<IconButton icon="close" label="Clear search" onPress={()=>setQuery("")}/>}</View>
 <View style={{paddingHorizontal:20,paddingBottom:16}}><Chips values={["Videos","Live"] as const} value={kind} onChange={setKind} label="Search category"/></View>
 <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{padding:20,gap:20}}>
 <Text style={s.muted}>{query?"Search results":"Explore demo creators and rooms"}</Text>
 {kind==="Videos"?posts.map(post=><Pressable key={post.postId} accessibilityRole="button" onPress={()=>router.replace({pathname:"/",params:{post:post.postId}})} style={{flexDirection:"row",gap:14,alignItems:"center",paddingVertical:12,borderBottomWidth:1,borderBottomColor:colors.line}}>
 <Avatar uri={post.avatar} name={post.author}/><View style={{flex:1,gap:5}}><Text style={s.h3}>@{post.handle}</Text><Text style={s.muted} numberOfLines={2}>{post.caption}</Text></View></Pressable>):
 streams.map(room=><Pressable key={room.id} accessibilityRole="button" onPress={()=>router.replace({pathname:"/stream/[id]",params:{id:room.id}})} style={{flexDirection:"row",gap:14,alignItems:"center",paddingVertical:12,borderBottomWidth:1,borderBottomColor:colors.line}}>
 <Avatar uri={room.avatar} name={room.host}/><View style={{flex:1,gap:5}}><Text style={s.h3}>{room.title}</Text><Text style={s.muted}>{room.host} · {room.city} · Demo room</Text></View></Pressable>)}
 {(kind==="Videos"?!posts.length:!streams.length)&&<Text style={s.text}>No results. Try a name, profession or city.</Text>}
 </ScrollView></SafeAreaView>;
}
