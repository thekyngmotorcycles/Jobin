import {BusinessFace} from "./JobinCard";
import type {CardData} from "../lib/jcard";
import {View,Text} from "react-native";
import {useTheme} from "../state/ThemeProvider";
import {jcardTokens} from "../theme/jcard";
import QRCode from "react-native-qrcode-svg";
import {JCardPremiumTexture} from "./JCardPremiumTexture";
import {getPremiumBackground,JCARD_PREMIUM_QR_COLORS,type JCardPremiumBackgroundId} from "../theme/jcard-premium-backgrounds";
/** Illustrative sample, never the user's actual JCard or a functional QR code. */
export function JCardPremiumSample({id,width=310,side="personal"}:{id:JCardPremiumBackgroundId;width?:number;side?:"personal"|"business"}){
 const {theme}=useTheme();
 const t=getPremiumBackground(id);if(!t)return null;
 const original=jcardTokens(theme,"base");
 const ink=id==="original"?original.text:t.ink;
 const base=id==="original"?original.start:t.base;
 const line=id==="original"?original.line:t.line;
 const height=width*1.22;const scale=width/310;
 if(side==="business"){
  const sample:CardData={name:"Nombre de ejemplo",handle:"ejemplo",role:"Servicios profesionales",years:0,status:"AVAILABLE",employer:null,rating:null,reviewCount:0,inAcademy:false,profileUrl:"https://jobin.example/preview",languages:[],seals:[],business:{name:"Nombre de negocio",opened:"2025",closed:"",services:["Servicio principal","Atención profesional"],location:"Ciudad, región",licenseVerified:false,rating:null,reviewCount:0,email:"contacto@ejemplo.com",phone:"(000) 000-0000",category:"Servicios profesionales"}};
  const fullWidth=340,fullHeight=450,ratio=width/fullWidth;
  return <View accessibilityLabel={"Vista previa real de JCard de negocio con fondo "+t.name} style={{width,height:fullHeight*ratio,alignSelf:"center",overflow:"hidden",borderRadius:30*ratio}}><View style={{width:fullWidth,height:fullHeight,transform:[{scale:ratio}],transformOrigin:"top left"}}><BusinessFace card={sample} theme={theme} appearance={id}/></View></View>;
 }
 const label=(text:string,size:number,weight:"400"|"600"|"700"="400")=><Text style={{color:ink,fontSize:size*scale,fontWeight:weight}}>{text}</Text>;
 return <View accessibilityLabel={"Ejemplo de JCard con fondo "+t.name} style={{width,height,borderRadius:18,overflow:"hidden",alignSelf:"center"}}>
  <View style={{position:"absolute",top:0,left:0}} pointerEvents="none"><JCardPremiumTexture id={id} width={width} height={height}/></View>
  <View style={{flex:1,padding:18*scale,justifyContent:"space-between"}}>
   <View style={{flexDirection:"row",alignItems:"flex-start",justifyContent:"space-between"}}>
    <View style={{width:58*scale,height:58*scale,borderRadius:30*scale,backgroundColor:ink,alignItems:"center",justifyContent:"center"}}><Text style={{fontSize:20*scale,color:base,fontWeight:"700"}}>JS</Text></View>
    <View style={{alignItems:"center"}}>{label("JCard",26,"700")}{label(side==="business"?"Negocio":"Personal",13)}</View>
    <View style={{padding:3*scale,backgroundColor:JCARD_PREMIUM_QR_COLORS.paper,borderRadius:5*scale}}><QRCode value="https://example.com/jcard-preview" size={52*scale} color={JCARD_PREMIUM_QR_COLORS.ink} backgroundColor={JCARD_PREMIUM_QR_COLORS.paper}/></View>
   </View>
   <View style={{gap:8*scale}}>
    <View style={{flexDirection:"row",justifyContent:"space-between",alignItems:"center"}}>{label("Nombre de ejemplo",21,"700")}{label("8 años",12,"600")}</View>
    {label("@usuario_ejemplo",13)}
    {label("Profesión principal",15,"600")}
    {label("DISPONIBLE",12,"700")}
    {label("contacto@ejemplo.com",12)}
   </View>
   <View style={{borderTopWidth:1,borderColor:line,paddingTop:12*scale,flexDirection:"row",justifyContent:"space-around"}}>
    <View style={{alignItems:"center",gap:5}}>{label("Idiomas",12,"600")}{label("◉ ES    ◉ EN",13)}</View>
    <View style={{width:1,backgroundColor:line}}/>
    <View style={{alignItems:"center",gap:5}}>{label("Otras profesiones",12,"600")}{label("◇    ◇",18)}</View>
   </View>
  </View>
 </View>;
}
