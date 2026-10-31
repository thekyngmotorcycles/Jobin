import { useCallback } from "react";
import { Text,View } from "react-native";
import { useUi } from "./ui";
import { loadTrustMark } from "../lib/safety-api";
import { useProfessionalData } from "../state/useProfessionalData";
/** Separate trust notice; does not alter the JCard or immutable employment history. */
export function ProfessionalTrustMark({worker}:{worker:string}){
 const {s}=useUi();const result=useProfessionalData(useCallback(()=>loadTrustMark(worker),[worker]));
 if(!result.data?.marked)return null;
 return <View style={s.notice}><Text style={s.h3}>Registro de confianza profesional</Text><Text style={s.text}>{result.data.reason}</Text><Text style={s.muted}>Esta marca procede de decisiones confirmadas, no de denuncias pendientes.</Text></View>;
}
