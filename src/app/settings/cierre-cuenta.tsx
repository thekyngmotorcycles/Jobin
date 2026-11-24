import {Stack} from "expo-router";
import {PageFrame,PageState} from "../../components/ui";
export default function CloseAccount(){
 return <><Stack.Screen options={{title:"Desactivar o eliminar cuenta"}}/>
  <PageFrame kind="settings">
   <PageState kind="info" title="Todavía no disponible" message="Desactivar o eliminar tu cuenta requiere una verificación de identidad. Por ahora no se realizará ningún cambio en tu cuenta desde esta página."/>
  </PageFrame>
 </>;
}
