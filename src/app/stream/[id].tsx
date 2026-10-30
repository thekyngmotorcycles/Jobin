import { useEffect,useRef,useState } from "react";
import { Animated,AppState,KeyboardAvoidingView,Platform,ScrollView,Share,Text,TextInput,View } from "react-native";
import { router,useLocalSearchParams } from "expo-router";
import { useIsFocused } from "@react-navigation/native";
import { useVideoPlayer,VideoView } from "expo-video";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Avatar,BottomSheet,IconButton } from "../../components/social-ui";
import { Button,useUi } from "../../components/ui";
import { LIVE_STREAMS } from "../../lib/streams";
import { formatCount } from "../../lib/feed";
import { useSocial } from "../../state/SocialProvider";
import { useApp } from "../../state/AppProvider";
function FloatingHeart({done,color}:{done:()=>void;color:string}){
 const p=useRef(new Animated.Value(0)).current;const end=useRef(done).current;
 useEffect(()=>{const animation=Animated.timing(p,{toValue:1,duration:1400,useNativeDriver:true,isInteraction:false});animation.start(({finished})=>{if(finished)end();});return()=>animation.stop();},[p,end]);
 return <Animated.View pointerEvents="none" style={{position:"absolute",right:25,bottom:90,opacity:p.interpolate({inputRange:[0,.75,1],outputRange:[1,1,0]}),transform:[{translateY:p.interpolate({inputRange:[0,1],outputRange:[0,-230]})},{translateX:p.interpolate({inputRange:[0,.5,1],outputRange:[0,-25,10]})},{scale:p.interpolate({inputRange:[0,1],outputRange:[.7,1.3]})}]}}><Ionicons name="heart" size={32} color={color}/></Animated.View>;
}
function Room({room}:{room:typeof LIVE_STREAMS[number]}){
 const {s,colors}=useUi();const inset=useSafeAreaInsets();const focused=useIsFocused();const {name}=useApp();const social=useSocial();
 const [draft,setDraft]=useState("");const [gift,setGift]=useState(false);const [notice,setNotice]=useState("");const [muted,setMuted]=useState(true);
 const [hearts,setHearts]=useState<number[]>([]);const nextHeart=useRef(0);const chat=useRef<ScrollView>(null);
 const player=useVideoPlayer(room.video,p=>{p.loop=true;p.muted=true;});const [error,setError]=useState("");
 const following=social.following.includes(room.hostId);const messages=social.roomMessages[room.id]||[];
 useEffect(()=>{if(focused)player.play();else player.pause();const sub=AppState.addEventListener("change",state=>{if(state!=="active")player.pause();else if(focused)player.play();});return()=>{sub.remove();player.pause();};},[focused,player]);
 useEffect(()=>{player.muted=muted;},[muted,player]);
 useEffect(()=>{const sub=player.addListener("statusChange",event=>{if(event.status==="error")setError("The preview video could not load.");});return()=>sub.remove();},[player]);
 function send(){if(!draft.trim())return;social.sendRoomMessage(room.id,name||"You",draft);setDraft("");setNotice("Your message is visible in this demo session only.");}
 function heart(){social.sendRoomHeart(room.id);const id=++nextHeart.current;setHearts(items=>[...items.slice(-7),id]);}
 async function share(){try{await Share.share({message:"Preview "+room.host+"'s work on Jobin. "+room.video});}catch{setNotice("Sharing is unavailable on this device.");}}
 return <KeyboardAvoidingView style={{flex:1,backgroundColor:"#080808"}} behavior={Platform.OS==="ios"?"padding":undefined}>
 {focused&&<StatusBar style="light"/>}
 <View style={{flex:1}}>
 <VideoView player={player} style={{position:"absolute",inset:0}} contentFit="cover" nativeControls={false} surfaceType="textureView" pointerEvents="none"/>
 <View pointerEvents="none" style={{position:"absolute",inset:0,backgroundColor:"#0003"}}/>
 <View style={{position:"absolute",top:inset.top+8,left:14,right:10,flexDirection:"row",alignItems:"center",gap:8}}>
 <View style={{flexDirection:"row",alignItems:"center",gap:8,backgroundColor:"#0006",borderRadius:28,padding:5,paddingRight:10,flex:1}}>
 <Avatar uri={room.avatar} name={room.host} size={36}/><View style={{flex:1}}><Text numberOfLines={1} style={{color:"#fff",fontSize:12,fontWeight:"700"}}>{room.host}</Text><Text style={{color:"#ddd",fontSize:10}}>{formatCount(room.viewers)} sample viewers</Text></View>
 <IconButton icon={following?"checkmark":"add"} label={following?"Unfollow host":"Follow host"} onPress={()=>social.toggleFollow(room.hostId)} size={20} color="#fff" background="#ffffff26"/>
 </View>
 <IconButton icon={muted?"volume-mute-outline":"volume-high-outline"} label={muted?"Unmute stream":"Mute stream"} onPress={()=>setMuted(!muted)} color="#fff"/>
 <IconButton icon="close" label="Leave live room" onPress={()=>router.canGoBack()?router.back():router.replace("/streams")} color="#fff"/>
 </View>
 <View style={{position:"absolute",top:inset.top+79,left:18,right:18,gap:6}}><Text style={{fontSize:10,color:"#fff",letterSpacing:1,fontWeight:"800"}}>DEMO ROOM · RECORDED PREVIEW</Text><Text numberOfLines={2} style={{fontSize:19,color:"#fff",fontWeight:"700"}}>{room.title}</Text>{!!error&&<Text style={{color:"#fff",backgroundColor:"#0008",padding:10}}>{error}</Text>}</View>
 <View style={{position:"absolute",bottom:inset.bottom+88,left:16,right:68,gap:9}}>
 {!!notice&&<Text accessibilityLiveRegion="polite" style={{color:"#fff",fontSize:11,lineHeight:16,backgroundColor:"#0008",padding:9,borderRadius:10}}>{notice}</Text>}
 <ScrollView ref={chat} style={{maxHeight:180}} onContentSizeChange={()=>chat.current?.scrollToEnd({animated:true})} contentContainerStyle={{gap:9}}>
 <Text style={{alignSelf:"flex-start",color:"#eee",fontSize:11,padding:9,backgroundColor:"#ffffff20",borderRadius:15}}>Welcome to {room.host.split(" ")[0]}’s preview room.</Text>
 {[{id:"demo-1",author:"Jobin",text:"A look inside the process. This is a sample discussion."},{id:"demo-2",author:"Community preview",text:"What would you like to learn about this work?"},...messages].map(message=><View key={message.id} style={{paddingVertical:7,paddingHorizontal:10,backgroundColor:"#0007",borderRadius:12}}><Text style={{fontSize:12,lineHeight:18,color:"#fff"}}><Text style={{fontWeight:"800"}}>{message.author} </Text>{message.text}</Text></View>)}
 </ScrollView>
 </View>
 <View style={{position:"absolute",bottom:Math.max(inset.bottom,12),left:12,right:8,flexDirection:"row",alignItems:"center",gap:4}}>
 <TextInput accessibilityLabel="Comment in preview room" placeholder="Comment…" placeholderTextColor="#ddd" value={draft} onChangeText={setDraft} maxLength={500} onSubmitEditing={send} returnKeyType="send" style={{flex:1,minWidth:60,minHeight:46,borderRadius:25,paddingHorizontal:15,backgroundColor:"#ffffff24",color:"#fff",borderWidth:1,borderColor:"#ffffff35"}}/>
 {!!draft.trim()&&<IconButton icon="send" label="Send comment" color="#fff" onPress={send}/>}
 <IconButton icon="gift-outline" label="Send a gift" color={colors.reaction} onPress={()=>setGift(true)}/>
 <IconButton icon="arrow-redo-outline" label="Share room" color="#fff" onPress={()=>void share()}/>
 <View style={{alignItems:"center"}}><IconButton icon="heart" label="Send a heart" color={colors.reaction} onPress={heart}/><Text style={{color:"#fff",fontSize:9,position:"absolute",bottom:-4}}>{social.roomHearts[room.id]||0}</Text></View>
 </View>
 {hearts.map(id=><FloatingHeart key={id} color={colors.reaction} done={()=>setHearts(items=>items.filter(item=>item!==id))}/>)}
 <BottomSheet visible={gift} onClose={()=>setGift(false)} title="A little appreciation"><View style={{paddingVertical:28,gap:20,alignItems:"center"}}><Ionicons name="gift-outline" size={54} color={colors.ink}/><Text style={s.h2}>Send some encouragement.</Text><Text style={s.muted}>Preview gifts are reactions only. No money or credits are used.</Text><Button title="Send a demo gift" onPress={()=>{setGift(false);heart();setNotice("You sent a demo appreciation gift. No payment was made.");}}/></View></BottomSheet>
 </View></KeyboardAvoidingView>;
}
export default function StreamRoom(){
 const {id}=useLocalSearchParams<{id:string}>();const room=LIVE_STREAMS.find(item=>item.id===id);const {s}=useUi();
 if(!room)return <View style={[s.screen,{justifyContent:"center",padding:25,gap:20}]}><Text style={s.h2}>This room is unavailable.</Text><Button title="Browse live rooms" onPress={()=>router.replace("/streams")}/></View>;
 return <Room room={room}/>;
}
