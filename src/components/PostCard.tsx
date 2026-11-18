import { useRef, useState } from "react";
import { Alert, FlatList, Image, Pressable, Share, Text, View, useWindowDimensions, type ViewToken } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Avatar } from "./social-ui";
import { useUi } from "./ui";
import type { PhotoPost } from "../lib/home";
import { useSocial } from "../state/SocialProvider";

/** Shared Home engagement layout. Demo and published cards use the same sizes and alignment. */
export function PostEngagementRow({ likes, comments, shares, liked, onLike, onComments, onShare, likeDisabled = false }: {
  likes: number; comments: number; shares: number; liked: boolean;
  onLike: () => void; onComments?: () => void; onShare: () => void; likeDisabled?: boolean;
}) {
  const { s, colors } = useUi();
  const action = { minHeight: 44, minWidth: 44, flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "flex-start" as const, gap: 6 };
  const commentContents = <>
    <Ionicons name="chatbubble-outline" size={20} color={colors.ink} />
    <Text style={s.muted}>{comments}</Text>
  </>;
  return <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "flex-start", gap: 20, paddingHorizontal: 16 }}>
    <Pressable accessibilityRole="button" accessibilityLabel={(liked ? "Quitar Me gusta. " : "Me gusta. ") + likes} accessibilityState={{ selected: liked, disabled: likeDisabled }}
      disabled={likeDisabled} onPress={onLike} style={action}>
      <Ionicons name={liked ? "heart" : "heart-outline"} size={22} color={colors.ink} />
      <Text style={s.muted}>{likes}</Text>
    </Pressable>
    {onComments ? <Pressable accessibilityRole="button" accessibilityLabel={"Comentarios: " + comments} onPress={onComments} style={action}>{commentContents}</Pressable>
      : <View accessibilityLabel={"Comentarios: " + comments} style={action}>{commentContents}</View>}
    <Pressable accessibilityRole="button" accessibilityLabel={"Compartir publicación. Compartidos: " + shares} onPress={onShare} style={action}>
      <Ionicons name="arrow-redo-outline" size={22} color={colors.ink} />
      <Text style={s.muted}>{shares}</Text>
    </Pressable>
  </View>;
}

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

export function VideoCard({ id, poster, author, handle, avatar, caption, likes, comments, shares = 0, onOpen }: {
  id: string; poster: string; author: string; handle: string; avatar?: string; caption: string; likes: number; comments: number; shares?: number; onOpen: () => void;
}) {
  const { s, colors } = useUi();
  const { likedPosts, toggleLike, shares: demoShares, addShare } = useSocial();
  const liked = likedPosts.includes(id);
  async function shareVideo() {
    try {
      const result = await Share.share({ message: author + ": " + caption });
      if (result.action === Share.sharedAction) addShare(id);
    } catch { Alert.alert("Compartir", "No se pudo compartir esta publicación."); }
  }
  return (
    <View style={{ gap: 10 }}>
      <Pressable accessibilityRole="button" accessibilityLabel={"Abrir video de " + author} onPress={onOpen} style={{ alignItems: "center", justifyContent: "center" }}>
        <Image source={{ uri: poster }} style={{ width: "100%", aspectRatio: 9 / 12, backgroundColor: colors.accent }} />
        <Ionicons name="play-circle" size={56} color={colors.mediaPosterPlay} style={{ position: "absolute",backgroundColor:colors.mediaControl,borderRadius:28 }} />
      </Pressable>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16 }}>
        <Avatar uri={avatar} name={author} size={34} />
        <View style={{ flex: 1 }}><Text style={s.h3}>{author}</Text><Text style={s.muted}>@{handle}</Text></View>
      </View>
      <Text style={[s.text, { paddingHorizontal: 16 }]}>{caption}</Text>
      <PostEngagementRow likes={likes + (liked ? 1 : 0)} comments={comments} shares={shares + (demoShares[id] || 0)}
        liked={liked} onLike={() => toggleLike(id)} onShare={() => void shareVideo()} />
    </View>
  );
}

export function PhotoPostCard({ post }: { post: PhotoPost }) {
  const { s, colors } = useUi();
  const { likedPosts, toggleLike, shares: demoShares, addShare, comments: demoComments } = useSocial();
  const liked = likedPosts.includes(post.id);
  async function sharePhoto() {
    try {
      const result = await Share.share({ message: post.author + ": " + post.caption });
      if (result.action === Share.sharedAction) addShare(post.id);
    } catch { Alert.alert("Compartir", "No se pudo compartir esta publicación."); }
  }
  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16 }}>
        <Avatar uri={post.avatar || undefined} name={post.author} size={34} />
        <View style={{ flex: 1 }}><Text style={s.h3}>{post.author}</Text><Text style={s.muted}>@{post.handle}</Text></View>
      </View>
      <PhotoCarousel post={post} />
      <Text style={[s.text, { paddingHorizontal: 16 }]}>{post.caption}</Text>
      <PostEngagementRow likes={post.likes + (liked ? 1 : 0)} comments={(demoComments[post.id] || []).length} shares={demoShares[post.id] || 0}
        liked={liked} onLike={() => toggleLike(post.id)} onShare={() => void sharePhoto()} />
    </View>
  );
}
