import { useState } from "react";
import { FlatList, Text, View, type ViewToken } from "react-native";
import { useIsFocused } from "@react-navigation/native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, useUi } from "../../components/ui";
import { FeedVideo } from "../../components/FeedVideo";
export default function Home() {
 const {s,colors}=useUi(); const [active,setActive]=useState(0);const [height,setHeight]=useState(600); const focused=useIsFocused();
 function visible({viewableItems}:{viewableItems:ViewToken<number>[]}){if(viewableItems[0])setActive(viewableItems[0].index??0);}
 return <SafeAreaView style={s.screen} edges={["top","left","right"]}>
 <View style={{paddingHorizontal:20,paddingVertical:10,flexDirection:"row",alignItems:"center",justifyContent:"space-between",borderBottomWidth:1,borderBottomColor:colors.line}}>
 <Text style={[s.h2,{fontSize:32}]}>jobin.</Text><Text style={s.muted}>Para ti</Text><Button title="● Live" onPress={()=>router.push("/live")}/></View>
 <View style={{flex:1}} onLayout={e=>setHeight(Math.max(250,e.nativeEvent.layout.height))}>
 <FlatList key={Math.round(height)} data={[0,1,2]} keyExtractor={item=>String(item)} pagingEnabled snapToInterval={height} decelerationRate="fast"
 showsVerticalScrollIndicator={false} onViewableItemsChanged={visible} viewabilityConfig={{itemVisiblePercentThreshold:65}}
 renderItem={({item})=><View style={{height,padding:8,width:"100%",maxWidth:700,alignSelf:"center"}}><FeedVideo index={item} height={height-16} active={focused&&active===item}/></View>}/>
 </View></SafeAreaView>;
}
