import {router,Stack,useLocalSearchParams} from "expo-router";
import {useMemo} from "react";
import {LEGACY_SETTINGS_GROUPS} from "../../lib/jobin-settings-catalog";
import {PageFrame,PageState} from "../../components/ui";
export default function JobinSettings(){
 const {item}=useLocalSearchParams<{item:string}>();
 const found=useMemo(()=>LEGACY_SETTINGS_GROUPS.flatMap(group=>group.items).find(entry=>entry.id===item),[item]);
 return <><Stack.Screen options={{title:found?.title??"Configuración"}}/>
  <PageFrame kind="settings">
   <PageState kind="info" title="Próximamente" message="Esta función todavía no está disponible. No modifica datos de tu cuenta." actionLabel="Volver a Configuración" onAction={()=>router.canGoBack()?router.back():router.replace("/settings")}/>
  </PageFrame>
 </>;
}
