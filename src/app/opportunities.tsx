import { useEffect, useState } from "react";
import { router } from "expo-router";
import { Text, TextInput, View } from "react-native";
import { Button, Notice, Screen, useUi } from "../components/ui";
import { ProfessionPicker } from "../components/ProfessionPicker";
import { ProfessionalStatus } from "../components/ProfessionalStatus";
import { loadCatalog, loadWorkspace, professionalMutation, searchCareers } from "../lib/professional-api";
import type { CareerResult } from "../lib/professional-types";
import { useProfessionalAction, useProfessionalData } from "../state/useProfessionalData";
export default function Opportunities(){
 const {s,colors}=useUi();const workspace=useProfessionalData(loadWorkspace);const catalog=useProfessionalData(loadCatalog);const action=useProfessionalAction(workspace.reload);
 const [profession,setProfession]=useState("");const [city,setCity]=useState("");const [message,setMessage]=useState("");
 const [results,setResults]=useState<CareerResult[]>([]);const [searched,setSearched]=useState(false);
 const w=workspace.data;const company=w?.organization?.kind==="company";const allowed=!!w&&(!w.organization||company);
 useEffect(()=>{if(w)setCity(w.profile.city??"");},[w]);
 const input={color:colors.ink,borderColor:colors.line,borderWidth:1,padding:12,borderRadius:10};
 return <Screen title="Tu próximo paso profesional." subtitle="Estudiantes y empresas afines por ciudad y profesión.">
 {!w?<ProfessionalStatus loading={workspace.loading} error={workspace.error} retry={workspace.reload}/>:!allowed?<Text style={s.text}>Esta búsqueda está disponible para estudiantes con cuenta personal y para empresas.</Text>:<>
  {!!action.notice&&<Notice text={action.notice} onClose={()=>action.setNotice("")}/>}
  <View style={s.panel}><Text style={s.h2}>{company?"Conoce estudiantes de tu zona":"Postúlate antes de graduarte"}</Text>
   <Text style={s.muted}>{company?"La matrícula puede estar confirmada o sin confirmar. Para invitar, tu empresa necesita el rubro preaprobado.":"Selecciona una profesión que tengas registrada como In academy. Para postularte, tu ciudad debe coincidir con la empresa."}</Text>
   {!!catalog.error&&<Text style={s.muted}>{catalog.error}</Text>}
   <ProfessionPicker catalog={catalog.data} value={profession} onChange={value=>{setProfession(value);setResults([]);setSearched(false);}}/>
   <TextInput accessibilityLabel="Ciudad de búsqueda" placeholder="Ciudad" placeholderTextColor={colors.muted} value={city} onChangeText={value=>{setCity(value);setResults([]);setSearched(false);}} style={input}/>
   <Button title={action.busy?"Buscando…":"Buscar"} onPress={()=>void action.run(async()=>{setResults(await searchCareers(profession,city,company?"students":"companies"));setSearched(true);},"Búsqueda completada.")}/>
   <TextInput accessibilityLabel="Mensaje de presentación" placeholder={company?"Describe la oportunidad profesional":"Cuéntale a la empresa qué estás estudiando"} placeholderTextColor={colors.muted} value={message} onChangeText={setMessage} multiline style={[input,{minHeight:90}]}/>
  </View>
  {results.map(result=><View key={result.id} style={s.panel}>
   <Text style={s.h3}>{result.name} · @{result.handle}</Text><Text style={s.muted}>{result.city} · {company?(result.verified?"Formación confirmada":"Formación sin confirmar"):"Rubro preaprobado"}</Text>
   {!company&&<Button secondary title="Ver empresa" onPress={()=>router.push({pathname:"/company",params:{id:result.id}})}/>}
   <Button title={company?"Enviar invitación profesional":"Postularme"} onPress={()=>void action.run(()=>professionalMutation("jobin_contact_career",{target:result.id,profession,kind:company?"invitation":"application",message}),company?"Invitación enviada.":"Postulación enviada.")}/>
  </View>)}
  {searched&&results.length===0&&<Text style={s.muted}>Sin resultados para esta profesión y ciudad.</Text>}
  <View style={s.panel}><Text style={s.h2}>Mis contactos profesionales</Text>
   {!w.contacts.length&&<Text style={s.muted}>Todavía no hay invitaciones ni postulaciones.</Text>}
   {w.contacts.map(contact=>{
    const sender=contact.kind==="application"?contact.student_id:contact.organization_id;
    return <View key={contact.id} style={{gap:8}}>
     <Text style={s.h3}>{contact.student} · {contact.organization}</Text><Text style={s.muted}>{contact.profession} · {contact.kind==="application"?"Postulación":"Invitación"} · {contact.status}</Text><Text style={s.text}>{contact.message}</Text>
     {contact.status==="pending"&&(sender===w.card.id?<Button secondary title="Retirar" onPress={()=>void action.run(()=>professionalMutation("jobin_respond_career",{contact:contact.id,decision:"withdrawn"}),"Contacto retirado.")}/>:<>
      <Button title="Aceptar contacto" onPress={()=>void action.run(()=>professionalMutation("jobin_respond_career",{contact:contact.id,decision:"accepted"}),"Contacto aceptado.")}/>
      <Button secondary title="Declinar" onPress={()=>void action.run(()=>professionalMutation("jobin_respond_career",{contact:contact.id,decision:"declined"}),"Contacto declinado.")}/>
     </>)}
    </View>;
   })}
   <Text style={s.muted}>Aceptar un contacto no crea un contrato ni modifica el historial laboral.</Text>
  </View>
 </>}
 </Screen>;
}
