import { router } from "expo-router";
import { ActivityIndicator, Text, View } from "react-native";
import { Button, useUi } from "./ui";
export function ProfessionalStatus({loading,error,retry}:{loading:boolean;error:string;retry:()=>void}) {
 const {s,colors}=useUi();
 return <View style={[s.panel,{gap:14}]}>
  {loading?<ActivityIndicator color={colors.ink}/>:error?<><Text style={s.text}>{error}</Text><Button secondary title="Reintentar" onPress={retry}/></>:<><Text style={s.text}>Inicia sesión para completar tu JCard profesional.</Text><Button title="Entrar o crear cuenta" onPress={()=>router.push("/account")}/></>}
 </View>;
}
