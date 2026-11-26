import {type ReactNode} from "react";
import {Text,View,useWindowDimensions} from "react-native";
import {jcardProfileIdentitySpace,type JCardProfilePortraitMetrics} from "../theme/jcard";
import {fitJCardProfileName,JCARD_NAME_BADGE_WIDTH,JCARD_NAME_BADGE_GAP} from "../lib/jcard-profile-name";
type Props={portrait:JCardProfilePortraitMetrics;side:"personal"|"business";name:string;subtitle:string;ink:string;muted:string;badge:ReactNode;verification:string;subtitleIcon?:ReactNode;parentPadding?:number};
/** Static identity: one line, no identity dialog, full accessible name. */
export function JCardProfileIdentity({portrait,side,name,subtitle,ink,muted,badge,verification,subtitleIcon,parentPadding=0}:Props){
 const {fontScale}=useWindowDimensions();
 const space=jcardProfileIdentitySpace(portrait,fontScale,side);
 const fit=fitJCardProfileName(name,space.width,portrait.cardWidth,fontScale);
 const align="left";
 const justify="flex-start";
 return <View style={{paddingLeft:Math.max(0,space.paddingLeft-parentPadding),paddingRight:Math.max(0,space.paddingRight-parentPadding),
    paddingTop:space.paddingTop,paddingBottom:space.paddingBottom,minHeight:space.minHeight,flexShrink:0,justifyContent:"center"}}>
   <View accessible accessibilityLabel={name+", "+verification} style={{height:space.nameHeight,flexDirection:"row",justifyContent:justify,alignItems:"center",gap:JCARD_NAME_BADGE_GAP}}>
      <Text numberOfLines={1} ellipsizeMode="tail" adjustsFontSizeToFit={fit.fontSize>fit.min} minimumFontScale={fit.min/fit.fontSize}
       style={{flexShrink:1,minWidth:0,fontSize:fit.fontSize,lineHeight:space.lineHeight,includeFontPadding:false,fontWeight:"600",color:ink,textAlign:align}}>{fit.lines[0]}</Text>
      <View pointerEvents="none" style={{width:JCARD_NAME_BADGE_WIDTH,flexShrink:0,alignItems:"center",justifyContent:"center"}}>{badge}</View>
   </View>
   <View style={{height:space.subtitleHeight,flexDirection:"row",alignItems:"center",justifyContent:justify,gap:4}}>
    {subtitleIcon}
    <Text accessibilityLabel={subtitle} numberOfLines={1} ellipsizeMode="tail" style={{flexShrink:1,minWidth:0,fontSize:12,lineHeight:16,includeFontPadding:false,color:muted,textAlign:align}}>{subtitle}</Text>
   </View>
  </View>;
}
