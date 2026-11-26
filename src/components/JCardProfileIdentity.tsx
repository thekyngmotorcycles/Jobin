import {useContext,useState,type ReactNode} from "react";
import {Pressable,Text,View,useWindowDimensions} from "react-native";
import {CardFlipInteractionContext} from "./BusinessCard3D";
import {JobeenNoticeDialog} from "./JobeenNoticeDialog";
import {jcardProfileIdentitySpace,type JCardProfilePortraitMetrics} from "../theme/jcard";
import {fitJCardProfileName,JCARD_NAME_BADGE_WIDTH,JCARD_NAME_BADGE_GAP} from "../lib/jcard-profile-name";
type Props={portrait:JCardProfilePortraitMetrics;side:"personal"|"business";name:string;subtitle:string;ink:string;muted:string;badge:ReactNode;verification:string;subtitleIcon?:ReactNode;parentPadding?:number};
export function JCardProfileIdentity({portrait,side,name,subtitle,ink,muted,badge,verification,subtitleIcon,parentPadding=0}:Props){
 const {fontScale}=useWindowDimensions();
 const space=jcardProfileIdentitySpace(portrait,fontScale,side);
 const [dialog,setDialog]=useState(false);
 const markInteractive=useContext(CardFlipInteractionContext);
 const fit=fitJCardProfileName(name,space.width,portrait.cardWidth,fontScale);
 const align=side==="personal"?"left":"right";
 const justify=side==="personal"?"flex-start":"flex-end";
 const close=()=>setDialog(false);
 return <>
  <Pressable accessibilityRole="button" accessibilityLabel={name+", "+verification+", "+subtitle}
   onTouchStart={()=>markInteractive?.()} onPress={event=>{event.stopPropagation();setDialog(true);}}
   style={{paddingLeft:Math.max(0,space.paddingLeft-parentPadding),paddingRight:Math.max(0,space.paddingRight-parentPadding),paddingTop:space.paddingTop,paddingBottom:space.paddingBottom,minHeight:space.minHeight}}>
   <View style={{height:space.nameHeight,justifyContent:"flex-end"}}>
    {fit.lines.map((line,index)=>{
     const last=index===fit.lines.length-1;
     return <View key={index} style={{height:space.nameHeight/2,flexDirection:"row",justifyContent:justify,alignItems:"center",gap:last?JCARD_NAME_BADGE_GAP:0}}>
      <Text numberOfLines={1} ellipsizeMode="tail" adjustsFontSizeToFit={fit.fontSize>fit.min} minimumFontScale={fit.min/fit.fontSize}
       style={{flexShrink:1,minWidth:0,fontSize:fit.fontSize,lineHeight:space.lineHeight,includeFontPadding:false,fontWeight:"700",color:ink,textAlign:align}}>{line}</Text>
      {last&&<View pointerEvents="none" style={{width:JCARD_NAME_BADGE_WIDTH,flexShrink:0,alignItems:"center",justifyContent:"center"}}>{badge}</View>}
     </View>;
    })}
   </View>
   <View style={{height:space.subtitleHeight,flexDirection:"row",alignItems:"center",justifyContent:justify,gap:4}}>
    {subtitleIcon}
    <Text numberOfLines={1} ellipsizeMode="tail" style={{flexShrink:1,minWidth:0,fontSize:12,lineHeight:16,includeFontPadding:false,color:muted,textAlign:align}}>{subtitle}</Text>
   </View>
  </Pressable>
  <JobeenNoticeDialog visible={dialog} title={side==="personal"?"Identidad personal":"Identidad del negocio"}
   description={name+"\n"+subtitle+"\n\n"+verification} singleAction confirmLabel="Cerrar" onConfirm={close} onCancel={close}/>
 </>;
}
