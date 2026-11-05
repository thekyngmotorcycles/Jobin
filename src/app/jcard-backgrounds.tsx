import {JCARD_FINISH_BACKGROUNDS} from "../theme/jcard-finish-backgrounds";
import {JCARD_CLASSIC_BACKGROUNDS,JCARD_NO_BACKGROUND} from "../theme/jcard-classic-backgrounds";
import {useEffect,useRef,useState} from "react";
import {Button,Alert} from "react-native";
import {appearanceOwner,readJCardAppearance,saveJCardAppearance} from "../lib/jcard-appearance";
import {ScrollView,Pressable,Text,View,useWindowDimensions} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {useTheme} from "../state/ThemeProvider";
import {JCardPremiumTexture} from "../components/JCardPremiumTexture";
import {JCardPremiumSample} from "../components/JCardPremiumSample";
import {JCARD_PREMIUM_BACKGROUNDS,type JCardPremiumBackgroundId} from "../theme/jcard-premium-backgrounds";

/** Preview-only gallery: styles are not applied without server-side entitlement. */
const GROUPS=[
 {label:"Clásicos",icon:"albums-outline" as const,items:[JCARD_NO_BACKGROUND,...JCARD_CLASSIC_BACKGROUNDS]},
 {label:"Trazos",icon:"brush-outline" as const,items:[JCARD_NO_BACKGROUND,...JCARD_PREMIUM_BACKGROUNDS]},
 {label:"Acabados",icon:"diamond-outline" as const,items:[JCARD_NO_BACKGROUND,...JCARD_FINISH_BACKGROUNDS]},
];
export default function JCardBackgroundGallery({side="personal"}:{side?:"personal"|"business"}){
 const {colors}=useTheme();
 const {width}=useWindowDimensions();
 const [group,setGroup]=useState(0);
 const scrollRef=useRef<ScrollView>(null);
 const previewTop=useRef(0);
 const showPreview=(id:JCardPremiumBackgroundId)=>{setSelected(id);requestAnimationFrame(()=>scrollRef.current?.scrollTo({y:previewTop.current,animated:true}));};
 const [selected,setSelected]=useState<JCardPremiumBackgroundId>("original");
 const [owner,setOwner]=useState<string|null>(null);
 const [saving,setSaving]=useState(false);
 useEffect(()=>{let live=true;appearanceOwner().then(async id=>{const saved=await readJCardAppearance(id,side);if(live){setOwner(id);setSelected(saved);}}).catch(()=>{});return()=>{live=false;};},[side]);
 const apply=async()=>{if(!owner){Alert.alert("Inicia sesión","Debes iniciar sesión para guardar tu fondo.");return;}setSaving(true);try{await saveJCardAppearance(owner,selected,side);Alert.alert("JCard actualizada",`El fondo de tu JCard ${side==="business"?"de negocio":"personal"} se guardó en este dispositivo.`);}catch(e){Alert.alert("No se pudo guardar",e instanceof Error?e.message:"Inténtalo de nuevo.");}finally{setSaving(false);}};
 const columns=width>=700?4:2;
 const cell=Math.min(180,(width-48-(columns-1)*12)/columns);
 return <View style={{flex:1,backgroundColor:colors.paper}}>
  <ScrollView ref={scrollRef} contentContainerStyle={{padding:16,paddingBottom:60,gap:16}}>
   <View onLayout={event=>{previewTop.current=event.nativeEvent.layout.y;}} style={{alignItems:"center",paddingVertical:12,borderRadius:18,backgroundColor:colors.card}}>
    <JCardPremiumSample id={selected} width={Math.min(width-64,340)} side={side}/>
   </View>
   <Button title={saving?"Guardando...":"Aplicar a mi JCard"} disabled={saving} onPress={()=>void apply()}/>
   <View accessibilityRole="tablist" style={{flexDirection:"row",gap:8}}>
    {GROUPS.map((item,index)=><Pressable key={item.label} accessibilityRole="tab" accessibilityState={{selected:group===index}} accessibilityLabel={item.label} onPress={()=>{setGroup(index);if(item.items.length)setSelected(item.items[0].id);}} style={{flex:1,minHeight:54,alignItems:"center",justifyContent:"center",gap:3,borderWidth:1,borderRadius:12,borderColor:group===index?colors.ink:colors.line,backgroundColor:group===index?colors.card:colors.paper}}>
     <Ionicons name={item.icon} size={22} color={group===index?colors.ink:colors.muted}/>
     <Text style={{fontSize:11,color:group===index?colors.ink:colors.muted}}>{item.label}</Text>
    </Pressable>)}
   </View>
   <View style={{flexDirection:"row",flexWrap:"wrap",gap:12,justifyContent:"center"}}>
    {GROUPS[group].items.map(item=><Pressable key={item.id} accessibilityRole="button" accessibilityState={{selected:selected===item.id}} accessibilityLabel={"Vista previa "+item.name} onPress={()=>showPreview(item.id)} style={{width:cell,alignItems:"center",padding:6,borderRadius:14,borderWidth:selected===item.id?2:1,borderColor:selected===item.id?colors.ink:colors.line,gap:7}}>
     <JCardPremiumTexture id={item.id} width={cell-14} height={(cell-14)*1.25}/>
     <Text style={{fontSize:12,fontWeight:"600",color:colors.ink,textAlign:"center"}}>{item.name}</Text>
    </Pressable>)}
   </View>
  </ScrollView>
 </View>;
}
