import {router} from "expo-router";
import {PageState} from "./ui";
export function ProfessionalStatus({loading,error,retry}:{loading:boolean;error:string;retry:()=>void}){
 return loading?<PageState kind="loading" message="Cargando…"/>:error?<PageState kind="error" message={error} actionLabel="Reintentar" onAction={retry}/>:<PageState kind="info" message="Inicia sesión para completar tu JCard profesional." actionLabel="Entrar o crear cuenta" onAction={()=>router.push("/account")}/>;
}
