import { AccountAvatar } from "./AccountAvatar";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { IconButton } from "./social-ui";
import { HomeSideMenu } from "./HomeSideMenu";
import { JobinWordmark } from "./JobinWordmark";
import { useUi } from "./ui";
import { FEED_POSTS } from "../lib/feed";
import { STORIES } from "../lib/home";
import { rankStories } from "../lib/rules";
import { useSocial } from "../state/SocialProvider";

export function SocialHeader() {
  const { s, colors } = useUi();
  const { likedPosts, following } = useSocial();
  const [menu, setMenu] = useState(false);
  const interactions = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const id of likedPosts) {
      const creator = FEED_POSTS.find(p => p.postId === id)?.creatorId;
      if (creator) counts[creator] = (counts[creator] ?? 0) + 1;
    }
    for (const id of following) counts[id] = (counts[id] ?? 0) + 2;
    return counts;
  }, [likedPosts, following]);
  const stories = rankStories(STORIES, interactions);

  return (
    <View style={{ gap: 14, paddingTop: 8 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 8 }}>
        <IconButton icon="menu" label="Opciones" onPress={() => setMenu(true)} />
        <JobinWordmark width={96} />
        <IconButton icon="search-outline" label="Buscar" onPress={() => router.push("/search")} />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 14 }}>
        {stories.map(story => (
          <Pressable key={story.id} accessibilityRole="button" accessibilityLabel={"Historia de " + story.name}
            style={{ alignItems: "center", gap: 6, width: 64 }}>
            <View style={{ borderWidth: 2, borderColor: colors.ink, borderRadius: 33, padding: 2 }}>
              <AccountAvatar accountId={story.id} fallbackName={story.name} size={52}/>
            </View>
            <Text numberOfLines={1} style={[s.muted, { fontSize: 11 }]}>{story.name}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <HomeSideMenu visible={menu} onClose={() => setMenu(false)}/>
    </View>
  );
}
