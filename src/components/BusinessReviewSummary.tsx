import {Ionicons} from "@expo/vector-icons";
import {Text,View} from "react-native";
import {businessReviewDisplay} from "../lib/jcard-review-display";
import {jcardCommon} from "../theme/jcard";

/** A single left-aligned row on every business face, with five persistent stars. */
export function BusinessReviewSummary({rating,reviewCount,ink,muted}:{rating:number|null;reviewCount:number;ink:string;muted:string}){
 const review=businessReviewDisplay(rating,reviewCount);
 return <View accessible accessibilityLabel={review.accessibilityLabel} style={{alignSelf:"flex-start",maxWidth:"100%",flexDirection:"row",alignItems:"center",gap:5,minWidth:0}}>
  <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{flexDirection:"row",gap:1,flexShrink:0}}>
   {review.stars.map((star,index)=><Ionicons key={index} name={star==="full"?"star":star==="half"?"star-half":"star-outline"} size={13} color={star==="empty"?muted:jcardCommon.businessGold}/>)}
  </View>
  <Text numberOfLines={1} style={{fontSize:11,fontWeight:"700",color:ink,flexShrink:0}}>{review.score}</Text>
  <Text numberOfLines={1} ellipsizeMode="tail" style={{fontSize:10,color:muted,flexShrink:1}}>({review.countLabel})</Text>
 </View>;
}
