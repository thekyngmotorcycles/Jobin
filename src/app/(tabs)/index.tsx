import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SocialHeader } from "../../components/SocialHeader";
import { PhotoPostCard, VideoCard } from "../../components/PostCard";
import { FEED_POSTS } from "../../lib/feed";
import { PHOTO_POSTS, POSTERS } from "../../lib/home";
import { router } from "expo-router";
import { useUi } from "../../components/ui";

export default function Home() {
  const { s } = useUi();
  const cards = [
    ...FEED_POSTS.slice(0, 2).map(p => ({ kind: "video" as const, key: p.postId, post: p })),
    ...PHOTO_POSTS.map(p => ({ kind: "photo" as const, key: p.id, post: p })),
    ...FEED_POSTS.slice(2).map(p => ({ kind: "video" as const, key: p.postId, post: p })),
  ];
  return (
    <SafeAreaView edges={["top", "left", "right"]} style={s.screen}>
      <ScrollView contentContainerStyle={{ paddingBottom: 24, gap: 24 }} showsVerticalScrollIndicator={false}>
        <SocialHeader />
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
    </SafeAreaView>
  );
}
