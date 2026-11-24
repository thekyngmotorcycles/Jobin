import {Ionicons} from "@expo/vector-icons";
import {router,Stack,useFocusEffect} from "expo-router";
import {useCallback,useRef,useState} from "react";
import {ActivityIndicator,Pressable,Text,View} from "react-native";
import {BottomSheet} from "../../components/social-ui";
import {JShopPage} from "../../components/JShopUI";
import {SettingsMenuRow} from "../../components/SettingsMenuRow";
import {JOBEEN_CONTROL} from "../../theme/control-metrics";
import {JOBEEN_TYPE,JOBEEN_LINE_HEIGHT} from "../../theme/typography";
import {captureMessageScope,assertMessageScope,type MessageScope} from "../../lib/message-session";
import {readDefaultSaleLocation,type SaleLocation} from "../../lib/jshop-selling-location";
import {readSellerCurrency,writeSellerCurrency} from "../../lib/jshop-selling-preferences";
import {JSHOP_CURRENCIES,type JShopCurrency} from "../../lib/jshop-model";
import {useTheme} from "../../state/ThemeProvider";
import {jobeenTokens} from "../../theme/jobeen";

type Icon=React.ComponentProps<typeof Ionicons>["name"];
const currencies:Record<JShopCurrency,string>={USD:"Dólar estadounidense",ARS:"Peso argentino",PEN:"Sol peruano"};

export default function JShopSettings(){
 const {theme}=useTheme();const t=jobeenTokens(theme);
 const [owner,setOwner]=useState("");
 const [location,setLocation]=useState<SaleLocation|null>(null);
 const [currency,setCurrency]=useState<JShopCurrency>("USD");
 const [currencyOpen,setCurrencyOpen]=useState(false);
 const [loading,setLoading]=useState(true);
 const [saving,setSaving]=useState(false);
 const [error,setError]=useState("");
 const scopeRef=useRef<MessageScope|null>(null);
 useFocusEffect(useCallback(()=>{
  let active=true;scopeRef.current=null;setLocation(null);setOwner("");setCurrencyOpen(false);setLoading(true);
  void(async()=>{
   try{
    const scope=await captureMessageScope(),id=scope.owner;
    const [place,preferred]=await Promise.all([readDefaultSaleLocation(id,scope),readSellerCurrency(id,scope)]);
    await assertMessageScope(scope);
    if(active){scopeRef.current=scope;setOwner(id);setLocation(place);setCurrency(preferred);setError("");}
   }catch(e){if(active)setError(e instanceof Error?e.message:"No se pudo cargar la configuración de venta.");}
   finally{if(active)setLoading(false);}
  })();
  return()=>{active=false;scopeRef.current=null;setOwner("");setLocation(null);setCurrencyOpen(false);};
 },[]));
 async function setPreferredCurrency(next:JShopCurrency){
  const scope=scopeRef.current;if(!scope||scope.owner!==owner||saving)return;
  setSaving(true);setError("");
  try{
   await writeSellerCurrency(owner,next,scope);await assertMessageScope(scope);
   if(scopeRef.current===scope){setCurrency(next);setCurrencyOpen(false);}
  }catch(e){if(scopeRef.current===scope)setError(e instanceof Error?e.message:"No se pudo guardar la moneda.");}
  finally{setSaving(false);}
 }
 const row=(icon:Icon,title:string,value:string|undefined,onPress:()=>void,disabled=false,variant:"action"|"navigation"="navigation")=>
  <SettingsMenuRow key={title} icon={icon} title={title} value={value} variant={variant} onPress={onPress} disabled={disabled}/>;
 const section=(heading:string,children:React.ReactNode)=>
  <View style={{gap:2}}>
   <Text accessibilityRole="header" style={{fontSize:JOBEEN_TYPE.sectionTitle,lineHeight:JOBEEN_LINE_HEIGHT.sectionTitle,fontWeight:"700",color:t.ink,marginBottom:4}}>{heading}</Text>
   {children}
  </View>;
 return <>
  <Stack.Screen options={{title:"Configuración de JShop",headerShadowVisible:false,
   headerStyle:{backgroundColor:t.bg},headerTintColor:t.ink,headerTitleStyle:{fontWeight:"700"}}}/>
  <JShopPage>
   <View style={{width:"100%",maxWidth:640,alignSelf:"center",gap:22}}>
    {section("Vender",<>
     {row("location-outline","Mi ubicación de venta",loading?"Cargando...":location?.city??"Sin configurar",
      ()=>router.push({pathname:"/jshop/sale-location",params:{target:"default"}}),loading)}
     {row("cash-outline","Moneda predeterminada",loading?"Cargando…":currency,
      ()=>setCurrencyOpen(true),loading,"action")}
    </>)}
    {section("Actividad",<>
     {row("albums-outline","Mis anuncios",undefined,()=>router.replace("/jshop/mine"))}
     {row("notifications-outline","Notificaciones",undefined,()=>router.push("/notifications"))}
    </>)}
    {section("Ayuda",row("document-text-outline","Guía para publicar",undefined,()=>router.push("/jshop/guide")))}
    {!!error&&<Text accessibilityLiveRegion="polite" style={{fontSize:12,color:t.ink}}>{error}</Text>}
   </View>
  </JShopPage>
  <BottomSheet visible={currencyOpen} onClose={()=>{if(!saving)setCurrencyOpen(false);}} title="Moneda predeterminada">
   <View style={{paddingTop:8,gap:8}}>
    {JSHOP_CURRENCIES.map(option=><Pressable key={option} accessibilityRole="radio"
     accessibilityState={{checked:option===currency,disabled:saving}} disabled={saving}
     onPress={()=>void setPreferredCurrency(option)}
     style={({pressed})=>({minHeight:JOBEEN_CONTROL.touchTarget,borderRadius:JOBEEN_CONTROL.buttonRadius,borderWidth:1,borderColor:option===currency?t.yellow:t.line,
      backgroundColor:pressed?t.cream:t.surface,paddingHorizontal:12,paddingVertical:10,flexDirection:"row",gap:12,alignItems:"center"})}>
     <Ionicons name={option===currency?"radio-button-on":"radio-button-off"} size={22} color={t.ink}/>
     <Text style={{flex:1,fontSize:JOBEEN_TYPE.body,lineHeight:JOBEEN_LINE_HEIGHT.body,color:t.ink}}>{option} · {currencies[option]}</Text>
     {saving&&option===currency&&<ActivityIndicator size="small" color={t.ink}/>}
    </Pressable>)}
    {!!error&&<Text accessibilityLiveRegion="polite" style={{fontSize:JOBEEN_TYPE.secondary,color:t.ink}}>{error}</Text>}
    <Text style={{fontSize:JOBEEN_TYPE.secondary,lineHeight:JOBEEN_LINE_HEIGHT.secondary,color:t.ink2}}>
     Se aplicará a los nuevos anuncios. Puedes cambiarla al publicar.
    </Text>
   </View>
  </BottomSheet>
 </>;
}
