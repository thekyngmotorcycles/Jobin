import { useCallback, useEffect, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { Text, TextInput, View } from "react-native";
import { Button, Notice, Screen, useUi } from "../components/ui";
import { ProfessionalStatus } from "../components/ProfessionalStatus";
import { loadOrganization, loadWorkspace, professionalMutation } from "../lib/professional-api";
import { ORGANIZATION_LABELS, type OrganizationKind } from "../lib/professional-types";
import { useProfessionalAction, useProfessionalData } from "../state/useProfessionalData";

export default function Company(){
 const {s,colors}=useUi();const {id}=useLocalSearchParams<{id?:string}>();
 const workspace=useProfessionalData(loadWorkspace);
 const org=useProfessionalData(useCallback(()=>loadOrganization(id),[id]));
 const action=useProfessionalAction(()=>{org.reload();workspace.reload();});
 const [kind,setKind]=useState<OrganizationKind>("company");
 const [profession,setProfession]=useState("");const [label,setLabel]=useState("");const [shortLabel,setShortLabel]=useState("");const [ordinal,setOrdinal]=useState("1");
 const [worker,setWorker]=useState("");const [rank,setRank]=useState("");
 const o=org.data;const owner=!!o&&workspace.data?.card.id===o.id;
 useEffect(()=>{if(o)setKind(o.kind);},[o]);
 const employees=o?.employees.filter(e=>e.approved&&!e.ended_on)??[];
 const former=o?.employees.filter(e=>e.approved&&e.ended_on)??[];
 const input={color:colors.ink,borderColor:colors.line,borderWidth:1,padding:12,borderRadius:10};
 return <Screen title={o?.name??"Empresas e instituciones."} subtitle={o?ORGANIZATION_LABELS[o.kind]+" · @"+o.handle:"Perfil profesional de la organización."}>
  {!o?<ProfessionalStatus loading={org.loading||workspace.loading} error={workspace.data?org.error:workspace.error} retry={()=>{org.reload();workspace.reload();}}/>:<>
   {!!action.notice&&<Notice text={action.notice} onClose={()=>action.setNotice("")}/>}
   <View style={s.panel}><Text style={s.h2}>{ORGANIZATION_LABELS[o.kind]}</Text><Text style={s.muted}>{[o.city,o.region].filter(Boolean).join(" · ")||"Ubicación pendiente"}</Text>
    <Text style={s.h3}>Sellos preaprobados</Text>
    {o.scopes.length===0?<Text style={s.muted}>Ningún sello preaprobado. Adjuntar documentos no concede permisos automáticamente.</Text>:o.scopes.map(scope=><Text key={scope.profession_code} style={s.text}>{scope.active?"✓ ":""}{scope.label} · {scope.active?"Preaprobado":"Inactivo"}</Text>)}
    {owner&&<>
     {(["company","education","government"] as const).map(value=><Button key={value} secondary title={(kind===value?"✓ ":"")+ORGANIZATION_LABELS[value]} onPress={()=>setKind(value)}/>)}
     <Button title={action.busy?"Guardando…":"Guardar tipo de organización"} onPress={()=>void action.run(()=>professionalMutation("jobin_set_organization_kind",{kind}),"Tipo de organización guardado.")}/>
     <Text style={s.muted}>El tipo queda bloqueado al enviar acreditaciones. Solo el equipo de revisión puede preaprobar rubros.</Text>
     <Button secondary title="Solicitar acreditación de un rubro" onPress={()=>router.push("/certificates")}/>
     <Button secondary title="Editar datos y ciudad" onPress={()=>router.push("/professional")}/>
    </>}
   </View>
   <View style={s.panel}><Text style={s.h2}>Empleados actuales · {employees.length}</Text>
    {employees.length===0&&<Text style={s.muted}>No hay empleados aprobados actuales.</Text>}
    {employees.map(e=><View key={e.id} style={{gap:8}}>
     <Text style={s.h3}>{e.name} · @{e.handle}</Text><Text style={s.muted}>{e.title} · Desde {e.started_on}</Text>
     {owner&&<Button secondary title={e.can_represent?"Retirar representación institucional":"Autorizar representación institucional"} onPress={()=>void action.run(()=>professionalMutation("jobin_set_representative",{employment:e.id,approved:!e.can_represent}),"Permiso institucional actualizado.")}/>}
    </View>)}
    <Text style={s.h2}>Ex empleados aprobados · {former.length}</Text>
    {former.map(e=><View key={e.id} style={{gap:5}}><Text style={s.h3}>{e.name} · @{e.handle}</Text><Text style={s.muted}>{e.title} · {e.started_on} — {e.ended_on}</Text></View>)}
    <Text style={s.muted}>Los registros aprobados son permanentes y no pueden borrarse.</Text>
    {owner&&o.employees.some(e=>!e.approved)&&<Text style={s.muted}>Hay vínculos pendientes de aprobación en el flujo de historial profesional existente.</Text>}
   </View>
   {owner&&o.kind==="education"&&<View style={s.panel}><Text style={s.h2}>Solicitudes de formación</Text>
    {o.students.length===0&&<Text style={s.muted}>Nadie ha solicitado confirmación a esta institución.</Text>}
    {o.students.map(student=><View key={student.id} style={{gap:8}}>
     <Text style={s.h3}>{student.name} · {student.label}</Text><Text style={s.muted}>{student.training_status==="in_academy"?"In academy":"Graduado/Recibido"} · {student.verified_at?"Confirmado":"Sin confirmar"}</Text>
     <Button title={student.verified_at?"Retirar confirmación":"Confirmar formación"} onPress={()=>void action.run(()=>professionalMutation("jobin_verify_training",{person_profession:student.id,approve:!student.verified_at}),"Estado de formación actualizado.")}/>
    </View>)}
   </View>}
   {!!o.ranks.length&&<View style={s.panel}><Text style={s.h2}>Rangos de la institución</Text>{o.ranks.map(r=><Text key={r.id} style={s.text}>{r.ordinal}. {r.label} ({r.short_label})</Text>)}</View>}
   {owner&&o.kind==="government"&&<View style={s.panel}><Text style={s.h2}>Definir rango</Text>
    {o.scopes.filter(scope=>scope.active&&["policia","militar"].includes(scope.profession_code)).map(scope=><Button key={scope.profession_code} secondary title={(profession===scope.profession_code?"✓ ":"")+scope.label} onPress={()=>setProfession(scope.profession_code)}/>)}
    <TextInput accessibilityLabel="Nombre de rango" placeholder="Sargento" placeholderTextColor={colors.muted} value={label} onChangeText={setLabel} style={input}/>
    <TextInput accessibilityLabel="Abreviatura del rango (máximo 8 caracteres)" placeholder="Sarg." placeholderTextColor={colors.muted} value={shortLabel} onChangeText={setShortLabel} style={input}/>
    <TextInput accessibilityLabel="Orden del rango" value={ordinal} onChangeText={setOrdinal} keyboardType="number-pad" style={input}/>
    <Button title={action.busy?"Guardando…":"Registrar rango institucional"} onPress={()=>void action.run(()=>professionalMutation("jobin_define_rank",{profession,label,short_label:shortLabel,ordinal:Number(ordinal)}),"Rango registrado.")}/>
    <Text style={s.h3}>Aprobar promoción</Text>
    {employees.map(e=><Button key={e.id} secondary title={(worker===e.worker_id?"✓ ":"")+e.name} onPress={()=>setWorker(e.worker_id)}/>)}
    {o.ranks.map(r=><Button key={r.id} secondary title={(rank===r.id?"✓ ":"")+r.label} onPress={()=>setRank(r.id)}/>)}
    <Button title="Otorgar rango al empleado seleccionado" onPress={()=>void action.run(async()=>{if(!worker||!rank)throw new Error("Selecciona empleado y rango.");await professionalMutation("jobin_grant_rank",{worker,rank});},"Promoción aprobada.")}/>
   </View>}
  </>}
 </Screen>;
}
