import {Ionicons} from "@expo/vector-icons";
import type {ComponentProps,ReactNode} from "react";
import {Image,Pressable,ScrollView,Text,View,useWindowDimensions} from "react-native";
import {PageFrame} from "./ui";
import {jshopItemGeometry} from "./JShopListingSkeleton";
import {useTheme} from "../state/ThemeProvider";
import {JOBEEN_TYPE,JOBEEN_LINE_HEIGHT} from "../theme/typography";
import {JOBEEN_CONTROL} from "../theme/control-metrics";
import {jobeenTokens} from "../theme/jobeen";
import {JSHOP_CATEGORIES,formatJShopPrice,type JShopDraft,type JShopListing} from "../lib/jshop-model";

type Icon=ComponentProps<typeof Ionicons>["name"];
export function JShopButton({title,onPress,icon,secondary=false,disabled=false,compact=false}:{
 title:string;onPress:()=>void;icon?:Icon;secondary?:boolean;disabled?:boolean;compact?:boolean;
}){
 const {theme}=useTheme();const t=jobeenTokens(theme);
 return <Pressable accessibilityRole="button" accessibilityLabel={title} disabled={disabled} onPress={onPress}
  style={({pressed})=>({minHeight:JOBEEN_CONTROL.touchTarget,paddingHorizontal:compact?13:18,paddingVertical:10,flexDirection:"row",alignItems:"center",justifyContent:"center",gap:8,borderRadius:JOBEEN_CONTROL.buttonRadius,
   borderWidth:secondary?1:0,borderColor:t.outline,backgroundColor:secondary?t.surface:t.yellow,opacity:disabled?0.45:pressed?0.75:1})}>
  {!!icon&&<Ionicons name={icon} size={19} color={secondary?t.ink:t.onYellow}/>}
  <Text style={{color:secondary?t.ink:t.onYellow,fontSize:JOBEEN_TYPE.action,lineHeight:JOBEEN_LINE_HEIGHT.action,fontWeight:"700",flexShrink:1,textAlign:"center"}}>{title}</Text>
 </Pressable>;
}
export function JShopIconButton({icon,label,onPress,selected=false,disabled=false}:{
 icon:Icon;label:string;onPress:()=>void;selected?:boolean;disabled?:boolean;
}){
 const {theme}=useTheme();const t=jobeenTokens(theme);
 return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{selected,disabled}} disabled={disabled} onPress={onPress}
  style={({pressed})=>({height:JOBEEN_CONTROL.touchTarget,width:JOBEEN_CONTROL.touchTarget,borderRadius:JOBEEN_CONTROL.buttonRadius,borderWidth:1,borderColor:t.outline,backgroundColor:selected?t.cream:t.surface,alignItems:"center",justifyContent:"center",opacity:disabled?0.42:pressed?0.7:1})}>
  <Ionicons name={icon} size={JOBEEN_CONTROL.icon} color={t.ink}/>
 </Pressable>;
}
export function JShopPage({children}:{children:ReactNode}){
 return <PageFrame kind="management" bottomPadding={42}>{children}</PageFrame>;
}
export function JShopTitle({title,subtitle,right}:{
 title:string;subtitle?:string;right?:ReactNode;
}){
 const {theme}=useTheme();const t=jobeenTokens(theme);
 return <View style={{flexDirection:"row",alignItems:"center",justifyContent:"space-between",gap:12}}>
  <View style={{flex:1,gap:3}}>
   <Text accessibilityRole="header" style={{fontSize:JOBEEN_TYPE.pageTitle,fontWeight:"800",letterSpacing:-0.5,color:t.ink}}>{title}</Text>
   {!!subtitle&&<Text style={{fontSize:JOBEEN_TYPE.body,lineHeight:JOBEEN_LINE_HEIGHT.body,color:t.ink2}}>{subtitle}</Text>}
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
   style={({pressed})=>({minHeight:JOBEEN_CONTROL.touchTarget,paddingHorizontal:12,paddingVertical:8,borderRadius:22,borderWidth:1,borderColor:value===category?t.ink:t.outline,backgroundColor:value===category?t.ink:t.surface,justifyContent:"center",opacity:pressed?0.72:1})}>
   <Text style={{fontSize:JOBEEN_TYPE.secondary,fontWeight:value===category?"700":"600",color:value===category?t.bg:t.ink}}>{category}</Text>
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
 const {width}=useWindowDimensions();
 const {imageSize,gap,minHeight,padding}=jshopItemGeometry(width);
 return <Pressable accessibilityRole="button" accessibilityLabel={"Ver "+item.title} onPress={onOpen}
  style={({pressed})=>({width:"100%",minHeight,borderRadius:JOBEEN_CONTROL.cardRadius,padding,backgroundColor:t.surface,
   borderWidth:1,borderColor:t.line,flexDirection:"row",alignItems:"flex-start",gap,opacity:pressed?0.8:1})}>
  <View style={{width:imageSize,flexShrink:0}}>
   <JShopPhoto uri={item.photos[0]}/>
   {draft?<View style={{position:"absolute",top:6,left:6,backgroundColor:t.cream,paddingVertical:4,paddingHorizontal:6,borderRadius:8}}>
    <Text style={{fontSize:10,color:t.ink,fontWeight:"700"}}>Borrador</Text>
   </View>:item.status!=="published"?<View style={{position:"absolute",top:6,left:6,backgroundColor:t.cream,paddingVertical:4,paddingHorizontal:6,borderRadius:8}}>
    <Text style={{fontSize:10,color:t.ink,fontWeight:"700"}}>{item.status==="sold"?"Vendido":"Pausado"}</Text>
   </View>:null}
  </View>
  <View style={{flex:1,minWidth:0,gap:6}}>
   <Text numberOfLines={2} style={{color:t.ink,fontWeight:"700",fontSize:JOBEEN_TYPE.body,lineHeight:JOBEEN_LINE_HEIGHT.body}}>{item.title}</Text>
   <Text numberOfLines={1} style={{color:t.ink,fontSize:JOBEEN_TYPE.sectionTitle,fontWeight:"800"}}>{formatJShopPrice(item.price,item.currency)}</Text>
   <Text numberOfLines={2} style={{color:t.ink2,fontSize:12}}>{item.condition}{item.location?" · "+item.location:""}</Text>
   {!draft&&<Text numberOfLines={1} style={{color:t.ink2,fontSize:12}}>{item.sellerName}</Text>}
  </View>
  {!!onFavorite&&<Pressable accessibilityRole="button" accessibilityLabel={saved?"Quitar de guardados":"Guardar favorito"}
   onPress={event=>{event.stopPropagation();onFavorite();}}
   style={{width:JOBEEN_CONTROL.touchTarget,height:JOBEEN_CONTROL.touchTarget,borderRadius:24,backgroundColor:t.cream,alignItems:"center",justifyContent:"center"}}>
   <Ionicons name={saved?"heart":"heart-outline"} size={20} color={t.ink}/>
  </Pressable>}
 </Pressable>;
}
export function JShopEmpty({icon,title,description,action}:{
 icon:Icon;title:string;description:string;action?:{title:string;onPress:()=>void};
}){
 const {theme}=useTheme();const t=jobeenTokens(theme);
 return <View style={{borderWidth:1,borderColor:t.line,borderRadius:JOBEEN_CONTROL.cardRadius,backgroundColor:t.surface,paddingHorizontal:22,paddingVertical:34,alignItems:"center",gap:12}}>
  <View style={{width:66,height:66,borderRadius:24,backgroundColor:t.cream,alignItems:"center",justifyContent:"center"}}>
   <Ionicons name={icon} size={30} color={t.ink}/>
  </View>
  <Text style={{fontSize:17,fontWeight:"800",color:t.ink,textAlign:"center"}}>{title}</Text>
  <Text style={{fontSize:13,lineHeight:20,color:t.ink2,textAlign:"center"}}>{description}</Text>
  {action&&<View style={{marginTop:6}}><JShopButton title={action.title} onPress={action.onPress} icon="arrow-forward-outline"/></View>}
 </View>;
}
