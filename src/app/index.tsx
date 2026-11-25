import {Redirect,useLocalSearchParams} from "expo-router";
import {useAuthNavigationPhase} from "../components/AuthGate";
import SecurityLoading from "./security-loading";

export default function Entry(){
 const phase=useAuthNavigationPhase();
 const {onboarded}=useLocalSearchParams<{onboarded?:string}>();
 if(phase==="checking")return <SecurityLoading/>;
 if(phase==="signed-in")return <Redirect href={onboarded==="1"?"/videos":"/(tabs)"}/>;
 if(phase==="onboarding")return <Redirect href="/choose-username"/>;
 return <Redirect href="/login"/>;
}
