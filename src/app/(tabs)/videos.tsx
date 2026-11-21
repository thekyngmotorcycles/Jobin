import { useTheme } from "../../state/ThemeProvider";
import { useMemo, useRef, useState } from "react";
import { FlatList, View, type ViewToken } from "react-native";
import {useScrollNavigation} from "../../state/ScrollNavigation";
import { useIsFocused } from "@react-navigation/native";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FeedVideo } from "../../components/FeedVideo";
import { FeedTopBar } from "../../components/FeedTopBar";
import {type WorkFilter} from "../../components/WorkCategoryFilters";
import { FEED_POSTS, visiblePosts, type FeedClip, type FeedTab } from "../../lib/feed";
import { useSocial } from "../../state/SocialProvider";

const PAGE = 6;

export default function Videos() {
 const {reportScroll}=useScrollNavigation();
  const {theme,colors}=useTheme();
  const { following } = useSocial();
  const focused = useIsFocused();
  const inset = useSafeAreaInsets();
  const { post } = useLocalSearchParams<{ post?: string }>();
  const [tab, setTab] = useState<FeedTab>("Para ti");
  const [category,setCategory]=useState<WorkFilter>("Todo");
  const [count, setCount] = useState(PAGE);
  const [active, setActive] = useState(0);
  const [height, setHeight] = useState(600);
  const base = useMemo(() => visiblePosts(tab, following), [tab, following]);
  const filtered=useMemo(()=>base.filter(clip=>{
   const role=clip.role.toLowerCase();
   if(category==="Todo")return true;
   if(category==="Servicios")return /barber|designer|técnic|servicio/.test(role);
   if(category==="Educación")return /trainer|teacher|profesor|instructor/.test(role);
   if(category==="Comercio")return /shop|seller|comercio|venta/.test(role);
   return /developer|software|tecnolog|engineer/.test(role);
  }),[base,category]);
  const clips = useMemo<FeedClip[]>(() => filtered.length ? Array.from({ length: count }, (_, index) => ({ ...filtered[index % filtered.length], id: tab + "-" + category + "-" + index })) : [], [filtered, count, tab,category]);
  const target = post ? Math.max(0, FEED_POSTS.findIndex(p => p.postId === post)) : 0;
  const visible = useRef(({ viewableItems }: { viewableItems: ViewToken<FeedClip>[] }) => {
    if (viewableItems[0]) { const next=viewableItems[0].index ?? 0; setActive(previous=>previous===next?previous:next); }
  }).current;
  const viewability = useRef({ itemVisiblePercentThreshold: 65 }).current;
  function changeTab(next: FeedTab) { setTab(next); setActive(0); setCount(PAGE); }
  function changeCategory(next:WorkFilter){setCategory(next);setActive(0);setCount(PAGE);}

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper }}>
      {focused && <StatusBar translucent backgroundColor={colors.transparent} style={theme==="dark"?"light":"dark"} />}
      <View style={{ position: "absolute", top: inset.top + 4, left: 8, right: 8, zIndex: 20 }}>
        <FeedTopBar tab={tab} onTab={changeTab} category={category} onCategory={changeCategory} leading="live" onLeading={() => router.navigate("/(tabs)/streams")} onSearch={() => router.push({pathname:"/search",params:{mode:"flash"}})} />
      </View>
      <View style={{ flex: 1 }} onLayout={e => { const next=Math.max(1,Math.round(e.nativeEvent.layout.height)); setHeight(previous=>previous===next?previous:next); }}>
        <FlatList onScroll={e=>reportScroll(e.nativeEvent.contentOffset.y)} scrollEventThrottle={16} key={tab + category + Math.round(height) + (post || "")} data={clips} keyExtractor={clip => clip.id}
          pagingEnabled snapToInterval={height} decelerationRate="fast" disableIntervalMomentum showsVerticalScrollIndicator={false}
          initialScrollIndex={clips.length && tab === "Para ti" ? target : undefined} onViewableItemsChanged={visible} viewabilityConfig={viewability}
          onEndReached={() => { if (filtered.length) setCount(current => current + PAGE); }} onEndReachedThreshold={1}
          initialNumToRender={1} maxToRenderPerBatch={2} windowSize={3} getItemLayout={(_, index) => ({ length: height, offset: height * index, index })}
          renderItem={({ item, index }) => <FeedVideo clip={item} height={height} active={focused && active === index} />} />
      </View>
    </View>
  );
}
