import { useEffect,useRef,useState } from "react";
import { AccessibilityInfo,Animated,AppState,Pressable,ScrollView,Share,Text,TextInput,View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useVideoPlayer,VideoView } from "expo-video";
import { router } from "expo-router";
import type { FeedClip } from "../lib/feed";
import { formatCount } from "../lib/feed";
import { useSocial } from "../state/SocialProvider";
import { useApp } from "../state/AppProvider";
import { useTheme } from "../state/ThemeProvider";
import { Avatar,BottomSheet,IconButton,overlayStyles,type IconName } from "./social-ui";
import { Button,useUi } from "./ui";
function SoundLine({text,active}:{text:string;active:boolean}){
 const x=useRef(new Animated.Value(0)).current;const [width,setWidth]=useState(0);const [textWidth,setTextWidth]=useState(0);const [reduce,setReduce]=useState(false);
 useEffect(()=>{void AccessibilityInfo.isReduceMotionEnabled().then(setReduce);const event=AccessibilityInfo.addEventListener("reduceMotionChanged",setReduce);return()=>event.remove();},[]);
 const moving=active&&textWidth>width&&width>0&&!reduce;
 useEffect(()=>{x.setValue(0);if(!moving)return;const loop=Animated.loop(Animated.sequence([Animated.delay(1000),Animated.timing(x,{toValue:-textWidth-28,duration:Math.max(6000,textWidth*35),useNativeDriver:true,isInteraction:false}),Animated.timing(x,{toValue:0,duration:0,useNativeDriver:true})]));loop.start();return()=>loop.stop();},[moving,textWidth,x]);
 return <View style={{flexDirection:"row",alignItems:"center",gap:7}}>
 <Ionicons name="musical-notes" size={14} color="#fff"/><View style={{flex:1,overflow:"hidden"}} onLayout={e=>setWidth(e.nativeEvent.layout.width)}>
 <Animated.View style={{flexDirection:"row",transform:[{translateX:x}]}}>
 <Text onLayout={e=>setTextWidth(e.nativeEvent.layout.width)} style={{flexShrink:0,color:"#fff",fontSize:12,marginRight:28}}>{text}</Text>
 {moving&&<Text accessibilityElementsHidden style={{flexShrink:0,color:"#fff",fontSize:12}}>{text}</Text>}
 </Animated.View></View></View>;
}
function RailAction({icon,label,count,onPress,selected=false,color="#fff"}:{icon:IconName;label:string;count?:number;onPress:()=>void;selected?:boolean;color?:string}){
 return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{selected}} onPress={onPress} style={({pressed})=>({alignItems:"center",justifyContent:"center",minHeight:52,minWidth:48,opacity:pressed?0.65:1})}>
 <Ionicons name={icon} size={31} color={color} style={{textShadowColor:"#0007",textShadowRadius:5,textShadowOffset:{width:0,height:1}}}/>
 {count!==undefined&&<Text style={[overlayStyles.shadowText,{color:"#fff",fontSize:11,fontWeight:"700",marginTop:2}]}>{formatCount(count)}</Text>}
 </Pressable>;
}
export function FeedVideo({active,height,clip}:{active:boolean;height:number;clip:FeedClip}){
 const {colors}=useTheme();const {s}=useUi();const {name}=useApp();const social=useSocial();
 const [error,setError]=useState("");const [muted,setMuted]=useState(true);const [paused,setPaused]=useState(false);
 const [sheet,setSheet]=useState<"comments"|"creator"|null>(null);const [draft,setDraft]=useState("");const [shareError,setShareError]=useState("");
 const [expanded,setExpanded]=useState(false);const disc=useRef(new Animated.Value(0)).current;
 const player=useVideoPlayer(clip.video,p=>{p.loop=true;p.muted=true;});
 const liked=social.likedPosts.includes(clip.postId),following=social.following.includes(clip.creatorId),saved=social.savedPosts.includes(clip.postId);
 const comments=social.comments[clip.postId]||[];const playing=active&&!paused&&!error&&!sheet;
 useEffect(()=>{const listener=player.addListener("statusChange",event=>{
  if(event.status==="error")setError("Video unavailable. Swipe to the next clip.");
  if(event.status==="readyToPlay"&&player.duration>180){player.pause();setError("This clip exceeds the 3-minute limit.");}
 });return()=>listener.remove();},[player]);
 useEffect(()=>{if(playing)player.play();else player.pause();
 const listener=AppState.addEventListener("change",state=>{if(state!=="active")player.pause();else if(playing)player.play();});
 return()=>{listener.remove();player.pause();};},[playing,player]);
 useEffect(()=>{player.muted=muted;},[player,muted]);
 useEffect(()=>{if(!playing)return;const animation=Animated.loop(Animated.timing(disc,{toValue:1,duration:8500,useNativeDriver:true,isInteraction:false}));animation.start();return()=>{animation.stop();disc.setValue(0);};},[playing,disc]);
 async function share(){try{const result=await Share.share({message:"A demo work story from @"+clip.handle+" on Jobin. "+clip.video});if(result.action===Share.sharedAction)social.addShare(clip.postId);}catch{setShareError("Sharing is unavailable here. Try opening Jobin on your phone.");}}
 function sendComment(){if(!draft.trim())return;social.addComment(clip.postId,name||"You",draft);setDraft("");}
 return <View style={{height,width:"100%",backgroundColor:"#080808",overflow:"hidden"}}>
 <VideoView player={player} style={{position:"absolute",inset:0}} contentFit="cover" nativeControls={false} surfaceType="textureView" pointerEvents="none"/>
 <Pressable style={{position:"absolute",inset:0}} accessibilityRole="button" accessibilityLabel={paused?"Play video":"Pause video"} onPress={()=>setPaused(!paused)}>
 {paused&&<View style={{flex:1,justifyContent:"center",alignItems:"center"}}><Ionicons name="play" size={56} color="#ffffffbd"/></View>}
 </Pressable>
 <View pointerEvents="none" style={{position:"absolute",left:0,right:0,bottom:0,height:210,backgroundColor:"#0003"}}/>
 <View style={{position:"absolute",right:8,bottom:16,alignItems:"center",gap:3,width:58}}>
 <View style={{marginBottom:7}}>
 <Pressable accessibilityRole="button" accessibilityLabel={"View "+clip.author} onPress={()=>setSheet("creator")} style={{borderWidth:2,borderColor:"#fff",borderRadius:29}}><Avatar uri={clip.avatar} name={clip.author} size={48}/></Pressable>
 <Pressable accessibilityRole="button" accessibilityLabel={following?"Unfollow "+clip.author:"Follow "+clip.author} accessibilityState={{selected:following}} onPress={()=>social.toggleFollow(clip.creatorId)}
 style={{position:"absolute",bottom:-10,left:13,width:26,height:26,borderRadius:13,backgroundColor:following?"#fff":colors.reaction,alignItems:"center",justifyContent:"center"}}><Ionicons name={following?"checkmark":"add"} size={18} color={following?"#111":"#fff"}/></Pressable>
 </View>
 <RailAction icon={liked?"heart":"heart-outline"} label={liked?"Unlike video":"Like video"} count={clip.likes+(liked?1:0)} selected={liked} color={liked?colors.reaction:"#fff"} onPress={()=>social.toggleLike(clip.postId)}/>
 <RailAction icon="chatbubble-ellipses" label="Open comments" count={clip.comments+comments.length} onPress={()=>setSheet("comments")}/>
 <RailAction icon="arrow-redo" label="Share video" count={clip.shares+(social.shares[clip.postId]||0)} onPress={()=>void share()}/>
 <RailAction icon={saved?"bookmark":"bookmark-outline"} label={saved?"Unsave video":"Save video"} selected={saved} onPress={()=>social.toggleSave(clip.postId)}/>
 <Pressable accessibilityRole="button" accessibilityLabel={muted?"Unmute audio":"Mute audio"} onPress={()=>setMuted(!muted)} style={{marginTop:5}}>
 <Animated.View style={{width:40,height:40,borderRadius:20,borderWidth:7,borderColor:"#232323",backgroundColor:"#555",alignItems:"center",justifyContent:"center",transform:[{rotate:disc.interpolate({inputRange:[0,1],outputRange:["0deg","360deg"]})}]}}><Ionicons name={muted?"volume-mute":"musical-note"} color="#fff" size={15}/></Animated.View>
 </Pressable>
 </View>
 <View style={{position:"absolute",left:16,right:84,bottom:22,gap:9}}>
 {!!error&&<Text accessibilityLiveRegion="polite" style={{color:"#fff",backgroundColor:"#0009",padding:10,borderRadius:8}}>{error}</Text>}
 {!!shareError&&<Text accessibilityLiveRegion="polite" style={{color:"#fff",backgroundColor:"#0009",padding:8}}>{shareError}</Text>}
 <Pressable accessibilityRole="button" accessibilityLabel={"View @"+clip.handle} onPress={()=>setSheet("creator")}><Text style={[overlayStyles.shadowText,{fontSize:16,fontWeight:"800",color:"#fff"}]}>@{clip.handle}</Text></Pressable>
 <Pressable accessibilityRole="button" accessibilityLabel="Expand or collapse caption" onPress={()=>setExpanded(!expanded)}><Text numberOfLines={expanded?undefined:2} style={[overlayStyles.shadowText,{color:"#fff",fontSize:13,lineHeight:19}]}>{clip.caption}</Text></Pressable>
 <SoundLine text={clip.audio} active={playing}/>
 <Text style={{color:"#ffffffaa",fontSize:9,letterSpacing:1}}>DEMO CLIP · SAMPLE ENGAGEMENT</Text>
 </View>
 <BottomSheet visible={sheet==="comments"} title={formatCount(clip.comments+comments.length)+" comments"} onClose={()=>setSheet(null)}>
 <Text style={s.muted}>Sample discussion · your comments stay in this demo session.</Text>
 <ScrollView style={{flex:1}} keyboardShouldPersistTaps="handled" contentContainerStyle={{gap:20,paddingVertical:20}}>
 {[{id:"sample-a",author:"Community preview",text:"A closer look at the work behind the result."},{id:"sample-b",author:"Jobin demo",text:"What part of your work would you share?"},...comments].map(comment=><View key={comment.id} style={{flexDirection:"row",gap:12}}><Avatar name={comment.author} size={34}/><View style={{flex:1,gap:4}}><Text style={s.h3}>{comment.author}</Text><Text style={s.text}>{comment.text}</Text></View></View>)}
 </ScrollView>
 <View style={{flexDirection:"row",alignItems:"center",gap:8,borderTopWidth:1,borderTopColor:colors.line,paddingTop:10}}>
 <TextInput accessibilityLabel="Write a comment" placeholder="Add a comment…" placeholderTextColor={colors.muted} value={draft} onChangeText={setDraft} maxLength={500} onSubmitEditing={sendComment} style={{flex:1,color:colors.ink,minHeight:48,backgroundColor:colors.accent,borderRadius:25,paddingHorizontal:16}}/>
 <IconButton icon="arrow-up" label="Post comment" onPress={sendComment} background={colors.ink} color={colors.inverse}/></View>
 </BottomSheet>
 <BottomSheet visible={sheet==="creator"} title="Creator" onClose={()=>setSheet(null)}>
 <View style={{alignItems:"center",gap:15,paddingTop:24}}><Avatar uri={clip.avatar} name={clip.author} size={88}/><Text style={s.h2}>{clip.author}</Text><Text style={s.muted}>@{clip.handle} · {clip.role}</Text>
 <Button title={following?"Following":"Follow"} secondary={following} selected={following} onPress={()=>social.toggleFollow(clip.creatorId)}/>
 <Button secondary title="View service" onPress={()=>{setSheet(null);router.push({pathname:"/services",params:{professional:clip.creatorId}});}}/><Text style={s.muted}>Demo creator profile</Text></View>
 </BottomSheet>
 </View>;
}
