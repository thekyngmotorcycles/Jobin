import {useState,type ReactNode} from "react";
import {View,useWindowDimensions} from "react-native";
import {jcardProfileCoverGeometry,type JCardProfilePortraitMetrics} from "../theme/jcard";

/** Keep the cover outside the flip/gesture subtree and give both layers one
 * explicit layout origin. The card remains in flow so actions and tabs follow
 * its measured height. Neither the parent gap nor the current face affects the cover. */
export function JCardProfileLayers({portrait,cover,children}:{portrait?:JCardProfilePortraitMetrics;cover:(height:number)=>ReactNode;children:ReactNode}){
 const {width}=useWindowDimensions();
 const [measuredWidth,setMeasuredWidth]=useState(0);
 if(!portrait)return <>{children}</>;
 const geometry=jcardProfileCoverGeometry(measuredWidth||width,portrait);
 return <View style={{width:"100%",position:"relative",overflow:"visible"}}
  onLayout={event=>{const next=event.nativeEvent.layout.width;if(next>0)setMeasuredWidth(previous=>previous===next?previous:next);}}>
  <View style={{position:"absolute",top:0,left:0,right:0,height:geometry.coverHeight,borderRadius:18,overflow:"hidden"}}>
   {cover(geometry.coverHeight)}
  </View>
  <View pointerEvents="box-none" style={{paddingTop:geometry.frameTop,zIndex:1}}>
   {children}
  </View>
 </View>;
}
