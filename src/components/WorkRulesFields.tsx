import { useState } from "react";
import { Pressable,Text,View } from "react-native";
import { Button,useUi } from "./ui";
import { ProfessionalStatus } from "./ProfessionalStatus";
import { loadWorkOptions,WORK_ACTIVITIES } from "../lib/safety-api";
import { useProfessionalData } from "../state/useProfessionalData";
export function useWorkDraft(){
 const options=useProfessionalData(loadWorkOptions);
 const [profession,setProfession]=useState("");const [activity,setActivity]=useState("work");
 const [employer,setEmployer]=useState<string|undefined>();const [consent,setConsent]=useState(false);
 return {options,profession,setProfession,activity,setActivity,employer,setEmployer,consent,setConsent};
}
export function WorkRulesFields({draft,live}:{draft:ReturnType<typeof useWorkDraft>;live:boolean}){
 const {s,colors}=useUi();const o=draft.options;
 if(!o.data)return <ProfessionalStatus loading={o.loading} error={o.error} retry={o.reload}/>;
 return <View style={{gap:14}}>
  <Text style={s.h3}>Tu profesión</Text>
  {o.data.professions.map(p=><Button key={p.code} secondary title={(draft.profession===p.code?"✓ ":"")+p.label} onPress={()=>draft.setProfession(p.code)}/>)}
  {!o.data.professions.length&&<Text style={s.muted}>Registra una profesión en tu JCard. Las organizaciones necesitan un rubro preaprobado.</Text>}
  <Text style={s.h3}>Lo que mostrarás de tu propio trabajo</Text>
  {WORK_ACTIVITIES.filter(a=>live||a.value!=="interview").map(a=><Button key={a.value} secondary title={(draft.activity===a.value?"✓ ":"")+a.label} onPress={()=>draft.setActivity(a.value)}/>)}
  <Text style={s.h3}>Empresa que representas</Text>
  <Button secondary title={!draft.employer?"✓ Trabajo independiente o de mi organización":"Trabajo independiente o de mi organización"} onPress={()=>draft.setEmployer(undefined)}/>
  {o.data.employers.map(e=><Button key={e.id} secondary title={(draft.employer===e.id?"✓ ":"")+e.name+(!e.approved?" · Empleo pendiente":live&&!e.representative?" · Sin permiso de representación":"")} onPress={()=>draft.setEmployer(e.id)}/>)}
  <View style={[s.notice,{gap:10}]}>
   <Text style={s.text}>Solo puedes mostrar tu propio trabajo. No fiestas, vida cotidiana ni retransmisiones como espectador. Un guardia de un club transmite únicamente fuera del local.</Text>
   <Text style={s.muted}>No se permiten desnudos, material sexual, menores de edad, sangre ni violencia, aunque aparezcan durante un trabajo. Músicos y DJ muestran su labor artística; actores en academia necesitan matrícula confirmada.</Text>
   <Text style={s.muted}>{live?"Hacer Live es opcional. El servidor comprueba la profesión, el empleador y la supervisión antes de publicar.":"El video procesado no puede superar 3 minutos. Se mantiene privado hasta completar procesamiento y moderación."}</Text>
   <Pressable accessibilityRole="checkbox" accessibilityState={{checked:draft.consent}} accessibilityLabel="Acepto las reglas de contenido profesional" onPress={()=>draft.setConsent(!draft.consent)} style={{minHeight:48,flexDirection:"row",alignItems:"center",gap:10,padding:8,borderColor:colors.line,borderWidth:1,borderRadius:10}}>
    <Text style={s.h3}>{draft.consent?"☑":"☐"}</Text><Text style={[s.text,{flex:1}]}>Confirmo que mostraré mi trabajo y acepto estas reglas.</Text>
   </Pressable>
  </View>
 </View>;
}
