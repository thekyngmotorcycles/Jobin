import { useState } from "react";
import { useIsFocused } from "@react-navigation/native";
import { useWindowDimensions } from "react-native";
import { DraggableAssistant } from "../../components/DraggableAssistant";
import { useTabClearance } from "../../theme/navigation";
import { PublishedWorkMedia } from "../../components/PublishedWorkMedia";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SocialHeader } from "../../components/SocialHeader";
import { PhotoPostCard, VideoCard } from "../../components/PostCard";
import { FEED_POSTS } from "../../lib/feed";
import { PHOTO_POSTS, POSTERS } from "../../lib/home";
import { router } from "expo-router";
import { useUi } from "../../components/ui";

export default function Home() {
  const { s } = useUi();const focused=useIsFocused();const window=useWindowDimensions();const [viewport,setViewport]=useState({width:window.width,height:window.height});const {contentBottom}=useTabClearance();
  const cards = [
    ...FEED_POSTS.slice(0, 2).map(p => ({ kind: "video" as const, key: p.postId, post: p })),
    ...PHOTO_POSTS.map(p => ({ kind: "photo" as const, key: p.id, post: p })),
    ...FEED_POSTS.slice(2).map(p => ({ kind: "video" as const, key: p.postId, post: p })),
  ];
  return (
    <SafeAreaView edges={["top", "left", "right"]} style={s.screen} onLayout={event=>setViewport(event.nativeEvent.layout)}>
      <ScrollView contentContainerStyle={{ paddingBottom: contentBottom, gap: 24 }} showsVerticalScrollIndicator={false}>
        <SocialHeader />
        <PublishedWorkMedia kind="video"/>
        {cards.map(card => (
          <View key={card.key}>
            {card.kind === "video" ? (
              <VideoCard id={card.post.postId} poster={POSTERS[card.post.postId]} author={card.post.author} handle={card.post.handle}
                avatar={card.post.avatar} caption={card.post.caption} likes={card.post.likes} comments={card.post.comments}
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
