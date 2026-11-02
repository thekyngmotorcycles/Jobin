import { useState } from "react";
import { ImageBackground,Pressable,Text,View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import type { LiveStream } from "../lib/streams";
import { formatCount } from "../lib/feed";
import { useTheme } from "../state/ThemeProvider";
import { useUi } from "./ui";
export function StreamCard({room,tall=false}:{room:LiveStream;tall?:boolean}){
 const {colors}=useTheme();
 return <Pressable accessibilityRole="button" accessibilityLabel={"Preview "+room.title+" by "+room.host} onPress={()=>router.push({pathname:"/stream/[id]",params:{id:room.id}})}
 style={({pressed})=>({aspectRatio:tall?0.69:0.92,borderRadius:18,overflow:"hidden",backgroundColor:colors.accent,opacity:pressed?0.8:1})}>
 <ImageBackground source={{uri:room.thumbnail}} style={{flex:1}} resizeMode="cover">
 <View style={{position:"absolute",inset:0,backgroundColor:colors.mediaTint}}/>
 <View style={{position:"absolute",top:10,left:10,right:10,flexDirection:"row",justifyContent:"space-between",gap:4}}>
 <View style={{flexDirection:"row",gap:4,alignItems:"center",backgroundColor:colors.mediaNotice,paddingVertical:5,paddingHorizontal:7,borderRadius:12}}><Ionicons name="eye-outline" color={colors.mediaText} size={12}/><Text style={{color:colors.mediaText,fontSize:10,fontWeight:"700"}}>{formatCount(room.viewers)}</Text></View>
 <Text style={{fontSize:9,fontWeight:"800",letterSpacing:.5,color:colors.inverse,backgroundColor:colors.ink,paddingVertical:5,paddingHorizontal:7,borderRadius:10}}>DEMO</Text>
 </View>
 <View style={{position:"absolute",bottom:0,left:0,right:0,padding:12,gap:7,backgroundColor:colors.mediaCaption}}>
 <Text numberOfLines={2} style={{color:colors.mediaText,fontSize:16,fontWeight:"700",lineHeight:21}}>{room.title}</Text><Text numberOfLines={1} style={{color:colors.mediaText,fontSize:11}}>{room.host} · {room.city}</Text>
 </View></ImageBackground></Pressable>;
}
export function StreamGrid({rooms}:{rooms:LiveStream[]}){
 const [width,setWidth]=useState(350);const columns=width>=1000?4:width>=700?3:2;
 return <View onLayout={e=>setWidth(e.nativeEvent.layout.width)} style={{flexDirection:"row",gap:12}}>
 {Array.from({length:columns},(_,column)=><View key={column} style={{flex:1,gap:12}}>
 {rooms.filter((_,i)=>i%columns===column).map((room,index)=><StreamCard key={room.id} room={room} tall={(column+index)%2===0}/>)}
 </View>)}
 </View>;
}
