import {Animated,Pressable,ScrollView,Text,View} from "react-native";
import {useUi} from "./ui";
export const WORK_FILTERS=["Todo","Servicios","Educación","Comercio","Tecnología"] as const;
export type WorkFilter=typeof WORK_FILTERS[number];
export function WorkCategoryFilters({selected,onSelect,scrollY}:{selected:WorkFilter;onSelect:(value:WorkFilter)=>void;scrollY:Animated.Value}){
 const {colors}=useUi();
 const faded=scrollY.interpolate({inputRange:[0,55,125],outputRange:[1,0.5,0],extrapolate:"clamp"});
 const active=scrollY.interpolate({inputRange:[0,125,190],outputRange:[1,1,0],extrapolate:"clamp"});
 return <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{paddingHorizontal:16,gap:9,alignItems:"center",paddingVertical:4}}>
  {WORK_FILTERS.map(item=><Animated.View key={item} style={{opacity:item===selected?active:faded}}>
   <Pressable accessibilityRole="button" accessibilityLabel={"Filtrar por "+item} accessibilityState={{selected:item===selected}} onPress={()=>onSelect(item)}
    style={{paddingHorizontal:17,paddingVertical:10,borderRadius:28,backgroundColor:item===selected?colors.ink:colors.card,borderWidth:1,borderColor:item===selected?colors.ink:colors.line}}>
    <Text style={{color:item===selected?colors.paper:colors.ink,fontSize:14,fontWeight:item===selected?"800":"600"}}>{item}</Text>
   </Pressable>
  </Animated.View>)}
 </ScrollView>;
}
