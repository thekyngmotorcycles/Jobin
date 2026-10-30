import { useRef, useState } from "react";
import { FlatList, Image, Pressable, Text, View, useWindowDimensions, type ViewToken } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Avatar } from "./social-ui";
import { useUi } from "./ui";
import type { PhotoPost } from "../lib/home";
import { useSocial } from "../state/SocialProvider";

export function PhotoCarousel({ post }: { post: PhotoPost }) {
  const { colors } = useUi();
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const onViewable = useRef(({ viewableItems }: { viewableItems: ViewToken<string>[] }) => {
    if (viewableItems[0]?.index != null) setIndex(viewableItems[0].index);
  }).current;
  return (
    <View>
      <FlatList data={post.photos} horizontal pagingEnabled showsHorizontalScrollIndicator={false} keyExtractor={uri => uri}
        onViewableItemsChanged={onViewable} viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
        renderItem={({ item }) => <Image source={{ uri: item }} accessibilityLabel={"Foto de " + post.author} style={{ width, aspectRatio: 1, backgroundColor: colors.accent }} />} />
      <View style={{ flexDirection: "row", justifyContent: "center", gap: 6, paddingVertical: 8 }}>
        {post.photos.map((_, i) => <View key={i} style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: i === index ? colors.ink : colors.line }} />)}
      </View>
    </View>
  );
}

export function VideoCard({ id, poster, author, handle, avatar, caption, likes, comments, onOpen }: {
  id: string; poster: string; author: string; handle: string; avatar?: string; caption: string; likes: number; comments: number; onOpen: () => void;
}) {
  const { s, colors } = useUi();
  const { likedPosts, toggleLike } = useSocial();
  const liked = likedPosts.includes(id);
  return (
    <View style={{ gap: 10 }}>
      <Pressable accessibilityRole="button" accessibilityLabel={"Abrir video de " + author} onPress={onOpen} style={{ alignItems: "center", justifyContent: "center" }}>
        <Image source={{ uri: poster }} style={{ width: "100%", aspectRatio: 9 / 12, backgroundColor: colors.accent }} />
        <Ionicons name="play-circle" size={56} color="#ffffffd9" style={{ position: "absolute" }} />
      </Pressable>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16 }}>
        <Avatar uri={avatar} name={author} size={34} />
        <View style={{ flex: 1 }}><Text style={s.h3}>{author}</Text><Text style={s.muted}>@{handle}</Text></View>
      </View>
      <Text style={[s.text, { paddingHorizontal: 16 }]}>{caption}</Text>
      <View style={{ flexDirection: "row", gap: 20, paddingHorizontal: 16 }}>
        <Pressable accessibilityRole="button" accessibilityLabel={liked ? "Quitar me gusta" : "Me gusta"} onPress={() => toggleLike(id)} style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
          <Ionicons name={liked ? "heart" : "heart-outline"} size={22} color={colors.ink} />
          <Text style={s.muted}>{likes + (liked ? 1 : 0)}</Text>
        </Pressable>
        <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}><Ionicons name="chatbubble-outline" size={20} color={colors.ink} /><Text style={s.muted}>{comments}</Text></View>
      </View>
    </View>
  );
}

export function PhotoPostCard({ post }: { post: PhotoPost }) {
  const { s, colors } = useUi();
  const { likedPosts, toggleLike } = useSocial();
  const liked = likedPosts.includes(post.id);
  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16 }}>
        <Avatar uri={post.avatar || undefined} name={post.author} size={34} />
        <View style={{ flex: 1 }}><Text style={s.h3}>{post.author}</Text><Text style={s.muted}>@{post.handle}</Text></View>
      </View>
      <PhotoCarousel post={post} />
      <Text style={[s.text, { paddingHorizontal: 16 }]}>{post.caption}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel={liked ? "Quitar me gusta" : "Me gusta"} onPress={() => toggleLike(post.id)} style={{ flexDirection: "row", gap: 6, alignItems: "center", paddingHorizontal: 16 }}>
        <Ionicons name={liked ? "heart" : "heart-outline"} size={22} color={colors.ink} />
        <Text style={s.muted}>{post.likes + (liked ? 1 : 0)}</Text>
      </Pressable>
    </View>
  );
}
