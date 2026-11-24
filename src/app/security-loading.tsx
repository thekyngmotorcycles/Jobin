import {ActivityIndicator,View} from "react-native";
import {useAuthRecovery} from "../components/AuthGate";
import {PageState} from "../components/ui";
export default function SecurityLoading(){
 const {failed,retry}=useAuthRecovery();
 if(failed)return <PageState kind="error" message="No se pudo verificar tu sesión. Vuelve a intentarlo." actionLabel="Reintentar" onAction={retry}/>;
 return <View style={{flex:1,justifyContent:"center",alignItems:"center"}}><ActivityIndicator accessibilityLabel="Verificando sesión"/></View>;
}
