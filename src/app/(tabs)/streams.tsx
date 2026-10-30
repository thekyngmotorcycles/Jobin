import { useState } from "react";
import { Pressable,ScrollView,Text,View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Avatar,BottomSheet,IconButton } from "../../components/social-ui";
import { StreamGrid } from "../../components/StreamGrid";
import { Button,Chips,useUi } from "../../components/ui";
import { LIVE_CATEGORIES,LIVE_STREAMS,browseStreams,type LiveCategory } from "../../lib/streams";
import { useApp } from "../../state/AppProvider";
export default function Streams(){
 const {s,colors}=useUi();const {name,city,setCity}=useApp();const [category,setCategory]=useState<LiveCategory>("Popular");const [notifications,setNotifications]=useState(false);
 const rooms=browseStreams(category,city);
 return <SafeAreaView edges={["top","left","right"]} style={s.screen}>
 <ScrollView contentContainerStyle={{paddingHorizontal:20,paddingTop:12,paddingBottom:24,gap:24}} showsVerticalScrollIndicator={false}>
 <View style={{flexDirection:"row",alignItems:"center",gap:10}}>
 <Pressable accessibilityRole="button" accessibilityLabel="My profile" onPress={()=>router.navigate("/profile")}><Avatar name={name||"You"} size={43}/></Pressable>
 <View style={{flex:1,minWidth:0}}><Text style={s.muted}>Welcome back,</Text><Text numberOfLines={1} style={s.h3}>{name||"Explorer"}</Text></View>
 <View style={{flexDirection:"row",marginRight:-10}}>
 <IconButton icon="search-outline" label="Search live streams" onPress={()=>router.push({pathname:"/search",params:{mode:"live"}})}/>
 <IconButton icon="mail-outline" label="Open inbox" onPress={()=>router.navigate("/inbox")}/>
 <IconButton icon="notifications-outline" label="Notifications" onPress={()=>setNotifications(true)}/>
 </View></View>
 <View style={{flexDirection:"row",justifyContent:"space-between",alignItems:"center"}}><Text style={[s.h1,{fontSize:34,flex:1}]}>Live, in good company.</Text></View>
 <View style={{gap:14}}>
 <View style={{flexDirection:"row",alignItems:"center",justifyContent:"space-between"}}><Text style={s.h3}>On air</Text><Text style={s.tag}>Demo rooms</Text></View>
 <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:18,paddingVertical:4}}>
 {LIVE_STREAMS.map(room=><Pressable key={room.id} accessibilityRole="button" accessibilityLabel={"Preview "+room.host+"'s stream"} onPress={()=>router.push({pathname:"/stream/[id]",params:{id:room.id}})} style={{width:70,alignItems:"center",gap:12}}>
 <View style={{borderColor:colors.reaction,borderWidth:2,borderRadius:37,padding:3}}><Avatar uri={room.avatar} name={room.host} size={58}/><Text style={{position:"absolute",bottom:-6,alignSelf:"center",backgroundColor:colors.ink,color:colors.inverse,paddingHorizontal:9,paddingVertical:3,borderRadius:7,fontSize:8,fontWeight:"800",overflow:"hidden"}}>LIVE</Text></View>
 <Text numberOfLines={1} style={[s.muted,{fontSize:11}]}>{room.host.split(" ")[0]}</Text>
 </Pressable>)}</ScrollView></View>
 <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:9}}>
 {LIVE_CATEGORIES.map(item=><Pressable key={item} accessibilityRole="button" accessibilityState={{selected:category===item}} onPress={()=>setCategory(item)} style={{paddingHorizontal:21,minHeight:44,justifyContent:"center",borderRadius:24,backgroundColor:category===item?colors.ink:colors.accent}}>
 <Text style={{color:category===item?colors.inverse:colors.ink,fontWeight:"600",fontSize:12}}>{item}</Text></Pressable>)}</ScrollView>
 {category==="Nearby"&&<View style={{gap:10}}><Text style={s.muted}>Browse by city</Text><Chips values={["Todas","Miami","Orlando"]} value={city} onChange={setCity} label="Live stream city"/></View>}
 <View style={{gap:14}}><Text style={s.h2}>{category==="Nearby"?"Around your corner.":"Find your next inspiration."}</Text><StreamGrid rooms={rooms}/></View>
 <Text style={s.muted}>Preview rooms use sample video and viewer counts.</Text>
 </ScrollView>
 <BottomSheet visible={notifications} onClose={()=>setNotifications(false)} title="Notifications"><View style={{paddingVertical:30,gap:20}}><Text style={s.h2}>You’re all caught up.</Text><Text style={s.muted}>Messages, invitations and updates will appear in your inbox.</Text><Button title="Open inbox" onPress={()=>{setNotifications(false);router.navigate("/inbox");}}/></View></BottomSheet>
 </SafeAreaView>;
}
