import { useCallback, useEffect, useState } from "react";
import { Text, TextInput, View } from "react-native";
import { Button, Chips, Notice, Screen, useUi } from "../components/ui";
import { ProfessionPicker } from "../components/ProfessionPicker";
import { ProfessionalStatus } from "../components/ProfessionalStatus";
import { loadCatalog, loadEducation, loadWorkspace, professionalMutation } from "../lib/professional-api";
import { useProfessionalAction, useProfessionalData } from "../state/useProfessionalData";
import type { JCardStatus } from "../lib/jcard";

export default function Professional() {
 const {s,colors}=useUi();
 const workspace=useProfessionalData(loadWorkspace);const catalog=useProfessionalData(loadCatalog);
 const action=useProfessionalAction(workspace.reload);
 const [name,setName]=useState("");const [handle,setHandle]=useState("");const [city,setCity]=useState("");const [region,setRegion]=useState("");
 const [availability,setAvailability]=useState<JCardStatus>("AVAILABLE");
 const [languages,setLanguages]=useState<{name:string;fluency:string}[]>([]);
 const [profession,setProfession]=useState("");const [training,setTraining]=useState<"graduado"|"in_academy">("graduado");
 const [institution,setInstitution]=useState<string|null>(null);
 const education=useProfessionalData(useCallback(()=>profession?loadEducation(profession):Promise.resolve([]),[profession]));
 const w=workspace.data;
 useEffect(()=>{if(!w)return;setName(w.card.name);setHandle(w.card.handle);setCity(w.profile.city||"");setRegion(w.profile.region||"");setAvailability(w.card.status);setLanguages(w.card.languages.map(l=>({name:l.name,fluency:String(l.fluency)})));},[w]);
 const input={color:colors.ink,borderColor:colors.line,borderWidth:1,borderRadius:10,padding:12,minHeight:44};
 function choose(code:string){setProfession(code);const pp=w?.professions.find(p=>p.profession_code===code);setTraining(pp?.training_status??"graduado");setInstitution(pp?.institution_id??null);}
 return <Screen title="Tu identidad profesional." subtitle="Información real de tu JCard y formación por profesión.">
  {!w?<ProfessionalStatus loading={workspace.loading} error={workspace.error} retry={workspace.reload}/>:<>
   {!!action.notice&&<Notice text={action.notice} onClose={()=>action.setNotice("")}/>}
   <View style={s.panel}>
    <Text style={s.h2}>JCard</Text>
    <Text style={s.muted}>Nombre legal</Text><TextInput accessibilityLabel="Nombre legal" value={name} onChangeText={setName} style={input}/>
    <Text style={s.muted}>@usuario</Text><TextInput accessibilityLabel="Nombre de usuario" value={handle} onChangeText={setHandle} autoCapitalize="none" style={input}/>
    <TextInput accessibilityLabel="Ciudad" placeholder="Ciudad" placeholderTextColor={colors.muted} value={city} onChangeText={setCity} style={input}/>
    <TextInput accessibilityLabel="Estado o región" placeholder="Estado o región" placeholderTextColor={colors.muted} value={region} onChangeText={setRegion} style={input}/>
    <Chips values={["AVAILABLE","ACTIVE"] as const} value={availability} onChange={setAvailability} label="Disponibilidad profesional"/>
    <Text style={s.h3}>Idiomas y fluidez</Text>
    {languages.map((l,index)=><View key={index} style={{gap:8}}>
     <TextInput accessibilityLabel={"Idioma "+(index+1)} placeholder="Idioma" placeholderTextColor={colors.muted} value={l.name} onChangeText={value=>setLanguages(items=>items.map((item,i)=>i===index?{...item,name:value}:item))} style={input}/>
     <TextInput accessibilityLabel={"Fluidez de "+l.name+" (0 a 100)"} placeholder="Fluidez 0–100" placeholderTextColor={colors.muted} value={l.fluency} keyboardType="number-pad" onChangeText={value=>setLanguages(items=>items.map((item,i)=>i===index?{...item,fluency:value}:item))} style={input}/>
     <Button secondary title="Quitar idioma" onPress={()=>setLanguages(items=>items.filter((_,i)=>i!==index))}/>
    </View>)}
    <Button secondary title="Agregar idioma" onPress={()=>setLanguages(items=>[...items,{name:"",fluency:"100"}])}/>
    <Button title={action.busy?"Guardando…":"Guardar JCard"} onPress={()=>void action.run(async()=>{
     if(languages.some(l=>!l.fluency.trim()||!Number.isInteger(Number(l.fluency))))throw new Error("Indica la fluidez como un entero de 0 a 100.");
     await professionalMutation("jobin_save_jcard",{legal_name:name,handle,city,region,availability,languages:languages.map(l=>({name:l.name,fluency:Number(l.fluency)}))});
    },"JCard actualizada.")}/>
   </View>
   {w.card.accountType==="personal"&&<View style={s.panel}>
    <Text style={s.h2}>Profesiones y formación</Text>
    <Text style={s.muted}>Hasta 10 sellos verificados y 1 sin verificar. Un certificado no se aprueba automáticamente al subirlo.</Text>
    {w.professions.map(p=><View key={p.id} style={{gap:8}}>
     <Text style={s.h3}>{p.label}{p.primary_profession?" · Principal":""}</Text>
     <Text style={s.muted}>{p.training_status==="in_academy"?"In academy":"Graduado/Recibido"} · {p.verified_at?"Formación confirmada":"Sin confirmar"}{p.school?" · "+p.school:""}</Text>
     <Button secondary title="Editar esta profesión" onPress={()=>choose(p.profession_code)}/>
     <Button secondary title="Quitar profesión sin verificar" onPress={()=>void action.run(()=>professionalMutation("jobin_remove_unverified_profession",{profession:p.profession_code}),"Profesión retirada.")}/>
    </View>)}
    {!!catalog.error&&<Notice text={catalog.error} onClose={catalog.reload}/>}
    <ProfessionPicker catalog={catalog.data} value={profession} onChange={choose}/>
    <Chips values={["graduado","in_academy"] as const} value={training} onChange={setTraining} label="Formación: graduado o In academy"/>
    <Text style={s.muted}>Institución educativa que puede confirmar tu formación:</Text>
    <Button secondary title={institution?"Quitar institución seleccionada":"Sin institución seleccionada"} onPress={()=>setInstitution(null)}/>
    {education.loading?<Text style={s.muted}>Buscando instituciones…</Text>:education.error?<Text style={s.muted}>{education.error}</Text>:education.data?.map(school=><Button key={school.id} secondary title={(institution===school.id?"✓ ":"")+school.name+(school.city?" · "+school.city:"")} onPress={()=>setInstitution(school.id)}/>)}
    {!education.loading&&!education.error&&education.data?.length===0&&<Text style={s.muted}>Todavía no hay instituciones preaprobadas para esta profesión. Puedes registrar tu formación sin check.</Text>}
    <Button title={action.busy?"Guardando…":"Guardar como profesión principal"} onPress={()=>void action.run(()=>professionalMutation("jobin_set_profession",{profession,training,institution,make_primary:true}),"Profesión guardada. Su verificación depende de la prueba correspondiente.")}/>
   </View>}
  </>}
 </Screen>;
}
