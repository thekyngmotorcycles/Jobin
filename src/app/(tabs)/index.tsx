import { useEffect,useMemo,useRef,useState } from "react";
import { FlatList,Pressable,Text,View,type ViewToken } from "react-native";
import { useIsFocused } from "@react-navigation/native";
import { router,useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconButton } from "../../components/social-ui";
import { FeedVideo } from "../../components/FeedVideo";
import { FEED_POSTS,FEED_TABS,visiblePosts,type FeedClip,type FeedTab } from "../../lib/feed";
import { useSocial } from "../../state/SocialProvider";
const PAGE=6;
export default function Home(){
 const {following}=useSocial();const inset=useSafeAreaInsets();const focused=useIsFocused();const {post}=useLocalSearchParams<{post?:string}>();
 const [tab,setTab]=useState<FeedTab>("For You");const [count,setCount]=useState(PAGE);const [active,setActive]=useState(0);const [height,setHeight]=useState(600);
 const base=useMemo(()=>visiblePosts(tab,following),[tab,following]);
 const clips=useMemo<FeedClip[]>(()=>base.length?Array.from({length:count},(_,index)=>({...base[index%base.length],id:tab+"-"+index})):[],[base,count,tab]);
 const feedKey=tab==="Following"?following.join("|"):"for-you";
 useEffect(()=>{setActive(0);setCount(PAGE);},[feedKey]);
 useEffect(()=>{if(post){setTab("For You");setCount(PAGE);}},[post]);
 const target=post?Math.max(0,FEED_POSTS.findIndex(p=>p.postId===post)):0;
 const visible=useRef(({viewableItems}:{viewableItems:ViewToken<FeedClip>[]})=>{if(viewableItems[0])setActive(viewableItems[0].index??0);}).current;
 const viewability=useRef({itemVisiblePercentThreshold:65}).current;
 function changeTab(next:FeedTab){setTab(next);setActive(0);setCount(PAGE);}
 return <View style={{flex:1,backgroundColor:"#080808"}}>
 {focused&&<StatusBar style="light"/>}
 <View style={{position:"absolute",top:inset.top+5,left:8,right:8,zIndex:20,flexDirection:"row",alignItems:"center",gap:2}}>
 <IconButton icon="radio" label="Browse live streams" color="#fff" onPress={()=>router.navigate("/streams")}/>
 <View style={{flex:1,flexDirection:"row",justifyContent:"center",gap:16}}>{FEED_TABS.map(item=><Pressable key={item} accessibilityRole="tab" accessibilityState={{selected:tab===item}} onPress={()=>changeTab(item)} style={{minHeight:44,justifyContent:"center",borderBottomWidth:tab===item?2:0,borderBottomColor:"#fff",paddingHorizontal:2}}>
 <Text style={{color:tab===item?"#fff":"#ffffffb3",fontSize:15,fontWeight:tab===item?"800":"500",textShadowColor:"#0008",textShadowOffset:{width:0,height:1},textShadowRadius:4}}>{item}</Text></Pressable>)}</View>
 <IconButton icon="search" label="Search videos and live streams" color="#fff" onPress={()=>router.push("/search")}/>
 <IconButton icon="mail-outline" label="Open inbox" color="#fff" onPress={()=>router.navigate("/inbox")}/>
 </View>
 <View style={{flex:1}} onLayout={e=>setHeight(Math.max(1,e.nativeEvent.layout.height))}>
 <FlatList key={tab+feedKey+Math.round(height)+(post||"")} data={clips} keyExtractor={clip=>clip.id}
 pagingEnabled snapToInterval={height} decelerationRate="fast" disableIntervalMomentum showsVerticalScrollIndicator={false}
 initialScrollIndex={clips.length&&tab==="For You"?target:undefined} onViewableItemsChanged={visible} viewabilityConfig={viewability}
 onEndReached={()=>{if(base.length)setCount(current=>current+PAGE);}} onEndReachedThreshold={1}
 initialNumToRender={1} maxToRenderPerBatch={2} windowSize={3} getItemLayout={(_,index)=>({length:height,offset:height*index,index})}
 ListEmptyComponent={<View style={{height,alignItems:"center",justifyContent:"center",padding:35,gap:16}}><Text style={{fontSize:25,color:"#fff",fontWeight:"700",textAlign:"center"}}>Your people. Their work.</Text><Text style={{fontSize:14,lineHeight:22,color:"#bbb",textAlign:"center"}}>{following.length?"The creators you follow do not have preview videos here yet. Explore more work in For You.":"Follow creators from For You to see their work here."}</Text><Pressable accessibilityRole="button" onPress={()=>changeTab("For You")} style={{padding:15,backgroundColor:"#fff",borderRadius:25}}><Text style={{fontWeight:"700",color:"#111"}}>Explore For You</Text></Pressable></View>}
 renderItem={({item,index})=><FeedVideo clip={item} height={height} active={focused&&active===index}/>}/>
 </View></View>;
}
