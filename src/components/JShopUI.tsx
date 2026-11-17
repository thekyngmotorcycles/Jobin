import {Ionicons} from "@expo/vector-icons";
import type {ComponentProps,ReactNode} from "react";
import {Image,Pressable,ScrollView,Text,View} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";
import {useTheme} from "../state/ThemeProvider";
import {jobeenTokens} from "../theme/jobeen";
import {JSHOP_CATEGORIES,formatJShopPrice,type JShopCategory,type JShopDraft,type JShopListing} from "../lib/jshop-model";

type Icon=ComponentProps<typeof Ionicons>["name"];
export function JShopButton({title,onPress,icon,secondary=false,disabled=false,compact=false}:{
 title:string;onPress:()=>void;icon?:Icon;secondary?:boolean;disabled?:boolean;compact?:boolean;
}){
 const {theme}=useTheme();const t=jobeenTokens(theme);
 return <Pressable accessibilityRole="button" accessibilityLabel={title} disabled={disabled} onPress={onPress}
  style={({pressed})=>({minHeight:compact?44:50,paddingHorizontal:compact?13:18,paddingVertical:10,flexDirection:"row",alignItems:"center",justifyContent:"center",gap:8,borderRadius:18,
   borderWidth:secondary?1:0,borderColor:t.line,backgroundColor:secondary?t.surface:t.ink,opacity:disabled?0.45:pressed?0.75:1})}>
  {!!icon&&<Ionicons name={icon} size={19} color={secondary?t.ink:t.bg}/>}
  <Text style={{color:secondary?t.ink:t.bg,fontSize:14,fontWeight:"700"}} numberOfLines={1}>{title}</Text>
 </Pressable>;
}
export function JShopIconButton({icon,label,onPress,selected=false}:{
 icon:Icon;label:string;onPress:()=>void;selected?:boolean;
}){
 const {theme}=useTheme();const t=jobeenTokens(theme);
 return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{selected}} onPress={onPress}
  style={({pressed})=>({height:46,width:46,borderRadius:16,borderWidth:1,borderColor:t.line,backgroundColor:selected?t.cream:t.surface,alignItems:"center",justifyContent:"center",opacity:pressed?0.7:1})}>
  <Ionicons name={icon} size={22} color={t.ink}/>
 </Pressable>;
}
export function JShopPage({children}:{children:ReactNode}){
 const {theme}=useTheme();const t=jobeenTokens(theme);
 return <SafeAreaView edges={["bottom","left","right"]} style={{flex:1,backgroundColor:t.bg}}>
  <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{padding:16,paddingBottom:42,maxWidth:980,width:"100%",alignSelf:"center",gap:18}}>
   {children}
  </ScrollView>
 </SafeAreaView>;
}
export function JShopTitle({title,subtitle,right}:{
 title:string;subtitle?:string;right?:ReactNode;
}){
 const {theme}=useTheme();const t=jobeenTokens(theme);
 return <View style={{flexDirection:"row",alignItems:"center",justifyContent:"space-between",gap:12}}>
  <View style={{flex:1,gap:3}}>
   <Text accessibilityRole="header" style={{fontSize:24,fontWeight:"800",letterSpacing:-0.5,color:t.ink}}>{title}</Text>
   {!!subtitle&&<Text style={{fontSize:13,lineHeight:19,color:t.ink2}}>{subtitle}</Text>}
  </View>
  {right}
 </View>;
}
export function JShopCategories({value,onChange}:{
 value:(typeof JSHOP_CATEGORIES)[number];onChange:(value:(typeof JSHOP_CATEGORIES)[number])=>void;
}){
 const {theme}=useTheme();const t=jobeenTokens(theme);
 return <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="always" contentContainerStyle={{gap:8,paddingVertical:2,alignItems:"center"}}>
  {JSHOP_CATEGORIES.map(category=><Pressable accessibilityRole="button" accessibilityState={{selected:value===category}} key={category} onPress={()=>onChange(category)}
   style={({pressed})=>({minHeight:43,paddingHorizontal:15,borderRadius:22,borderWidth:1,borderColor:value===category?t.ink:t.line,backgroundColor:value===category?t.ink:t.surface,justifyContent:"center",opacity:pressed?0.72:1})}>
   <Text style={{fontSize:13,fontWeight:value===category?"700":"600",color:value===category?t.bg:t.ink}}>{category}</Text>
  </Pressable>)}
 </ScrollView>;
}
export function JShopPhoto({uri,large=false}:{uri?:string|null;large?:boolean}){
 const {theme}=useTheme();const t=jobeenTokens(theme);
 return <View style={{width:"100%",aspectRatio:large?1.17:1,backgroundColor:t.cream,alignItems:"center",justifyContent:"center",overflow:"hidden",borderRadius:large?20:15}}>
  {!!uri?<Image source={{uri}} resizeMode="cover" style={{width:"100%",height:"100%"}}/>:<Ionicons name="bag-handle-outline" size={large?56:34} color={t.ink2}/>}
 </View>;
}
export function JShopItemCard({item,onOpen,onFavorite,saved=false}:{
 item:JShopListing|JShopDraft;onOpen:()=>void;onFavorite?:()=>void;saved?:boolean;
}){
 const {theme}=useTheme();const t=jobeenTokens(theme);
 const draft="ownerId" in item;
 return <Pressable accessibilityRole="button" accessibilityLabel={"Ver "+item.title} onPress={onOpen}
  style={({pressed})=>({width:"48.5%",borderRadius:20,padding:7,backgroundColor:t.surface,borderWidth:1,borderColor:t.line,gap:7,opacity:pressed?0.8:1})}>
  <View>
   <JShopPhoto uri={item.photos[0]}/>
   {draft?<View style={{position:"absolute",top:8,left:8,backgroundColor:t.cream,paddingVertical:5,paddingHorizontal:8,borderRadius:10}}>
    <Text style={{fontSize:11,color:t.ink,fontWeight:"700"}}>Borrador</Text>
   </View>:onFavorite?<Pressable accessibilityRole="button" accessibilityLabel={saved?"Quitar de guardados":"Guardar favorito"} onPress={event=>{event.stopPropagation();onFavorite();}}
     style={{position:"absolute",top:7,right:7,backgroundColor:t.surface,borderRadius:18,width:36,height:36,alignItems:"center",justifyContent:"center"}}>
     <Ionicons name={saved?"heart":"heart-outline"} size={20} color={t.ink}/>
    </Pressable>:null}
  </View>
  <Text numberOfLines={2} style={{color:t.ink,fontWeight:"700",fontSize:14,lineHeight:19}}>{item.title}</Text>
  <Text style={{color:t.ink,fontSize:16,fontWeight:"800"}}>{formatJShopPrice(item.price,item.currency)}</Text>
  <Text numberOfLines={1} style={{color:t.ink2,fontSize:12}}>{item.condition}{item.location?" · "+item.location:""}</Text>
  {!draft&&<Text numberOfLines={1} style={{color:t.ink2,fontSize:12}}>{item.sellerName}</Text>}
 </Pressable>;
}
export function JShopEmpty({icon,title,description,action}:{
 icon:Icon;title:string;description:string;action?:{title:string;onPress:()=>void};
}){
 const {theme}=useTheme();const t=jobeenTokens(theme);
 return <View style={{borderWidth:1,borderColor:t.line,borderRadius:22,backgroundColor:t.surface,paddingHorizontal:22,paddingVertical:34,alignItems:"center",gap:12}}>
  <View style={{width:66,height:66,borderRadius:24,backgroundColor:t.cream,alignItems:"center",justifyContent:"center"}}>
   <Ionicons name={icon} size={30} color={t.ink}/>
  </View>
  <Text style={{fontSize:17,fontWeight:"800",color:t.ink,textAlign:"center"}}>{title}</Text>
  <Text style={{fontSize:13,lineHeight:20,color:t.ink2,textAlign:"center"}}>{description}</Text>
  {action&&<View style={{marginTop:6}}><JShopButton title={action.title} onPress={action.onPress} icon="arrow-forward-outline"/></View>}
 </View>;
}
