import { useRef, useState } from "react";
import {PostCaption} from "./PostCaption";
import { FlatList, Image, Pressable, Text, View, useWindowDimensions, type ViewToken } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Avatar } from "./social-ui";
import { useUi } from "./ui";
import type { PhotoPost } from "../lib/home";
import { useSocial } from "../state/SocialProvider";
import {useTheme} from "../state/ThemeProvider";
import {JobeenShareSheet} from "./JCardShareSheet";

/** Identical action strip for demo and real posts, adaptive to narrow Android screens. */
export function PostEngagementRow({likes,comments,shares,liked,onLike,onComments,onShare,saved=false,onSave,likeDisabled=false,saveDisabled=false}:{
 likes:number;comments:number;shares:number;liked:boolean;saved?:boolean;
 onLike:()=>void;onComments?:()=>void;onShare:()=>void;onSave?:()=>void;
 likeDisabled?:boolean;saveDisabled?:boolean;
}){
 const {s,colors}=useUi();
 const {width}=useWindowDimensions();const compact=width<360;
 const action={minHeight:44,minWidth:compact?38:44,flexDirection:"row" as const,alignItems:"center" as const,justifyContent:"flex-start" as const,gap:compact?3:6};
 const countStyle=[s.muted,compact?{fontSize:11}:null];
 const commentContents=<><Ionicons name="chatbubble-outline" size={20} color={colors.ink}/><Text style={countStyle}>{comments}</Text></>;
 return <View style={{flexDirection:"row",alignItems:"center",justifyContent:"flex-start",gap:compact?7:20,paddingHorizontal:compact?10:16}}>
  <Pressable accessibilityRole="button" accessibilityLabel={(liked?"Quitar Me gusta. ":"Me gusta. ")+likes}
   accessibilityState={{selected:liked,disabled:likeDisabled}} disabled={likeDisabled} onPress={onLike} style={action}>
   <Ionicons name={liked?"heart":"heart-outline"} size={22} color={colors.ink}/><Text style={countStyle}>{likes}</Text>
  </Pressable>
  {onComments?<Pressable accessibilityRole="button" accessibilityLabel={"Comentarios: "+comments} onPress={onComments} style={action}>{commentContents}</Pressable>:
   <View accessibilityLabel={"Comentarios: "+comments} style={action}>{commentContents}</View>}
  <Pressable accessibilityRole="button" accessibilityLabel={"Compartir publicación. Compartidos: "+shares} onPress={onShare} style={action}>
   <Ionicons name="arrow-redo-outline" size={22} color={colors.ink}/><Text style={countStyle}>{shares}</Text>
  </Pressable>
  {onSave&&<Pressable accessibilityRole="button" accessibilityLabel={saved?"Quitar de guardados":"Guardar publicación"}
   accessibilityState={{selected:saved,disabled:saveDisabled}} disabled={saveDisabled} onPress={onSave}
   style={{marginLeft:"auto",width:44,minHeight:44,alignItems:"flex-end",justifyContent:"center"}}>
   <Ionicons name={saved?"bookmark":"bookmark-outline"} size={24} color={colors.ink}/>
  </Pressable>}
 </View>;
}

export function PhotoCarousel({ post }: { post: Pick<PhotoPost, "photos" | "author"> & {altTexts?:string[]} }) {
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
        renderItem={({ item,index:photoIndex }) => <Image source={{ uri: item }} accessibilityLabel={post.altTexts?.[photoIndex]||"Foto de "+post.author} style={{ width, aspectRatio: 1, backgroundColor: colors.accent }} />} />
      <View style={{ flexDirection: "row", justifyContent: "center", gap: 6, paddingVertical: 8 }}>
        {post.photos.map((_, i) => <View key={i} style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: i === index ? colors.ink : colors.line }} />)}
      </View>
    </View>
  );
}

export function VideoCard({ id, poster, author, handle, avatar, caption, likes, comments, shares = 0, onOpen }: {
  id: string; poster: string; author: string; handle: string; avatar?: string; caption: string; likes: number; comments: number; shares?: number; onOpen: () => void;
}) {
  const { s, colors } = useUi();const {theme}=useTheme();
  const [shareOpen,setShareOpen]=useState(false);
  const { likedPosts, toggleLike, shares: demoShares, addShare, savedPosts, toggleSave } = useSocial();
  const liked = likedPosts.includes(id);
  function shareVideo(){setShareOpen(true);}
  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16 }}>
        <Avatar uri={avatar} name={author} size={34} />
        <View style={{ flex: 1 }}><Text style={s.h3}>{author}</Text><Text style={s.muted}>@{handle}</Text></View>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel={"Abrir video de " + author} onPress={onOpen} style={{ alignItems: "center", justifyContent: "center" }}>
        <Image source={{ uri: poster }} style={{ width: "100%", aspectRatio: 9 / 12, backgroundColor: colors.accent }} />
        <Ionicons name="play-circle" size={56} color={colors.mediaPosterPlay} style={{ position: "absolute",backgroundColor:colors.mediaControl,borderRadius:28 }} />
      </Pressable>
      <PostCaption text={caption}/>
      <PostEngagementRow likes={likes + (liked ? 1 : 0)} comments={comments} shares={shares + (demoShares[id] || 0)}
        liked={liked} onLike={() => toggleLike(id)} onShare={() => void shareVideo()}
         saved={savedPosts.includes(id)} onSave={()=>toggleSave(id)} />
      <JobeenShareSheet visible={shareOpen} onClose={()=>setShareOpen(false)} theme={theme} label={author}
       contentTitle="Compartir video" contentMessage={author+": "+caption} onShared={()=>addShare(id)}/>
    </View>
  );
}

export function PhotoPostCard({ post }: { post: PhotoPost }) {
  const { s } = useUi();const {theme}=useTheme();
  const [shareOpen,setShareOpen]=useState(false);
  const { likedPosts, toggleLike, shares: demoShares, addShare, comments: demoComments, savedPosts, toggleSave } = useSocial();
  const liked = likedPosts.includes(post.id);
  function sharePhoto(){setShareOpen(true);}
  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16 }}>
        <Avatar uri={post.avatar || undefined} name={post.author} size={34} />
        <View style={{ flex: 1 }}><Text style={s.h3}>{post.author}</Text><Text style={s.muted}>@{post.handle}</Text></View>
      </View>
      <PhotoCarousel post={post} />
      <PostCaption text={post.caption}/>
      <PostEngagementRow likes={post.likes + (liked ? 1 : 0)} comments={(demoComments[post.id] || []).length} shares={demoShares[post.id] || 0}
        liked={liked} onLike={() => toggleLike(post.id)} onShare={() => void sharePhoto()}
         saved={savedPosts.includes(post.id)} onSave={()=>toggleSave(post.id)} />
      <JobeenShareSheet visible={shareOpen} onClose={()=>setShareOpen(false)} theme={theme} label={post.author}
       contentTitle="Compartir publicación" contentMessage={post.author+": "+post.caption} onShared={()=>addShare(post.id)}/>
    </View>
  );
}
