import {assertMessageScope,captureMessageScope,type MessageScope} from "../lib/message-session";
import {consumePersonalPhotoChange} from "../lib/personal-jcard-photo";
import {readJCardVisibility,saveJCardVisibility,DEFAULT_JCARD_VISIBILITY} from "../lib/jcard-visibility";
import { useCallback, useEffect, useRef, useState } from "react";
import {router,Stack,useFocusEffect,useNavigation} from "expo-router";
import {usePreventRemove} from "@react-navigation/native";
import { Alert, Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Button, Chips, Notice, Screen, useUi } from "../components/ui";
import { ProfessionPicker } from "../components/ProfessionPicker";
import { SpecialtyPicker } from "../components/SpecialtyPicker";
import { ProfessionalStatus } from "../components/ProfessionalStatus";
import { loadCatalog, loadEducation, loadSpecialtyCatalog, loadWorkspace, professionalMutation, replacePrimaryProfession, replaceSecondaryProfession, saveProfessionSpecialties } from "../lib/professional-api";
import { useProfessionalAction, useProfessionalData } from "../state/useProfessionalData";
import {loadContactPreferences,saveContactPreferences,loadPersonalContactDetails,savePersonalContactDetails} from "../lib/jcard-contact";
import {LanguageRing,LANGUAGE_LEVELS,languageLabel} from "../components/LanguageRing";
import {LanguagePicker} from "../components/LanguagePicker";
import {canonicalLanguage} from "../lib/languages";
import {Ionicons} from "@expo/vector-icons";
import {useTheme} from "../state/ThemeProvider";
import {jobeenTokens} from "../theme/jobeen";
import {jobeenModalTokens} from "../theme/modals";
import {JOBEEN_TYPE} from "../theme/typography";
import {JOBEEN_CONTROL} from "../theme/control-metrics";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {ProfessionGlyph} from "../components/ProfessionGlyph";
import type { JCardStatus } from "../lib/jcard";

