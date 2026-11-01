import { useCallback, useEffect, useRef, useState } from "react";
import {router} from "expo-router";
import { Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Button, Chips, Notice, Screen, useUi } from "../components/ui";
import { ProfessionPicker } from "../components/ProfessionPicker";
import { ProfessionalStatus } from "../components/ProfessionalStatus";
import { loadCatalog, loadEducation, loadWorkspace, professionalMutation } from "../lib/professional-api";
import { useProfessionalAction, useProfessionalData } from "../state/useProfessionalData";
import {loadContactPreferences,saveContactPreferences} from "../lib/jcard-contact";
import {LanguageRing,LANGUAGE_LEVELS,languageLabel} from "../components/LanguageRing";
import {LanguagePicker} from "../components/LanguagePicker";
import {canonicalLanguage} from "../lib/languages";
import {Ionicons} from "@expo/vector-icons";
import {professionIcon} from "../lib/profession-icons";
import type { JCardStatus } from "../lib/jcard";

export default function Professional() {
 const {s,colors}=useUi();
 const workspace=useProfessionalData(loadWorkspace);const catalog=useProfessionalData(loadCatalog);
 const action=useProfessionalAction(workspace.reload);
 type Section="identity"|"languages"|"professions"|"privacy";
 const [section,setSection]=useState<Section|null>(null);
 const scrollRef=useRef<ScrollView>(null);
 const positions=useRef<Partial<Record<Section,number>>>({});
 const [editingProfession,setEditingProfession]=useState<string|null>(null);
 const [professionFormOpen,setProfessionFormOpen]=useState(false);
 const [formTop,setFormTop]=useState(0);
 const [formMode,setFormMode]=useState<"add"|"edit">("add");
 const [editedPrimary,setEditedPrimary]=useState(false);
 function openSection(id:Section){setSection(current=>current===id?null:id);}
 function openProfession(code:string,primary:boolean){choose(code);setFormMode("edit");setEditedPrimary(primary);setEditingProfession(code);setProfessionFormOpen(true);setTimeout(()=>scrollRef.current?.scrollTo({y:Math.max(0,formTop-24),animated:true}),180);}
 function addProfession(){setProfession("");setTraining("graduado");setInstitution(null);setFormMode("add");setEditingProfession(null);setEditedPrimary(false);setProfessionFormOpen(true);setTimeout(()=>scrollRef.current?.scrollTo({y:Math.max(0,formTop-24),animated:true}),180);}
 useEffect(()=>{if(!section)return;const t=setTimeout(()=>scrollRef.current?.scrollTo({y:Math.max(0,(positions.current[section]??0)-18),animated:true}),160);return()=>clearTimeout(t);},[section]);
 const [showEmail,setShowEmail]=useState(false);const [showPhone,setShowPhone]=useState(false);
 useEffect(()=>{let live=true;void loadContactPreferences().then(p=>{if(live){setShowEmail(p.show_email);setShowPhone(p.show_phone);}}).catch(()=>{});return()=>{live=false;};},[]);
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
 const sectionRow=(id:Section,title:string,subtitle:string,icon:React.ComponentProps<typeof Ionicons>["name"])=><Pressable accessibilityRole="button" accessibilityState={{expanded:section===id}} onPress={()=>openSection(id)} style={{flexDirection:"row",alignItems:"center",gap:13,paddingVertical:16}}>
  <Ionicons name={icon} size={25} color={colors.ink}/><View style={{flex:1,gap:3}}><Text style={[s.h3,{fontSize:18,fontStyle:"normal",fontFamily:undefined}]}>{title}</Text><Text style={s.muted}>{subtitle}</Text></View><Ionicons name={section===id?"chevron-up":"chevron-down"} size={20} color={colors.muted}/>
 </Pressable>;
 const save=()=>void action.run(async()=>{
  if(languages.some(l=>!canonicalLanguage(l.name)||!Number.isInteger(Number(l.fluency))||Number(l.fluency)<0||Number(l.fluency)>100))throw new Error("Completa el idioma y selecciona un nivel válido.");
  if(new Set(languages.map(l=>canonicalLanguage(l.name))).size!==languages.length)throw new Error("No puedes agregar el mismo idioma dos veces.");
  await saveContactPreferences({show_email:showEmail,show_phone:showPhone});
  await professionalMutation("jobin_save_jcard",{legal_name:name,handle,city,region,availability,languages:languages.map(l=>({name:canonicalLanguage(l.name)!,fluency:Number(l.fluency)}))});
 },"JCard actualizada.");
 return <Screen demo={false} hideHeader hideFooter scrollRef={scrollRef} title="Editar mi JCard" subtitle="">
  {!w?<ProfessionalStatus loading={workspace.loading} error={workspace.error} retry={workspace.reload}/>:<>
   {!!action.notice&&<Notice text={action.notice} onClose={()=>action.setNotice("")}/>}
   <View style={{gap:6}}>
    <Text style={s.muted}>Selecciona una sección para editarla. Los cambios de tu JCard se guardan con el botón inferior.</Text>
    <View onLayout={e=>{positions.current.identity=e.nativeEvent.layout.y;}} style={s.panel}>
     {sectionRow("identity","Datos principales","Nombre, usuario, ubicación y disponibilidad","person-outline")}
     {section==="identity"&&<View style={{gap:12,paddingBottom:12}}>
      <Text style={s.muted}>Nombre legal</Text><TextInput accessibilityLabel="Nombre legal" value={name} onChangeText={setName} style={input}/>
      <Text style={s.muted}>Nombre de usuario</Text><TextInput accessibilityLabel="Nombre de usuario" value={handle} onChangeText={setHandle} autoCapitalize="none" style={input}/>
      <Text style={s.muted}>Ciudad</Text><TextInput accessibilityLabel="Ciudad" value={city} onChangeText={setCity} style={input}/>
      <Text style={s.muted}>Estado o región</Text><TextInput accessibilityLabel="Estado o región" value={region} onChangeText={setRegion} style={input}/>
      <Text style={s.muted}>Disponibilidad profesional</Text><Chips values={["AVAILABLE","ACTIVE"] as const} value={availability} onChange={setAvailability} getLabel={v=>v==="AVAILABLE"?"Disponible para trabajar":"Trabajando actualmente"} label="Disponibilidad profesional"/>
      <View style={{gap:8,padding:12,borderWidth:1,borderColor:colors.line,borderRadius:12}}><Text style={s.muted}>{availability==="ACTIVE"?"Para mostrar una empresa en tu JCard, envíale una solicitud. Solo aparecerá después de que la empresa la apruebe.":"Puedes administrar o finalizar vínculos laborales anteriores. El nombre de la empresa solo se muestra mientras indiques que estás trabajando."}</Text><Button secondary title="Gestionar vínculos laborales" onPress={()=>router.push("/employer-links")}/></View>
     </View>}
    </View>
    <View onLayout={e=>{positions.current.languages=e.nativeEvent.layout.y;}} style={s.panel}>
     {sectionRow("languages","Idiomas","Añade idiomas y selecciona tu nivel","globe-outline")}
     {section==="languages"&&<View style={{gap:16,paddingBottom:12}}>
      <Text style={s.muted}>El aro indica visualmente tu nivel. Se guarda como una puntuación compatible con tu JCard actual.</Text>
      {languages.map((l,index)=><View key={index} style={{gap:12,padding:14,borderWidth:1,borderColor:colors.line,borderRadius:14}}>
       <View style={{flexDirection:"row",alignItems:"center",gap:12}}>
        <LanguageRing name={l.name} value={Number(l.fluency)||0} color={colors.ink} track={colors.line}/>
        <View style={{flex:1,gap:5}}><LanguagePicker value={l.name} selected={languages.filter((_,i)=>i!==index).map(item=>item.name)} onChange={value=>setLanguages(items=>items.map((item,i)=>i===index?{...item,name:value}:item))}/><Text style={s.muted}>{languageLabel(Number(l.fluency)||0)}</Text></View>
       </View>
       <Text style={[s.text,{fontWeight:"600"}]}>¿Qué tan bien lo dominas?</Text>
       <View style={{flexDirection:"row",flexWrap:"wrap",gap:8}}>{LANGUAGE_LEVELS.map(level=><Pressable key={level.value} accessibilityRole="radio" accessibilityState={{checked:Number(l.fluency)===level.value}} onPress={()=>setLanguages(items=>items.map((item,i)=>i===index?{...item,fluency:String(level.value)}:item))} style={{borderWidth:1,borderColor:colors.line,borderRadius:22,paddingHorizontal:12,paddingVertical:9,backgroundColor:Number(l.fluency)===level.value?colors.accent:colors.paper}}>
        <Text style={{color:colors.ink,fontSize:13,fontWeight:Number(l.fluency)===level.value?"700":"400"}}>{level.label}</Text>
       </Pressable>)}</View>
       <Button secondary title="Quitar idioma" onPress={()=>setLanguages(items=>items.filter((_,i)=>i!==index))}/>
      </View>)}
      <Button secondary title="+ Agregar idioma" onPress={()=>setLanguages(items=>[...items,{name:"",fluency:"45"}])}/>
     </View>}
    </View>
    {w.card.accountType==="personal"&&<View onLayout={e=>{positions.current.professions=e.nativeEvent.layout.y;}} style={s.panel}>
     {sectionRow("professions","Profesiones y formación","Oficios, estudios y verificación","school-outline")}
     {section==="professions"&&<View style={{gap:14,paddingBottom:12}}>
      <Text style={s.muted}>Hasta 10 profesiones verificadas y una sin verificar. Los certificados requieren revisión.</Text>
      {w.professions.map(p=><View key={p.id} style={{gap:10,borderWidth:1,borderColor:colors.line,borderRadius:12,padding:12}}>
       <View style={{flexDirection:"row",alignItems:"flex-start",gap:12}}>
        <View style={{flex:1,gap:5}}><Text style={[s.h3,{fontSize:17}]}><Ionicons name={professionIcon(p.profession_code)} size={20} color={colors.ink}/>  {p.label}{p.primary_profession?" · Principal":""}</Text><Text style={s.muted}>{p.training_status==="in_academy"?"En formación":"Graduado"} · {p.verified?"Verificado":"Sin verificar"}{p.school?" · "+p.school:""}</Text></View>
        <Pressable accessibilityRole="button" accessibilityLabel={"Editar "+p.label} onPress={()=>openProfession(p.profession_code,p.primary_profession)} style={{padding:8,borderRadius:8,borderWidth:1,borderColor:colors.line}}><Ionicons name="create-outline" size={23} color={colors.ink}/></Pressable>
        {!p.verified&&<Pressable accessibilityRole="button" accessibilityLabel={"Eliminar "+p.label} onPress={()=>Alert.alert("Eliminar profesión",p.primary_profession?"¿Eliminar tu profesión principal? Puedes seleccionar otra después.":"¿Eliminar esta profesión?",[{text:"Cancelar",style:"cancel"},{text:"Eliminar",style:"destructive",onPress:()=>void action.run(()=>professionalMutation("jobin_remove_unverified_profession",{profession:p.profession_code}),"Profesión eliminada.")}])} style={{padding:8,borderRadius:8,borderWidth:1,borderColor:colors.line}}><Ionicons name="trash-outline" size={23} color={colors.ink}/></Pressable>}
       </View>
      </View>)}
      {!professionFormOpen&&<Button secondary title="+ Agregar profesión" onPress={addProfession}/>}
      {professionFormOpen&&<View onLayout={e=>setFormTop(e.nativeEvent.layout.y+(positions.current.professions??0))} style={{gap:12,borderWidth:1,borderColor:colors.line,borderRadius:12,padding:12}}>
       <View style={{flexDirection:"row",alignItems:"center",justifyContent:"space-between",gap:8}}><Text style={[s.h3,{fontSize:17,flex:1}]}>{formMode==="edit"?"Editar profesión":"Agregar profesión"}</Text><Pressable accessibilityRole="button" accessibilityLabel="Cerrar formulario de profesión" onPress={()=>{setProfessionFormOpen(false);setEditingProfession(null);}} style={{padding:7}}><Ionicons name="close-circle-outline" size={25} color={colors.ink}/></Pressable></View>
       {formMode==="edit"&&<Text style={s.muted}>Selecciona otra profesión de la lista para reemplazar la actual, o modifica sus datos de formación.</Text>}
       {!!catalog.error&&<Notice text={catalog.error} onClose={catalog.reload}/>}
       <ProfessionPicker catalog={catalog.data} value={profession} onChange={choose}/>
       <Chips values={["graduado","in_academy"] as const} value={training} onChange={setTraining} getLabel={v=>v==="graduado"?"Graduado":"En formación"} label="Formación"/>
       <Text style={s.muted}>Institución educativa (opcional)</Text>
       <Button secondary title={institution?"Quitar institución":"Sin institución seleccionada"} onPress={()=>setInstitution(null)}/>
       {education.loading?<Text style={s.muted}>Buscando instituciones…</Text>:education.error?<Text style={s.muted}>{education.error}</Text>:education.data?.map(school=><Button key={school.id} secondary title={(institution===school.id?"✓ ":"")+school.name} onPress={()=>setInstitution(school.id)}/>)}
       {!education.loading&&!education.error&&education.data?.length===0&&<Text style={s.muted}>No hay instituciones preaprobadas para esta profesión. Puedes continuar sin seleccionar una.</Text>}
       {formMode==="edit"?<Button title="Guardar profesión" onPress={()=>void action.run(async()=>{if(!profession)throw new Error("Selecciona una profesión.");await professionalMutation("jobin_set_profession",{profession,training,institution:institution??undefined,make_primary:editedPrimary});if(editingProfession&&editingProfession!==profession){await professionalMutation("jobin_remove_unverified_profession",{profession:editingProfession});}setProfessionFormOpen(false);setEditingProfession(null);},"Profesión actualizada.")}/>:<>
        <Button secondary title="Guardar como secundaria" onPress={()=>void action.run(async()=>{if(!profession)throw new Error("Selecciona una profesión.");await professionalMutation("jobin_set_profession",{profession,training,institution:institution??undefined,make_primary:false});setProfessionFormOpen(false);},"Profesión secundaria guardada.")}/>
        <Button title="Guardar como principal" onPress={()=>void action.run(async()=>{if(!profession)throw new Error("Selecciona una profesión.");await professionalMutation("jobin_set_profession",{profession,training,institution:institution??undefined,make_primary:true});setProfessionFormOpen(false);},"Profesión principal guardada.")}/>
       </>}
      </View>}
     </View>}
    </View>}
    <View onLayout={e=>{positions.current.privacy=e.nativeEvent.layout.y;}} style={s.panel}>
     {sectionRow("privacy","Privacidad de contacto","Decide si muestras correo y teléfono","lock-closed-outline")}
     {section==="privacy"&&<View style={{gap:18,paddingBottom:12}}>
      <Text style={s.muted}>Ambos datos permanecen ocultos por defecto.</Text>
      <Pressable accessibilityRole="checkbox" accessibilityState={{checked:showEmail}} onPress={()=>setShowEmail(v=>!v)} style={{flexDirection:"row",gap:12,alignItems:"center",paddingVertical:8}}><Ionicons name={showEmail?"checkbox":"square-outline"} size={26} color={colors.ink}/><Text style={[s.text,{flex:1}]}>Mostrar correo en mi JCard</Text></Pressable>
      <Pressable accessibilityRole="checkbox" accessibilityState={{checked:showPhone}} onPress={()=>setShowPhone(v=>!v)} style={{flexDirection:"row",gap:12,alignItems:"center",paddingVertical:8}}><Ionicons name={showPhone?"checkbox":"square-outline"} size={26} color={colors.ink}/><Text style={[s.text,{flex:1}]}>Mostrar teléfono en mi JCard</Text></Pressable>
     </View>}
    </View>
    <Button title={action.busy?"Guardando…":"Guardar cambios de JCard"} onPress={save}/>
   </View>
  </>}
 </Screen>;
}
