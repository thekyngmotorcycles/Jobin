import {ActivityIndicator,View} from "react-native";
export default function SecurityLoading(){
 return <View style={{flex:1,justifyContent:"center",alignItems:"center"}}><ActivityIndicator accessibilityLabel="Verificando sesión"/></View>;
}
