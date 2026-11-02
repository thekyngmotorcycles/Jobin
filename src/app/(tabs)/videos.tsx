import { useTheme } from "../../state/ThemeProvider";
import { useMemo, useRef, useState } from "react";
import { Animated, FlatList, View, type ViewToken } from "react-native";
import { useIsFocused } from "@react-navigation/native";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FeedVideo } from "../../components/FeedVideo";
import { FeedTopBar } from "../../components/FeedTopBar";
import {WorkCategoryFilters,type WorkFilter} from "../../components/WorkCategoryFilters";
import { FEED_POSTS, visiblePosts, type FeedClip, type FeedTab } from "../../lib/feed";
import { useSocial } from "../../state/SocialProvider";

const PAGE = 6;

export default function Videos() {
  const {theme,colors}=useTheme();
  const { following } = useSocial();
  const focused = useIsFocused();
  const inset = useSafeAreaInsets();
  const { post } = useLocalSearchParams<{ post?: string }>();
  const [tab, setTab] = useState<FeedTab>("Para ti");
  const [category,setCategory]=useState<WorkFilter>("Todo");
  const scrollY=useRef(new Animated.Value(0)).current;
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
    if (viewableItems[0]) setActive(viewableItems[0].index ?? 0);
  }).current;
  const viewability = useRef({ itemVisiblePercentThreshold: 65 }).current;
  function changeTab(next: FeedTab) { setTab(next); setActive(0); setCount(PAGE);scrollY.setValue(0); }
  function changeCategory(next:WorkFilter){setCategory(next);setActive(0);setCount(PAGE);scrollY.setValue(0);}

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper }}>
      {focused && <StatusBar translucent backgroundColor={colors.transparent} style={theme==="dark"?"light":"dark"} />}
      <View style={{ position: "absolute", top: inset.top + 4, left: 8, right: 8, zIndex: 20 }}>
        <FeedTopBar overlay videoMode tab={tab} onTab={changeTab} plusLabel="Subir video" onPlus={() => router.navigate("/create")} onSearch={() => router.push("/search")} />
      </View>
      <View style={{position:"absolute",top:inset.top+70,left:0,right:0,zIndex:19}}><WorkCategoryFilters selected={category} onSelect={changeCategory} scrollY={scrollY}/></View>
      <View style={{ flex: 1 }} onLayout={e => setHeight(Math.max(1, e.nativeEvent.layout.height))}>
        <FlatList key={tab + category + Math.round(height) + (post || "")} data={clips} keyExtractor={clip => clip.id}
          pagingEnabled snapToInterval={height} decelerationRate="fast" disableIntervalMomentum showsVerticalScrollIndicator={false}
          initialScrollIndex={clips.length && tab === "Para ti" ? target : undefined} onViewableItemsChanged={visible} viewabilityConfig={viewability}
          onScroll={event=>scrollY.setValue(event.nativeEvent.contentOffset.y)} scrollEventThrottle={16}
          onEndReached={() => { if (filtered.length) setCount(current => current + PAGE); }} onEndReachedThreshold={1}
          initialNumToRender={1} maxToRenderPerBatch={2} windowSize={3} getItemLayout={(_, index) => ({ length: height, offset: height * index, index })}
          renderItem={({ item, index }) => <FeedVideo clip={item} height={height} active={focused && active === index} />} />
      </View>
    </View>
  );
}
