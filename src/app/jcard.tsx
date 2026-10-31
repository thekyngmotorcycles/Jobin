import { useCallback } from "react";
import { useLocalSearchParams } from "expo-router";
import { View } from "react-native";
import { JobinCard } from "../components/JobinCard";
import { Screen } from "../components/ui";
import { ProfessionalStatus } from "../components/ProfessionalStatus";
import { loadPublicCard } from "../lib/professional-api";
import { useProfessionalData } from "../state/useProfessionalData";
export default function PublicJCard(){
 const {user}=useLocalSearchParams<{user?:string}>();
 const resource=useProfessionalData(useCallback(()=>{
  if(!user||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user))return Promise.reject(new Error("Enlace de JCard inválido."));
  return loadPublicCard(user);
 },[user]));
 return <Screen title="JCard." subtitle="Identidad profesional pública.">
  {resource.data?<View><JobinCard card={resource.data}/></View>:<ProfessionalStatus loading={resource.loading} error={resource.error} retry={resource.reload}/>}
 </Screen>;
}
