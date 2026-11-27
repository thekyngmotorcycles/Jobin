import {createElement,useEffect,useState} from "react";
import {Platform,Pressable,ScrollView,Text,View,useWindowDimensions,Animated} from "react-native";
import {useLocalSearchParams} from "expo-router";
import {Ionicons} from "@expo/vector-icons";
import {JobinCard} from "../components/JobinCard";
import {ProfileIdentityHeader,ProfileSectionTabs,ProfileAboutSelector,ProfilePersonalContact,ProfilePersonalLanguages,ProfileBusinessAbout,type ProfileSection,type ProfileAboutSide} from "../components/ProfileSharedSections";
import {PreviewProfileCounts} from "../components/ProfileFollowCounts";
import {JobinTabIcon,type JobinTabName} from "../components/JobinTabIcon";
import {NavigationFade} from "../components/NavigationFade";
import {mockJCard} from "../mocks/jcard";
import {useTheme} from "../state/ThemeProvider";
import {jobeenTokens} from "../theme/jobeen";
import {NAVIGATION_ROW_HEIGHT} from "../theme/navigation";
import type {CardData} from "../lib/jcard";

const devices=[{name:"Jelly 2",width:320,height:569},{name:"Galaxy S22",width:360,height:780},{name:"iPhone 17",width:402,height:874}] as const;
const data:CardData={...mockJCard("Sin reseñas","AVAILABLE"),name:"Alex Rivera",handle:"alex_profesional",role:"Técnico HVAC",primarySpecialties:["Especializado"],primaryExperienceMonths:67,avatar:undefined,seals:[],profileUrl:"https://example.com/preview",business:{name:"Clima Demo",category:"Climatización HVAC",opened:"2019",closed:"",services:["Instalación","Mantenimiento","Reparación"],location:"Miami, Florida",licenseVerified:false,rating:4.5,reviewCount:24,email:"contacto@example.com",emailSecondary:"servicio@example.com",phone:"+1 305 555 0100",phoneSecondary:"+1 305 555 0101"}};
const contacts={email_primary:"alex@example.com",email_secondary:"contacto@example.com",phone_primary:"+1 305 555 0100",phone_secondary:"+1 305 555 0101"};
const noop=()=>{};
const icons:JobinTabName[]=["index","shop","videos","inbox","profile"];