export default function Professional() {
 const {s,colors}=useUi();
 const {theme}=useTheme();
 const jt=jobeenTokens(theme);const modal=jobeenModalTokens(theme);
 const insets=useSafeAreaInsets();
 const workspace=useProfessionalData(loadWorkspace,true);
 useFocusEffect(useCallback(()=>{
  let active=true;
  void(async()=>{try{
   const scope=await captureMessageScope();await assertMessageScope(scope);
   if(active&&consumePersonalPhotoChange(scope))void workspace.reload();
  }catch{/* An unverified session must not consume the avatar event. */}})();
  return()=>{active=false;};
 },[workspace.reload]));const catalog=useProfessionalData(loadCatalog);
 const action=useProfessionalAction(workspace.reload);
 const navigation=useNavigation();
 const editorScopeRef=useRef<MessageScope|null>(null),activeRef=useRef(false);
 const [editorScope,setEditorScope]=useState<MessageScope|null>(null);
 const [editorError,setEditorError]=useState(""),[editorRevision,setEditorRevision]=useState(0);
 const [settingsReady,setSettingsReady]=useState(false);
 const [unsavedDialogOpen,setUnsavedDialogOpen]=useState(false);
 const pendingExitRef=useRef<null|(()=>void)>(null);
 const keepEditing=()=>{pendingExitRef.current=null;setUnsavedDialogOpen(false);};
 const discardChanges=()=>{const exit=pendingExitRef.current;pendingExitRef.current=null;setUnsavedDialogOpen(false);exit?.();};
 const specialtyCatalog=useProfessionalData(loadSpecialtyCatalog);
 const [specialties,setSpecialties]=useState<string[]>([]);
 type Section="identity"|"languages"|"professions"|"privacy";
 const [section,setSection]=useState<Section|null>(null);
 const scrollRef=useRef<ScrollView>(null);
 const positions=useRef<Partial<Record<Section,number>>>({});
 const [editingProfession,setEditingProfession]=useState<string|null>(null);
 const [professionFormOpen,setProfessionFormOpen]=useState(false);
 const [professionSaveError,setProfessionSaveError]=useState("");
 const professionFormRef=useRef<View>(null);
 const scrollToProfessionForm=()=>{const content=scrollRef.current?.getInnerViewNode();if(!content)return;professionFormRef.current?.measureLayout(content,(_x,y)=>scrollRef.current?.scrollTo({y:Math.max(0,y-24),animated:true}),()=>{});};
 useEffect(()=>{if(section!=="professions"||!professionFormOpen)return;const timer=setTimeout(scrollToProfessionForm,260);return()=>clearTimeout(timer);},[section,professionFormOpen,editingProfession]);
 const [formMode,setFormMode]=useState<"add"|"edit">("add");
 const [editedPrimary,setEditedPrimary]=useState(false);
 function openSection(id:Section){setSection(current=>current===id?null:id);}
 function openProfession(code:string,primary:boolean){setProfessionSaveError("");choose(code);setSpecialties(w?.professions.find(p=>p.profession_code===code)?.specialties??[]);setFormMode("edit");setEditedPrimary(primary);setEditingProfession(code);setProfessionFormOpen(true);}
 function addProfession(){setProfessionSaveError("");setSpecialties([]);setProfession("");setTraining("graduado");setInstitution(null);setFormMode("add");setEditingProfession(null);setEditedPrimary(false);setProfessionFormOpen(true);}
 useEffect(()=>{if(!section)return;const t=setTimeout(()=>scrollRef.current?.scrollTo({y:Math.max(0,(positions.current[section]??0)-18),animated:true}),160);return()=>clearTimeout(t);},[section]);
 const [visibility,setVisibility]=useState(DEFAULT_JCARD_VISIBILITY);
 const [savedVisibility,setSavedVisibility]=useState(DEFAULT_JCARD_VISIBILITY);
 const [showEmail,setShowEmail]=useState(false);const [showPhone,setShowPhone]=useState(false);
 const [savedContactPreferences,setSavedContactPreferences]=useState({show_email:false,show_phone:false});
 const [personalContacts,setPersonalContacts]=useState({email_primary:"",email_secondary:"",phone_primary:"",phone_secondary:""});
 const [savedPersonalContacts,setSavedPersonalContacts]=useState({email_primary:"",email_secondary:"",phone_primary:"",phone_secondary:""});
 function changePhoto(){router.push("/personal-avatar-editor");}
 const [name,setName]=useState("");const [handle,setHandle]=useState("");const [city,setCity]=useState("");const [region,setRegion]=useState("");
 const [availability,setAvailability]=useState<JCardStatus>("AVAILABLE");

 const [languages,setLanguages]=useState<{name:string;fluency:string}[]>([]);
 const [profession,setProfession]=useState("");const [training,setTraining]=useState<"graduado"|"in_academy"|"practica">("graduado");
 const [institution,setInstitution]=useState<string|null>(null);
 const education=useProfessionalData(useCallback(()=>profession?loadEducation(profession):Promise.resolve([]),[profession]));
 const w=editorScope&&settingsReady&&workspace.data?.card.id===editorScope.owner?workspace.data:null;
 useEffect(()=>{
  let current=true;activeRef.current=true;setSettingsReady(false);setEditorError("");
  void(async()=>{
   try{
    const scope=await captureMessageScope(editorScopeRef.current??undefined);
    if(!current)return;
    editorScopeRef.current=scope;
    const [v,p,contacts]=await Promise.all([
     readJCardVisibility(scope.owner,scope),loadContactPreferences(scope),loadPersonalContactDetails(scope.owner,scope)
    ]);
    await assertMessageScope(scope);
    if(!current||editorScopeRef.current!==scope)return;
    setVisibility(v);setSavedVisibility(v);
    setShowEmail(p.show_email);setShowPhone(p.show_phone);setSavedContactPreferences(p);
    setPersonalContacts(contacts);setSavedPersonalContacts(contacts);
    setEditorScope(scope);setSettingsReady(true);
   }catch(e){if(current){setSettingsReady(false);setEditorError(e instanceof Error?e.message:"No se pudo verificar la privacidad de tu JCard.");}}
  })();
  return()=>{current=false;activeRef.current=false;};
 },[editorRevision]);
 function retryEditor(){setEditorRevision(n=>n+1);workspace.reload();}
 async function verifyEditor(origin:MessageScope){
  if(!activeRef.current||editorScopeRef.current!==origin)throw Error("El editor ya no pertenece a esta sesión.");
  await captureMessageScope(origin);
  if(!activeRef.current||editorScopeRef.current!==origin)throw Error("La sesión cambió.");
 }
 async function saveProfession(asPrimary:boolean){
  const origin=editorScope;
  if(!origin||!w||action.busy)return;
  await action.run(async()=>{
   await verifyEditor(origin);
   if(!profession)throw Error("Selecciona una profesión.");
   if(w.professions.some(p=>p.profession_code===profession&&p.primary_profession&&!asPrimary))throw Error("Esta profesión ya es tu profesión principal.");
   if(formMode==="edit"&&editingProfession&&editingProfession!==profession){
    if(editedPrimary)await replacePrimaryProfession(editingProfession,profession,training,institution,origin);
    else await replaceSecondaryProfession(editingProfession,profession,training,institution,origin);
   }else await professionalMutation("jobin_set_profession",{profession,training,institution:institution??undefined,make_primary:asPrimary},origin);
   await verifyEditor(origin);
   await saveProfessionSpecialties(profession,specialties,origin);
   await verifyEditor(origin);
   setProfessionFormOpen(false);setEditingProfession(null);
  },formMode==="edit"?"Profesión actualizada.":asPrimary?"Profesión principal guardada.":"Profesión secundaria guardada.");
 }
 function removeProfession(code:string,primary:boolean){
  const origin=editorScope;
  if(!origin||!w)return;
  Alert.alert("Eliminar profesión",primary?"¿Eliminar tu profesión principal? Puedes seleccionar otra después.":"¿Eliminar esta profesión?",[
   {text:"Cancelar",style:"cancel"},
   {text:"Eliminar",style:"destructive",onPress:()=>void action.run(async()=>{
    await verifyEditor(origin);
    await professionalMutation("jobin_remove_unverified_profession",{profession:code},origin);
    await verifyEditor(origin);
   },"Profesión eliminada.")}
  ]);
 }


 useEffect(()=>{if(!w)return;setName(w.card.name);setHandle(w.card.handle);setCity(w.profile.city||"");setRegion(w.profile.region||"");setAvailability(w.card.status);setLanguages(w.card.languages.map(l=>({name:l.name,fluency:String(l.fluency)})));},[w]);
 const input={color:colors.ink,borderColor:colors.line,borderWidth:1,borderRadius:10,padding:12,minHeight:JOBEEN_CONTROL.touchTarget};
 function choose(code:string){setProfession(code);setSpecialties(w?.professions.find(p=>p.profession_code===code)?.specialties??[]);const pp=w?.professions.find(p=>p.profession_code===code);setTraining(pp?.training_status??"graduado");setInstitution(pp?.institution_id??null);}
 const sectionRow=(id:Section,title:string,icon:React.ComponentProps<typeof Ionicons>["name"])=><Pressable accessibilityRole="button" accessibilityState={{expanded:section===id}} onPress={()=>openSection(id)} style={{flexDirection:"row",alignItems:"center",gap:12,paddingVertical:JOBEEN_CONTROL.accordionRowVerticalPadding,minHeight:JOBEEN_CONTROL.touchTarget}}>
  <Ionicons name={icon} size={23} color={colors.ink}/><View style={{flex:1,gap:3}}><Text style={[s.h3,{fontSize:JOBEEN_TYPE.sectionTitle,fontStyle:"normal",fontFamily:undefined,color:colors.ink}]}>{title}</Text></View><Ionicons name={section===id?"chevron-up":"chevron-down"} size={20} color={colors.muted}/>
 </Pressable>;
 type SaveTarget="identity"|"languages"|"privacy";
 const identityDirty=!!w&&(name!==w.card.name||handle!==w.card.handle||city!==(w.profile.city??"")||
  region!==(w.profile.region??"")||availability!==w.card.status||
  JSON.stringify(personalContacts)!==JSON.stringify(savedPersonalContacts));
 const languageDirty=!!w&&JSON.stringify(languages)!==JSON.stringify(w.card.languages.map(l=>({name:l.name,fluency:String(l.fluency)})));
 const privacyDirty=showEmail!==savedContactPreferences.show_email||showPhone!==savedContactPreferences.show_phone||
  JSON.stringify(visibility)!==JSON.stringify(savedVisibility);
 const hasUnsavedChanges=identityDirty||languageDirty||privacyDirty;
 const pendingTargets:SaveTarget[]=[
  ...(identityDirty?["identity" as const]:[]),
  ...(languageDirty?["languages" as const]:[]),
  ...(privacyDirty?["privacy" as const]:[])
 ];
 const saveSections=(targets:SaveTarget[])=>{
  if(action.busy||!targets.length||!w?.card.id||!editorScope||!settingsReady)return;
  const owner=w.card.id,origin=editorScope;
  const saveIdentity=targets.includes("identity");
  const saveLanguages=targets.includes("languages");
  const savePrivacy=targets.includes("privacy");
  void action.run(async()=>{
   await verifyEditor(origin);
   if(saveIdentity||saveLanguages){
    const fresh=await loadWorkspace(origin);if(!fresh||fresh.card.id!==owner)throw new Error("La cuenta cambió.");
    const legalName=saveIdentity?name.trim().replace(/\s+/g," "):fresh.card.name;
    if(saveIdentity){
     if(!/^[\p{L}\p{M}]+(?:[ \u0027\u2019-][\p{L}\p{M}]+)*$/u.test(legalName)||Array.from(legalName).length>30)
      throw new Error("El nombre debe tener entre 1 y 30 caracteres.");
     for(const key of ["email_primary","email_secondary"] as const){
      const v=personalContacts[key].trim();
      if(v&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))throw new Error("Revisa el correo electrónico.");
     }
    }
    const nextLanguages=saveLanguages?languages:fresh.card.languages;
    if(nextLanguages.some(l=>!canonicalLanguage(l.name)||!Number.isInteger(Number(l.fluency))||Number(l.fluency)<0||Number(l.fluency)>100))
     throw new Error("Completa el idioma y selecciona un nivel válido.");
    if(new Set(nextLanguages.map(l=>canonicalLanguage(l.name))).size!==nextLanguages.length)
     throw new Error("No puedes agregar el mismo idioma dos veces.");
    await verifyEditor(origin);
    await professionalMutation("jobin_save_jcard",{
     legal_name:legalName,handle:saveIdentity?handle:fresh.card.handle,
     city:saveIdentity?city:(fresh.profile.city??""),
     region:saveIdentity?region:(fresh.profile.region??""),
     availability:saveIdentity?availability:fresh.card.status,
     languages:nextLanguages.map(l=>({name:canonicalLanguage(l.name)!,fluency:Number(l.fluency)}))
    },origin);
    if(saveIdentity){await verifyEditor(origin);await savePersonalContactDetails(personalContacts,owner,origin);}
   }
   if(savePrivacy){
    await verifyEditor(origin);
    await saveContactPreferences({show_email:showEmail,show_phone:showPhone},owner,origin);
    await verifyEditor(origin);
    await saveJCardVisibility(visibility,owner,origin);
   }
   await verifyEditor(origin);
  },"").then(ok=>{
   if(!ok)return;
   if(!activeRef.current||editorScopeRef.current!==origin)return;
   if(saveIdentity)setSavedPersonalContacts({...personalContacts});
   if(savePrivacy){
    setSavedContactPreferences({show_email:showEmail,show_phone:showPhone});
    setSavedVisibility({...visibility});
   }
   setSection(null);
  });
 };
 const saveSection=(target:SaveTarget)=>saveSections(Array.from(new Set([...pendingTargets,target])));
 usePreventRemove(hasUnsavedChanges||professionFormOpen,({data})=>{
  pendingExitRef.current=()=>navigation.dispatch(data.action);
  setUnsavedDialogOpen(true);
 });

 return <>
  <Stack.Screen options={{headerRight:hasUnsavedChanges?()=>(
   <Pressable accessibilityRole="button" accessibilityLabel="Guardar cambios de JCard"
    accessibilityState={{disabled:action.busy}} disabled={action.busy}
    onPress={()=>saveSections(pendingTargets)}
    style={{minWidth:72,minHeight:JOBEEN_CONTROL.touchTarget,justifyContent:"center",alignItems:"center"}}>
    <Text style={{fontSize:15,fontWeight:"700",color:colors.ink}}>{action.busy?"Guardando…":"Guardar"}</Text>
   </Pressable>
  ):undefined}}/>
  <Screen demo={false} hideHeader hideFooter scrollRef={scrollRef} title="Editar mi JCard" subtitle="">
  {!w?<ProfessionalStatus loading={workspace.loading||(!settingsReady&&!editorError)} error={editorError||workspace.error} retry={retryEditor}/>:<>
   {!!action.notice&&<Notice text={action.notice} onClose={()=>action.setNotice("")}/>}
   <View style={{gap:6,paddingTop:0,paddingBottom:8}}>
    <View onLayout={e=>{positions.current.identity=e.nativeEvent.layout.y;}} style={[s.panel,{padding:JOBEEN_CONTROL.panelPadding,gap:JOBEEN_CONTROL.panelGap}]}>
     {sectionRow("identity","Datos principales","person-outline")}
     {section==="identity"&&<View style={{gap:12,paddingBottom:12}}>
      <Button secondary title={"Cambiar foto de JCard personal"} onPress={changePhoto}/>
      <Text style={s.muted}>Nombre legal</Text><TextInput accessibilityLabel="Nombre legal" value={name} maxLength={30} onChangeText={value=>setName(value.replace(/[^\p{L}\p{M} \u0027\u2019-]/gu,"").slice(0,30))} style={input}/>
      <Text style={s.muted}>Nombre de usuario</Text><TextInput accessibilityLabel="Nombre de usuario" value={handle} onChangeText={setHandle} autoCapitalize="none" style={input}/>
      <Text style={s.muted}>Ciudad</Text><TextInput accessibilityLabel="Ciudad" value={city} onChangeText={setCity} style={input}/>
      <Text style={s.muted}>Estado o región</Text><TextInput accessibilityLabel="Estado o región" value={region} onChangeText={setRegion} style={input}/>
      {(["email_primary","email_secondary","phone_primary","phone_secondary"] as const).map(key=><View key={key} style={{gap:5}}><Text style={s.muted}>{{email_primary:"Correo electrónico principal (opcional)",email_secondary:"Correo electrónico secundario (opcional)",phone_primary:"Teléfono principal (opcional)",phone_secondary:"Teléfono secundario (opcional)"}[key]}</Text><TextInput accessibilityLabel={key} value={personalContacts[key]} onChangeText={value=>setPersonalContacts(p=>({...p,[key]:value}))} keyboardType={key.startsWith("email")?"email-address":"phone-pad"} autoCapitalize="none" maxLength={key.startsWith("email")?254:40} style={input}/></View>)}
      <Text style={s.muted}>Disponibilidad profesional</Text><Chips values={["AVAILABLE","ACTIVE"] as const} value={availability} onChange={setAvailability} getLabel={v=>v==="AVAILABLE"?"Disponible para trabajar":"Trabajando actualmente"} label="Disponibilidad profesional"/>
      <View style={{gap:8,padding:12,borderWidth:1,borderColor:colors.line,borderRadius:12}}><Text style={s.muted}>{availability==="ACTIVE"?"Para mostrar una empresa en tu JCard, envíale una solicitud. Solo aparecerá después de que la empresa la apruebe.":"Puedes administrar o finalizar vínculos laborales anteriores. El nombre de la empresa solo se muestra mientras indiques que estás trabajando."}</Text><Button secondary title="Gestionar vínculos laborales" onPress={()=>router.push("/employer-links")}/></View>
      <Button title={action.busy?"Guardando…":"Guardar cambios"} onPress={()=>saveSection("identity")}/>
     </View>}
    </View>
    <View onLayout={e=>{positions.current.languages=e.nativeEvent.layout.y;}} style={[s.panel,{padding:JOBEEN_CONTROL.panelPadding,gap:JOBEEN_CONTROL.panelGap}]}>
     {sectionRow("languages","Idiomas","globe-outline")}
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
      <Button title={action.busy?"Guardando…":"Guardar cambios"} onPress={()=>saveSection("languages")}/>
     </View>}
    </View>
    {w.card.accountType==="personal"&&<View onLayout={e=>{positions.current.professions=e.nativeEvent.layout.y;}} style={[s.panel,{padding:JOBEEN_CONTROL.panelPadding,gap:JOBEEN_CONTROL.panelGap}]}>
     {sectionRow("professions","Profesiones y formación","school-outline")}
     {section==="professions"&&<View style={{gap:14,paddingBottom:12}}>
      <Text style={s.muted}>Puedes declarar tus profesiones sin un límite global. Una es principal y las demás secundarias. Declarar una profesión no verifica tus credenciales: los certificados se revisan por separado.</Text>
      {w.professions.map(p=><View key={p.id} style={{gap:10,borderWidth:1,borderColor:colors.line,borderRadius:12,padding:12}}>
       <View style={{flexDirection:"row",alignItems:"flex-start",gap:12}}>
        <View style={{flex:1,gap:5}}><Text style={[s.h3,{fontSize:17}]}><ProfessionGlyph profession={p.profession_code} size={20} color={colors.ink}/>  {p.label}{p.primary_profession?" · Principal":""}</Text><Text style={s.muted}>{p.training_status==="in_academy"?"En formación":p.training_status==="practica"?"Aprendido en la práctica":"Graduado"} · {p.verified?"Verificado":"Sin verificar"}{p.school?" · "+p.school:""}</Text></View>
        <Pressable accessibilityRole="button" accessibilityLabel={"Editar "+p.label} onPress={()=>openProfession(p.profession_code,p.primary_profession)} style={{padding:8,borderRadius:8,borderWidth:1,borderColor:colors.line}}><Ionicons name="create-outline" size={23} color={colors.ink}/></Pressable>
        {!p.verified&&<Pressable accessibilityRole="button" accessibilityLabel={"Eliminar "+p.label} onPress={()=>removeProfession(p.profession_code,p.primary_profession)} style={{padding:8,borderRadius:8,borderWidth:1,borderColor:colors.line}}><Ionicons name="trash-outline" size={23} color={colors.ink}/></Pressable>}
       </View>
      </View>)}
      {!professionFormOpen&&<Button secondary title="+ Agregar profesión" onPress={addProfession}/>}
      {professionFormOpen&&<View ref={professionFormRef} onLayout={()=>{if(professionFormOpen)requestAnimationFrame(scrollToProfessionForm);}} style={{gap:12,borderWidth:1,borderColor:colors.line,borderRadius:12,padding:12}}>
       <View style={{flexDirection:"row",alignItems:"center",justifyContent:"space-between",gap:8}}><Text style={[s.h3,{fontSize:17,flex:1}]}>{formMode==="edit"?"Editar profesión":"Agregar profesión"}</Text><Pressable accessibilityRole="button" accessibilityLabel="Cerrar formulario de profesión" onPress={()=>{setProfessionFormOpen(false);setEditingProfession(null);}} style={{padding:7}}><Ionicons name="close-circle-outline" size={25} color={colors.ink}/></Pressable></View>
       {formMode==="edit"&&<Text style={s.muted}>Selecciona otra profesión de la lista para reemplazar la actual, o modifica sus datos de formación.</Text>}
       {!!catalog.error&&<Notice text={catalog.error} onClose={catalog.reload}/>}
       <ProfessionPicker catalog={catalog.data} value={profession} onChange={choose}/>
       <Text style={[s.h3,{fontSize:15}]}>Especialidades (opcional)</Text>
       <Text style={s.muted}>Selecciona las áreas en las que trabajas. Aparecerán en la información de tu profesión, no como una lista en la JCard. Son declaradas por el usuario.</Text>
       <SpecialtyPicker key={profession} options={specialtyCatalog.data?.[profession]??[]} selected={specialties} onChange={setSpecialties} loading={specialtyCatalog.loading}/>
       <Chips values={["graduado","in_academy","practica"] as const} value={training} onChange={v=>{setTraining(v);if(v==="practica")setInstitution(null);}} getLabel={v=>v==="graduado"?"Graduado":v==="in_academy"?"En formación":"Aprendido en la práctica"} label="Formación"/>
       {training!=="practica"&&<Text style={s.muted}>Institución educativa (opcional)</Text>}
       {training!=="practica"&&<Button secondary title={institution?"Quitar institución":"Sin institución seleccionada"} onPress={()=>setInstitution(null)}/>}
       {training!=="practica"&&(education.loading?<Text style={s.muted}>Buscando instituciones…</Text>:education.error?<Text style={s.muted}>{education.error}</Text>:education.data?.map(school=><Button key={school.id} secondary title={(institution===school.id?"✓ ":"")+school.name} onPress={()=>setInstitution(school.id)}/>))}
       {training!=="practica"&&!education.loading&&!education.error&&education.data?.length===0&&<Text style={s.muted}>No hay instituciones preaprobadas para esta profesión. Puedes continuar sin seleccionar una.</Text>}
       {formMode==="edit"?<Button title="Guardar" onPress={()=>void saveProfession(editedPrimary)}/>:<>
        <Button secondary title="Guardar como secundaria" onPress={()=>void saveProfession(false)}/>
        <Button title="Guardar como principal" onPress={()=>void saveProfession(true)}/>
       </>}
      </View>}
     </View>}
    </View>}
    <View onLayout={e=>{positions.current.privacy=e.nativeEvent.layout.y;}} style={[s.panel,{padding:JOBEEN_CONTROL.panelPadding,gap:JOBEEN_CONTROL.panelGap}]}>
     {sectionRow("privacy","Privacidad de contacto","lock-closed-outline")}
     {section==="privacy"&&<View style={{gap:18,paddingBottom:12}}>
      <Text style={s.muted}>Ambos datos permanecen ocultos por defecto.</Text>
      <Pressable accessibilityRole="checkbox" accessibilityState={{checked:showEmail}} onPress={()=>setShowEmail(v=>!v)} style={{flexDirection:"row",gap:12,alignItems:"center",paddingVertical:8,minHeight:JOBEEN_CONTROL.touchTarget}}><Ionicons name={showEmail?"checkbox":"square-outline"} size={26} color={colors.ink}/><Text style={[s.text,{flex:1}]}>Mostrar correo en mi JCard</Text></Pressable>
      <Pressable accessibilityRole="checkbox" accessibilityState={{checked:showPhone}} onPress={()=>setShowPhone(v=>!v)} style={{flexDirection:"row",gap:12,alignItems:"center",paddingVertical:8,minHeight:JOBEEN_CONTROL.touchTarget}}><Ionicons name={showPhone?"checkbox":"square-outline"} size={26} color={colors.ink}/><Text style={[s.text,{flex:1}]}>Mostrar teléfono en mi JCard</Text></Pressable>
       <Pressable accessibilityRole="checkbox" accessibilityState={{checked:visibility.personal_enabled}} onPress={()=>{if(visibility.personal_enabled&&!visibility.business_enabled){Alert.alert("Al menos una JCard activa","Debes conservar activa la JCard personal o la de negocio.");return;}setVisibility(v=>({...v,personal_enabled:!v.personal_enabled}));}} style={{flexDirection:"row",gap:12,alignItems:"center",paddingVertical:8,minHeight:JOBEEN_CONTROL.touchTarget}}><Ionicons name={visibility.personal_enabled?"checkbox":"square-outline"} size={26} color={colors.ink}/><Text style={[s.text,{flex:1}]}>Mostrar mi JCard personal en el perfil</Text></Pressable>
      <Button title={action.busy?"Guardando…":"Guardar cambios"} onPress={()=>saveSection("privacy")}/>
     </View>}
    </View>
    <View style={[s.panel,{padding:JOBEEN_CONTROL.panelPadding,gap:JOBEEN_CONTROL.panelGap}]}><Pressable accessibilityRole="button" onPress={()=>router.push("/jcard-backgrounds")} style={{flexDirection:"row",alignItems:"center",gap:12,paddingVertical:JOBEEN_CONTROL.accordionRowVerticalPadding,minHeight:JOBEEN_CONTROL.touchTarget}}><Ionicons name="color-palette-outline" size={23} color={colors.ink}/><View style={{flex:1,gap:3}}><Text style={[s.h3,{fontSize:JOBEEN_TYPE.sectionTitle,fontStyle:"normal",fontFamily:undefined,color:colors.ink}]}>Apariencia</Text></View><Ionicons name="chevron-forward" size={20} color={colors.muted}/></Pressable></View>

   </View>
  </>}
  </Screen>
  <Modal visible={unsavedDialogOpen} transparent animationType="slide" onRequestClose={keepEditing} statusBarTranslucent={false}>
   <View style={{flex:1,justifyContent:"flex-end"}}>
    <Pressable accessibilityRole="button" accessibilityLabel="Cerrar aviso de cambios sin guardar"
     onPress={keepEditing} style={{position:"absolute",top:0,bottom:0,left:0,right:0,backgroundColor:modal.scrim}}/>
    <View accessibilityViewIsModal style={{width:"100%",maxWidth:640,alignSelf:"center",
     borderTopLeftRadius:modal.radius.sheet,borderTopRightRadius:modal.radius.sheet,backgroundColor:modal.surface,
     borderTopWidth:1,borderLeftWidth:1,borderRightWidth:1,borderColor:modal.border,
     paddingHorizontal:22,paddingTop:13,paddingBottom:Math.max(insets.bottom,20),
     shadowColor:jt.floatingCardShadow,shadowOpacity:0.2,shadowRadius:24,
     shadowOffset:{width:0,height:-6},elevation:16}}>
     <View style={{width:44,height:5,borderRadius:5,alignSelf:"center",backgroundColor:modal.handle,marginBottom:14}}/>
     <Text accessibilityRole="header" style={{fontSize:JOBEEN_TYPE.modalTitle,lineHeight:22,fontWeight:"800",color:modal.text,marginBottom:8}}>
      ¿Descartar cambios?
     </Text>
     <Text style={{fontSize:JOBEEN_TYPE.body,lineHeight:21,color:modal.muted,marginBottom:18}}>
      Los cambios de tu JCard que no guardaste se perderán.
     </Text>
     <View style={{gap:10}}>
      <Pressable accessibilityRole="button" accessibilityLabel="Descartar cambios sin guardar"
       onPress={discardChanges} style={{minHeight:JOBEEN_CONTROL.touchTarget,borderRadius:modal.radius.control,backgroundColor:modal.accent,
        alignItems:"center",justifyContent:"center",paddingHorizontal:14}}>
       <Text style={{fontSize:JOBEEN_TYPE.modalAction,fontWeight:"700",color:modal.text}}>Descartar cambios</Text>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Seguir editando"
       onPress={keepEditing} style={{minHeight:JOBEEN_CONTROL.touchTarget,borderRadius:modal.radius.control,borderWidth:1,borderColor:modal.border,
        backgroundColor:modal.inner,alignItems:"center",justifyContent:"center",paddingHorizontal:14}}>
       <Text style={{fontSize:JOBEEN_TYPE.modalAction,fontWeight:"600",color:modal.text}}>Seguir editando</Text>
      </Pressable>
     </View>
    </View>
   </View>
  </Modal>
 </>;
}
