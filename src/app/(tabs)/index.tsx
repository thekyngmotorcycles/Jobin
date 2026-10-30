import { useMemo, useState } from "react";
import { FlatList, Text, View, type ViewToken } from "react-native";
import { useIsFocused } from "@react-navigation/native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Chips, useUi } from "../../components/ui";
import { FeedVideo } from "../../components/FeedVideo";
import { FEED_TABS, feedClip, type FeedClip, type FeedTab } from "../../lib/feed";
const PAGE = 6;
export default function Home() {
 const {s,colors,fs}=useUi(); const [tab,setTab]=useState<FeedTab>("Para ti"); const [count,setCount]=useState(PAGE);
 const [active,setActive]=useState(0); const [height,setHeight]=useState(600); const focused=useIsFocused();
 const clips=useMemo(()=>Array.from({length:count},(_,index)=>feedClip(tab,index)),[tab,count]);
 function visible({viewableItems}:{viewableItems:ViewToken<FeedClip>[]}){if(viewableItems[0])setActive(viewableItems[0].index??0);}
 function changeTab(next:FeedTab){setTab(next);setActive(0);setCount(PAGE);}
 return <SafeAreaView style={s.screen} edges={["top","left","right"]}>
 <View style={{paddingHorizontal:20,paddingVertical:10,gap:10,borderBottomWidth:1,borderBottomColor:colors.line}}>
  <View style={{flexDirection:"row",alignItems:"center",justifyContent:"space-between"}}>
   <Text style={[s.h2,{fontSize:fs(32)}]}>jobin.</Text><Button title="● Live" onPress={()=>router.push("/live")}/></View>
  <Chips values={FEED_TABS} value={tab} onChange={changeTab} label="Feed"/>
 </View>
 <View style={{flex:1}} onLayout={e=>setHeight(Math.max(250,e.nativeEvent.layout.height))}>
 <FlatList key={`${tab}-${Math.round(height)}`} data={clips} keyExtractor={clip=>clip.id} pagingEnabled snapToInterval={height} decelerationRate="fast"
 showsVerticalScrollIndicator={false} onViewableItemsChanged={visible} viewabilityConfig={{itemVisiblePercentThreshold:65}}
 onEndReached={()=>setCount(current=>current+PAGE)} onEndReachedThreshold={1}
 initialNumToRender={1} maxToRenderPerBatch={2} windowSize={3}
 getItemLayout={(_,index)=>({length:height,offset:height*index,index})}
 renderItem={({item,index})=><View style={{height,padding:8,width:"100%",maxWidth:700,alignSelf:"center"}}><FeedVideo clip={item} height={height-16} active={focused&&active===index}/></View>}/>
 </View></SafeAreaView>;
}