function ProfileFrame({appearance}:{appearance:"light"|"dark"}){
 const {setTheme}=useTheme(),jt=jobeenTokens(appearance);
 const {width,height}=useWindowDimensions();
 const [side,setSide]=useState<ProfileAboutSide>("personal"),[section,setSection]=useState<ProfileSection>("cv");
 useEffect(()=>setTheme(appearance),[appearance,setTheme]);
 return <View style={{flex:1,backgroundColor:jt.bg}}>
  <View style={{height:24,flexDirection:"row",paddingHorizontal:14,alignItems:"center",justifyContent:"space-between",backgroundColor:jt.bg}}><Text style={{color:jt.ink,fontSize:11}}>9:41</Text><Text style={{color:jt.ink,fontSize:11}}>5G ▰</Text></View>
  <View style={{flex:1}}>
   <View pointerEvents="none" style={{position:"absolute",top:0,right:12,left:12,height:50,zIndex:10,flexDirection:"row",alignItems:"center",justifyContent:"flex-end",gap:20}}>
    <Ionicons name="add-circle-outline" size={24} color={jt.ink}/><Ionicons name="notifications-outline" size={24} color={jt.ink}/><Ionicons name="ellipsis-horizontal" size={23} color={jt.ink}/>
   </View>
   <Animated.ScrollView stickyHeaderIndices={[1]} showsVerticalScrollIndicator={false} style={{flex:1}} contentContainerStyle={{paddingBottom:NAVIGATION_ROW_HEIGHT+20}}>
    <View style={{paddingBottom:12}}>
     <PreviewProfileCounts><ProfileIdentityHeader card={<JobinCard card={data} previewTheme={appearance} showOwnerActions awardsInAbout profileInset={16} selectedSide={side} onActiveSideChange={setSide} ownerQuickActions={{onPanel:noop,onLive:noop,liveLabel:"En vivo"}} publicVisibility={{personal_enabled:true,business_enabled:true,business_show_email:true,business_show_phone:true}}/>}/></PreviewProfileCounts>
    </View>
    <View style={{backgroundColor:jt.bg,zIndex:3}}><ProfileSectionTabs section={section} onSelect={setSection} showPrivateJCards/></View>
    <View style={{gap:14,paddingHorizontal:16,paddingTop:20,minHeight:height,backgroundColor:jt.bg}}>
     {section==="cv"?<><ProfileAboutSelector side={side} onSelect={setSide}/>
      {side==="personal"?<><ProfilePersonalContact target="" previewDetails={contacts}/><ProfilePersonalLanguages languages={data.languages}/><Text style={{fontSize:16,fontWeight:"700",color:jt.ink}}>Historial profesional</Text><Text style={{color:jt.ink2}}>Experiencia registrada: 5 años y 7 meses</Text></>:<ProfileBusinessAbout business={data.business}/>}
     </>:<Text style={{color:jt.ink2,padding:14}}>Sección de ejemplo; la revisión visual actual cubre el perfil y Acerca de.</Text>}
    </View>
   </Animated.ScrollView>
   <View style={{position:"absolute",bottom:0,left:0,right:0,height:NAVIGATION_ROW_HEIGHT,zIndex:50}}>
    <NavigationFade profileOpaque/>
    <View style={{flex:1,flexDirection:"row",alignItems:"center"}}>{icons.map(name=><View key={name} style={{flex:1,alignItems:"center"}}><JobinTabIcon name={name} focused={name==="profile"} size={name==="videos"?(width<375?28:30)*1.15:width<375?23:25} color={jt.ink}/></View>)}</View>
   </View>
  </View>
 </View>;
}
export default function VisualPreview(){
 const params=useLocalSearchParams<{frame?:string;theme?:string}>();
 const {width}=useWindowDimensions();
 const [appearance,setAppearance]=useState<"light"|"dark">("light");
 const [device,setDevice]=useState(1);
 if(Platform.OS!=="web"||process.env.EXPO_PUBLIC_JOBEEN_VISUAL_PREVIEW!=="1")return null;
 if(params.frame==="1")return <ProfileFrame appearance={params.theme==="dark"?"dark":"light"}/>;
 const d=devices[device];const scale=Math.min(1,Math.max(0.25,(width-36)/d.width));
 return <ScrollView style={{flex:1,backgroundColor:"#eef1f5"}} contentContainerStyle={{alignItems:"center",padding:16,gap:12}}>
  <Text style={{color:"#122032",fontSize:22,fontWeight:"700"}}>Jobeen · Vista visual</Text>
  <Text style={{color:"#526172",textAlign:"center"}}>Perfil · componentes reales · datos ficticios · renderizado web</Text>
  <View style={{flexDirection:"row",flexWrap:"wrap",gap:6,justifyContent:"center"}}>{devices.map((item,i)=><Pressable key={item.name} onPress={()=>setDevice(i)} style={{padding:10,borderRadius:8,backgroundColor:i===device?"#122032":"#fff"}}><Text style={{color:i===device?"#fff":"#122032",fontWeight:"600"}}>{item.name}</Text></Pressable>)}</View>
  <View style={{flexDirection:"row",gap:8}}>{(["light","dark"] as const).map(t=><Pressable key={t} onPress={()=>setAppearance(t)} style={{padding:10,borderRadius:8,backgroundColor:t===appearance?"#122032":"#fff"}}><Text style={{color:t===appearance?"#fff":"#122032"}}>{t==="light"?"Royal Hive Light":"Royal Hive Dark"}</Text></Pressable>)}</View>
  <Text style={{color:"#526172",fontSize:12}}>{d.width} × {d.height} CSS px · tamaño lógico aproximado</Text>
  <View style={{width:d.width*scale,height:d.height*scale,overflow:"hidden",borderRadius:12,backgroundColor:"#fff"}}>
   {createElement("iframe",{key:d.name+appearance,title:"Perfil "+d.name,src:"/visual-preview?frame=1&theme="+appearance,style:{width:d.width,height:d.height,border:0,transform:"scale("+scale+")",transformOrigin:"top left"}})}
  </View>
  <Text style={{color:"#526172",fontSize:12,textAlign:"center",maxWidth:450}}>Desplaza dentro del teléfono. Toca la tarjeta o el selector Personal/Negocio para probar el giro. La portada y los datos son de demostración; no hay sesión ni operaciones reales. No es un simulador nativo.</Text>
 </ScrollView>;
}
