import { useEffect,useRef,useState } from "react";
import { useIsFocused } from "@react-navigation/native";
import { useWindowDimensions } from "react-native";
import { DraggableAssistant } from "../../components/DraggableAssistant";
import { useTabClearance } from "../../theme/navigation";
import {useScrollNavigation} from "../../state/ScrollNavigation";
import { PublishedWorkMedia } from "../../components/PublishedWorkMedia";
import { ScrollView, View,Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SocialHeader } from "../../components/SocialHeader";
import {HomePublishedPosts} from "../../components/HomePublishedPosts";
import {HomeFeedFilters,type HomeFeedFilter} from "../../components/HomeFeedFilters";
import { PhotoPostCard, VideoCard } from "../../components/PostCard";
import { FEED_POSTS } from "../../lib/feed";
import { PHOTO_POSTS, POSTERS } from "../../lib/home";
import { router,useLocalSearchParams } from "expo-router";
import {takePublishedPostForHome} from "../../lib/post-return";
import { useUi } from "../../components/ui";

export default function Home() {
  const [filter,setFilter]=useState<HomeFeedFilter>("all");
  const {published}=useLocalSearchParams<{published?:string}>();
  const [newlyPublished,setNewlyPublished]=useState("");
  const scrollRef=useRef<ScrollView>(null);
  useEffect(()=>{if(published){setFilter("all");scrollRef.current?.scrollTo({y:0,animated:false});}},[published]);
  const { s } = useUi();const focused=useIsFocused();const window=useWindowDimensions();const [viewport,setViewport]=useState({width:window.width,height:window.height});const {contentBottom}=useTabClearance();const {reportScroll}=useScrollNavigation();
  useEffect(()=>{
    if(!focused)return;
    const latest=takePublishedPostForHome();
    if(latest){
      setFilter("all");
      setNewlyPublished(latest);
      scrollRef.current?.scrollTo({y:0,animated:false});
    }
  },[focused]);
  const cards = [
    ...FEED_POSTS.slice(0, 2).map(p => ({ kind: "video" as const, key: p.postId, post: p })),
    ...PHOTO_POSTS.map(p => ({ kind: "photo" as const, key: p.id, post: p })),
    ...FEED_POSTS.slice(2).map(p => ({ kind: "video" as const, key: p.postId, post: p })),
  ];
  return (
    <SafeAreaView edges={["top", "left", "right"]} style={s.screen} onLayout={event=>{const {width,height}=event.nativeEvent.layout;setViewport(previous=>previous.width===width&&previous.height===height?previous:{width,height});}}>
      <ScrollView ref={scrollRef} scrollEventThrottle={16} onScroll={e=>{if(focused)reportScroll(e.nativeEvent.contentOffset.y);}} contentContainerStyle={{ paddingBottom: contentBottom, gap: 24 }} showsVerticalScrollIndicator={false}>
        <SocialHeader showComposer/>
        <HomeFeedFilters value={filter} onChange={setFilter}/>
        <HomePublishedPosts filter={filter} featuredPostId={newlyPublished||(published??"")}/>
        {filter==="all"&&<PublishedWorkMedia kind="video"/>}
        {filter==="all"&&<Text style={[s.muted,{paddingHorizontal:16,fontSize:12}]}>Contenido de ejemplo</Text>}
        {filter==="all"&&cards.map(card => (
          <View key={card.key}>
            {card.kind === "video" ? (
              <VideoCard id={card.post.postId} poster={POSTERS[card.post.postId]} author={card.post.author} handle={card.post.handle}
                avatar={card.post.avatar} caption={card.post.caption} likes={card.post.likes} comments={card.post.comments} shares={card.post.shares}
                onOpen={() => router.navigate({ pathname: "/videos", params: { post: card.post.postId } })} />
            ) : (
              <PhotoPostCard post={card.post} />
            )}
          </View>
        ))}
      </ScrollView>
      {focused&&<DraggableAssistant width={viewport.width} height={viewport.height}/>}
    </SafeAreaView>
  );
}
