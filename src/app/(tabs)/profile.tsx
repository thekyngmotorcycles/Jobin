import {consumePersonalPhotoChange} from "../../lib/personal-jcard-photo";
import {jobeenModalTokens} from "../../theme/modals";
import {ProfileTypographyScope,useRoyalHiveTypography} from "../../theme/ProfileTypographyScope";
import {JOBEEN_CONTROL} from "../../theme/control-metrics";
import {jobeenTokens} from "../../theme/jobeen";
import {useTheme} from "../../state/ThemeProvider";
import {cvRequests,respondCV,revokeCV,type CVRequest} from "../../lib/cv-access";
import {assertMessageScope,captureMessageScope,type MessageScope} from "../../lib/message-session";
import {identityVerified} from "../../lib/identity-status";
import {pickBusinessGalleryPhoto,uploadBusinessPhoto} from "../../lib/business-media";
import {assertAccountOwner} from "../../lib/account-scope";
import {EMPTY_BUSINESS_CARD,readScopedBusinessCard,writeScopedBusinessCard,clearBusinessCardMemory} from "../../lib/business-card-cache";
import { employmentMonths,experienceLabel } from "../../lib/employment";
import { loadCloudHistory,readCloudBusiness,writeCloudHistory,deleteCloudHistory,writeCloudBusiness,readBusinessRating } from "../../lib/jcard-cloud";
import { useTabClearance } from "../../theme/navigation";
import {opacity} from "../../theme/color";
import {useRef} from "react";
import type {ProfileContactsHandle} from "../../components/ProfileFollowCounts";
import {ProfileIdentityHeader,ProfileSectionTabs,ProfileAboutSelector,ProfileBusinessAbout,ProfilePersonalContact,ProfilePersonalLanguages,type ProfileSection,type ProfileAboutSide} from "../../components/ProfileSharedSections";
import {SavedJCardsGallery} from "../../components/SavedJCardsGallery";
import {ProfessionalHistoryGrid} from "../../components/ProfessionalHistoryGrid";
import {useReducedMotion} from "react-native-reanimated";
import {ProfileOwnedPosts} from "../../components/ProfileOwnedPosts";
import {SettingsDrawerHeader} from "../../components/SettingsDrawerHeader";
import {SettingsMenuRow} from "../../components/SettingsMenuRow";
import {NotificationBell} from "../../components/NotificationBell";
import { ProfessionalTrustMark } from "../../components/ProfessionalTrustMark";
import {JCardLoadState,JCardOfflineNotice,isJCardConnectivityError} from "../../components/JCardConnectionState";
import { loadCatalog,loadWorkspace } from "../../lib/professional-api";
import {loadMyMedia} from "../../lib/safety-api";
import {hasActiveOwnLive} from "../../lib/live-preflight";
import { ProfessionPicker } from "../../components/ProfessionPicker";
import { useProfessionalData } from "../../state/useProfessionalData";
import { useCallback,useEffect,useState } from "react";
import {getEmployerLinks} from "../../lib/employer-links";
import { Animated, Keyboard, Modal, Pressable, ScrollView, Text, TextInput, View, useWindowDimensions, type NativeScrollEvent, type NativeSyntheticEvent } from "react-native";
import { SafeAreaView,useSafeAreaInsets } from "react-native-safe-area-context";
import { NAVIGATION_ROW_HEIGHT } from "../../theme/navigation";
import Svg,{Defs,LinearGradient,Rect,Stop} from "react-native-svg";
import { router,useFocusEffect,useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheet } from "../../components/social-ui";

import {JobeenCreateMenu} from "../../components/JobeenCreateMenu";
import { JobinCard } from "../../components/JobinCard";
import {JobeenShareSheet} from "../../components/JCardShareSheet";

import type { BusinessCardData, JCardSeal } from "../../lib/jcard";
import { Button, Notice, PageState, useUi } from "../../components/ui";
import { canDeleteApprovedEmployment, canSendHistory } from "../../lib/rules";
import { DEMO_PROFILE, DEMO_REQUESTING_COMPANIES, type EmploymentEntry } from "../../lib/me";

type Mode=ProfileSection;

function validPhoneLabel(value:string):boolean{
 const label=value.trim();if(!label)return true;
 if(/^[^\p{Extended_Pictographic}\p{Regional_Indicator}\uFE0F\u200D]{1,4}$/u.test(label))return true;
 return /^(?:[\p{Regional_Indicator}]{2}|[\p{Extended_Pictographic}](?:\uFE0F|[\p{Emoji_Modifier}])?(?:\u200D[\p{Extended_Pictographic}](?:\uFE0F|[\p{Emoji_Modifier}])?)*)$/u.test(label);
}
export default function Profile(){return <ProfileTypographyScope><ProfileScreen/></ProfileTypographyScope>;}
function ProfileScreen(){
 const {type:JOBEEN_TYPE,lineHeight:JOBEEN_LINE_HEIGHT}=useRoyalHiveTypography();
  const { s, colors } = useUi();const insets=useSafeAreaInsets();const fadeHeight=NAVIGATION_ROW_HEIGHT+100;const fadeCenter=(fadeHeight-NAVIGATION_ROW_HEIGHT/2)/fadeHeight;const {theme}=useTheme();const jt=jobeenTokens(theme);const modal=jobeenModalTokens(theme);const {contentBottom}=useTabClearance();const {view,card}=useLocalSearchParams<{view?:string;card?:string}>();
  const [mode,setMode]=useState<Mode>("grid");
  const [aboutSide,setAboutSide]=useState<ProfileAboutSide>(card==="business"?"business":"personal");
  const profileScroll=useRef<ScrollView|null>(null);
  const profileScrollY=useRef(new Animated.Value(0)).current;
  const [tabOffset,setTabOffset]=useState(0);
  const [tabsPinned,setTabsPinned]=useState(false);
  // The JCard moves at half the section sheet's speed, as in a layered creator profile.
  const heroParallax=Animated.multiply(profileScrollY,0.5);
   // Clamp the pull-down overscroll to avoid a visible JCard recoil on release.
   const smoothHeroParallax=heroParallax.interpolate({inputRange:[0,320],outputRange:[0,320],extrapolate:"clamp"});
  const retreatStart=Math.max(1,tabOffset-NAVIGATION_ROW_HEIGHT);
  const retreatEnd=Math.max(retreatStart+1,tabOffset);
  const topHeaderOffset=profileScrollY.interpolate({
    inputRange:[0,retreatStart,retreatEnd],
    outputRange:[0,0,-NAVIGATION_ROW_HEIGHT],
    extrapolate:"clamp"
  });
  const topHeaderOpacity=profileScrollY.interpolate({
    inputRange:[0,retreatStart,retreatEnd],
    outputRange:[1,1,0],
    extrapolate:"clamp"
  });
  const reducedMotion=useReducedMotion();
  const selectSection=(next:Mode)=>{
    setMode(next);
    if(tabOffset>0)profileScroll.current?.scrollTo({y:tabOffset,animated:!reducedMotion});
  };
  const [verifiedIdentity,setVerifiedIdentity]=useState(false);
  const [profileToolsOpen,setProfileToolsOpen]=useState(false);
  const contactsMenuRef=useRef<ProfileContactsHandle>(null);
  const [contactsRequested,setContactsRequested]=useState<string|null>(null);
  const openProfileMenu=()=>setProfileToolsOpen(true);
  const closeProfileMenu=()=>setProfileToolsOpen(false);
  const {width:screenWidth,height:screenHeight}=useWindowDimensions();
  useEffect(()=>{if(view==="cv"||view==="grid"||view==="videos")setMode(view);},[view]);
  const [cvShareOpen,setCvShareOpen]=useState(false);
  const cvScope=useRef<MessageScope|null>(null),cvRevision=useRef(0);
  const [incomingCV,setIncomingCV]=useState<CVRequest[]>([]);
  async function refreshCV(expected?:MessageScope){
   const generation=++cvRevision.current;
   cvScope.current=null;setIncomingCV([]);
   try{
    if(!ownerId||!workspaceSession)return;
    const scope=await captureMessageScope(expected??{owner:ownerId,session:workspaceSession});
    if(scope.owner!==ownerId)throw Error("La sesión cambió.");
    const rows=await cvRequests(scope);
    await assertMessageScope(scope);
    if(cvRevision.current===generation){cvScope.current=scope;setIncomingCV(rows.filter(r=>r.owner_id===scope.owner));}
   }catch(e){if(cvRevision.current===generation)setNotice(e instanceof Error?e.message:"No se pudieron cargar solicitudes.");}
  }
  async function answerCV(id:string,approve:boolean){
   const scope=cvScope.current;
   if(!scope||scope.owner!==ownerId||!incomingCV.some(r=>r.id===id&&r.owner_id===scope.owner&&r.status==="pending"))return;
   try{await respondCV(id,approve,scope);if(cvScope.current===scope)await refreshCV(scope);}catch(e){setNotice(String(e));}
  }
  async function cancelCV(id:string){
   const scope=cvScope.current;
   if(!scope||scope.owner!==ownerId||!incomingCV.some(r=>r.id===id&&r.owner_id===scope.owner&&r.status==="approved"))return;
   try{await revokeCV(id,scope);if(cvScope.current===scope)await refreshCV(scope);}catch(e){setNotice(String(e));}
  }
  function shareCV(){if(ownHistory)setCvShareOpen(true);}
  
  const [employerLink,setEmployerLink]=useState<{owner:string;id:string;name:string;handle:string}|null>(null);
  const [businessRating,setBusinessRating]=useState<{rating:number|null;count:number}>({rating:null,count:0});
  const [businessOpen,setBusinessOpen]=useState(false);
  const [businessCategoryOpen,setBusinessCategoryOpen]=useState(false);
  const [businessCategoryQuery,setBusinessCategoryQuery]=useState("");
  const [business,setBusiness]=useState<BusinessCardData>(EMPTY_BUSINESS_CARD);
  const [businessOwner,setBusinessOwner]=useState("");
  const businessScope=useRef<MessageScope|null>(null),businessRevision=useRef(0);
  const [businessDraft,setBusinessDraft]=useState({name:"",opened:"",closed:"",services:"",category:"",email:"",emailSecondary:"",phone:"",phoneSecondary:"",phoneLabel:"",phoneSecondaryLabel:"",location:""});
  // Business records are loaded only for the authenticated owner below; never import an unscoped legacy card.
  
  function changePersonalPhoto(){router.push("/personal-avatar-editor");}
  const [businessImageBusy,setBusinessImageBusy]=useState(false);
  async function replaceBusinessImage(slot:"banner"|"avatar"){
   const scope=businessScope.current;
   if(!scope||scope.owner!==businessOwner||scope.owner!==workspace.data?.card.id||businessImageBusy)return;
   if(slot==="avatar"){router.push({pathname:"/personal-avatar-editor",params:{target:"business"}});return;}
   setBusinessImageBusy(true);
   try{
    await captureMessageScope(scope);
    const photo=await pickBusinessGalleryPhoto(slot);if(!photo)return;
    await assertMessageScope(scope);
    if(businessScope.current!==scope)return;
    const uploaded=await uploadBusinessPhoto("business-profile-media",scope.owner,photo,slot,scope);
    const current=await readCloudBusiness(scope.owner,scope);
    if(businessScope.current!==scope)return;
    const updated={...EMPTY_BUSINESS_CARD,...(current??{}),[slot==="banner"?"bannerUrl":"avatarUrl"]:uploaded.url};
    await writeCloudBusiness(updated,scope.owner,scope);
    await writeScopedBusinessCard(scope.owner,updated,scope);
    if(businessScope.current===scope)setBusiness(updated);
   }catch(e){if(businessScope.current===scope)setNotice(e instanceof Error?e.message:"No se pudo actualizar la imagen.");}
   finally{setBusinessImageBusy(false);}
  }
  function editBusiness(){clearBusinessCardMemory();router.push("/jcard-business-edit");}
  function saveBusiness(){Keyboard.dismiss();if(businessDraft.name.trim().length>30){setNotice("El nombre de empresa admite un máximo de 30 caracteres.");return;}if(businessDraft.email.trim()&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(businessDraft.email.trim())){setNotice("Revisa el correo empresarial.");return;}if(businessDraft.emailSecondary.trim()&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(businessDraft.emailSecondary.trim())){setNotice("Revisa el correo secundario.");return;}for(const label of [businessDraft.phoneLabel,businessDraft.phoneSecondaryLabel]){if(!validPhoneLabel(label)){setNotice("La identificación permite hasta 4 caracteres de texto o un único emoji.");return;}}if(businessDraft.services.length>100){setNotice("Los servicios admiten un máximo de 100 caracteres.");return;}if(businessDraft.category&&!["Climatización HVAC","Refrigeración"].includes(businessDraft.category)&&!professionCatalog.data?.categories.some(c=>c.code===businessDraft.category||c.label===businessDraft.category)){setNotice("Selecciona una categoría del catálogo de Jobin.");return;}const services=businessDraft.services.split(",").map(x=>x.trim()).filter(Boolean);if(services.length>3){setNotice("Máximo tres servicios.");return;}const opened=businessDraft.opened.trim(),closed=businessDraft.closed.trim(),year=new Date().getFullYear();if((opened&&(!/^\d{4}$/.test(opened)||Number(opened)>year||Number(opened)<1800))||(closed&&(!/^\d{4}$/.test(closed)||Number(closed)>year||Number(closed)<Number(opened)))){setNotice("Revisa los años de apertura y cierre.");return;}const updated={...business,...businessDraft,name:businessDraft.name.trim(),category:professionCatalog.data?.categories.find(c=>c.code===businessDraft.category||c.label===businessDraft.category)?.label??businessDraft.category,email:businessDraft.email.trim(),emailSecondary:businessDraft.emailSecondary.trim(),phone:businessDraft.phone.trim(),phoneSecondary:businessDraft.phoneSecondary.trim(),phoneLabel:businessDraft.phoneLabel.trim(),phoneSecondaryLabel:businessDraft.phoneSecondaryLabel.trim(),location:businessDraft.location.trim(),services,licenseVerified:business.licenseVerified};const scope=businessScope.current;if(!scope||scope.owner!==businessOwner||scope.owner!==workspace.data?.card.id)return;void(async()=>{await captureMessageScope(scope);if(businessScope.current!==scope)return;await writeCloudBusiness(updated,scope.owner,scope);await writeScopedBusinessCard(scope.owner,updated,scope);if(businessScope.current===scope){setBusiness(updated);setBusinessOpen(false);}})().catch(e=>{if(businessScope.current===scope)setNotice(e instanceof Error?e.message:"No se pudo guardar la JCard.");});}
  const [sendOpen, setSendOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editingId,setEditingId] = useState<string|null>(null);
  const [confirmHistoryDelete,setConfirmHistoryDelete]=useState(false);
  const [formError,setFormError] = useState("");
  const historyScope=useRef<MessageScope|null>(null),historyRevision=useRef(0),historyFormScope=useRef<MessageScope|null>(null),historySaving=useRef(false),historyEntryId=useRef<string|null>(null);
  const [historyBusy,setHistoryBusy]=useState(false),[historyRetry,setHistoryRetry]=useState(0);
  const [historyError,setHistoryError]=useState(false);
  function openEmployment(entry?:EmploymentEntry){
    const scope=historyScope.current;
    if(!historyEditable||!scope||scope.owner!==ownerId||historySaving.current|| (entry&&!history.some(row=>row.id===entry.id&&canDeleteApprovedEmployment(row))))return;
    historyFormScope.current=scope;
    historyEntryId.current=entry?.id??(Date.now()+"-"+Math.random().toString(36).slice(2));
    setEditingId(entry?.id??null);setConfirmHistoryDelete(false);
    setDraft(entry?{company:entry.company,role:entry.role,from:String(entry.from),to:entry.to===null?"":String(entry.to),profession:"",fromMonth:String(entry.fromMonth??1),toMonth:String(entry.toMonth??12),address:entry.address??"",contact:entry.contact??""}:{company:"",role:"",from:"",to:"",profession:"",fromMonth:"1",toMonth:"12",address:"",contact:""});
    setFormError("");setShowEmploymentProfessionPicker(false);setAddOpen(true);
  }
  const [draft, setDraft] = useState({ company: "", role: "", from: "", to: "", profession: "", fromMonth: "1", toMonth: "12", address:"", contact:"" });
  const [notice, setNotice] = useState("");
  const workspace = useProfessionalData(loadWorkspace,true);
  const ownerId=workspace.data?.card.id;
  const workspaceSession=workspace.scope?.session;
  useEffect(()=>setAboutSide(card==="business"?"business":"personal"),[card,ownerId,workspaceSession]);
  const media=useProfessionalData(loadMyMedia,false,true,!!ownerId&&!!workspaceSession);
  const currentLive=hasActiveOwnLive({ownerId,workspaceScope:workspace.scope,mediaScope:media.scope,error:!!media.error||media.loading,media:media.data});
  function openOwnEditor(){
    if(!ownerId||workspace.scope?.owner!==ownerId)return;
    closeProfileMenu();
    if(aboutSide==="business")editBusiness();else router.push("/professional");
  }
  useEffect(()=>{if(!profileToolsOpen&&contactsRequested){setContactsRequested(null);if(contactsRequested===ownerId)contactsMenuRef.current?.openContacts(contactsRequested);}},[profileToolsOpen,contactsRequested,ownerId]);
  const [historyState,setHistoryState]=useState<({owner:string;session:string}&Awaited<ReturnType<typeof loadCloudHistory>>)|null>(null);
  const ownHistory=historyState&&historyState.owner===ownerId&&historyState.session===workspaceSession?historyState:null;
  const history=ownHistory?.rows??[];
  const experienceKnown=ownHistory&&!ownHistory.reviewPending;
  const needsHistoryDetails=mode==="cv"&&aboutSide==="personal";
  const [historyLoading,setHistoryLoading]=useState(false);
  const historyEditable=needsHistoryDetails&&!historyLoading&&ownHistory?.contactsAvailable===true;
  const retryHistory=()=>setHistoryRetry(v=>v+1);
  useFocusEffect(useCallback(()=>{
   let active=true;const generation=++historyRevision.current;
   const valid=()=>active&&historyRevision.current===generation;
   historyScope.current=null;historyFormScope.current=null;
   setHistoryState(previous=>needsHistoryDetails&&previous&&previous.owner===ownerId&&previous.session===workspaceSession&&!previous.contactsAvailable?previous:null);
   setHistoryError(false);setAddOpen(false);setEditingId(null);
   setHistoryLoading(!!ownerId&&!!workspaceSession);
   if(!ownerId||!workspaceSession)return()=>{active=false;};
   const owner=ownerId;
   const timeout=setTimeout(()=>{if(valid()){active=false;setHistoryError(true);setHistoryLoading(false);}},20_000);
   void(async()=>{
    try{
     const scope=await captureMessageScope({owner,session:workspaceSession});
     if(!valid())return;
     const result=await loadCloudHistory(owner,scope,needsHistoryDetails);
     if(!valid())return;
     historyScope.current=scope;setHistoryState({...scope,...result});
    }catch{if(valid())setHistoryError(true);}
    finally{clearTimeout(timeout);if(valid())setHistoryLoading(false);}
   })();
   return()=>{active=false;clearTimeout(timeout);historyRevision.current++;historyScope.current=null;historyFormScope.current=null;};
  },[ownerId,workspaceSession,historyRetry,needsHistoryDetails]));
  useEffect(()=>{setHistoryState(null);setAddOpen(false);setEditingId(null);setCvShareOpen(false);setBusinessOpen(false);setBusinessRating({rating:null,count:0});setEmployerLink(null);setVerifiedIdentity(false);setIncomingCV([]);},[ownerId]);

 useFocusEffect(useCallback(()=>{
  const owner=workspace.data?.card.id,generation=++businessRevision.current;
  let active=true;
  const valid=()=>active&&businessRevision.current===generation;
  businessScope.current=null;setBusinessOwner("");setBusiness(EMPTY_BUSINESS_CARD);
  if(!owner||!workspaceSession)return()=>{active=false;};
  void(async()=>{
   let scope:MessageScope|null=null;
   try{
    scope={owner,session:await assertAccountOwner(owner,workspaceSession)};
    if(!valid())return;
    if(consumePersonalPhotoChange(scope))void workspace.reload();
    const cached=await readScopedBusinessCard(owner,scope);
    if(!valid())return;
    if(cached){setBusiness(cached);setBusinessOwner(owner);}
    const row=await readCloudBusiness(owner,scope);
    await assertMessageScope(scope);
    if(!valid())return;
    const current={...EMPTY_BUSINESS_CARD,...(row??{})};
    clearBusinessCardMemory();
    if(row)await writeScopedBusinessCard(owner,current,scope);
    if(!valid())return;
    businessScope.current=scope;setBusiness(current);setBusinessOwner(owner);
   }catch{
    if(!valid())return;
    const cached=scope?await readScopedBusinessCard(owner,scope).catch(()=>null):null;
    if(valid()){
     businessScope.current=null;setBusiness(cached??EMPTY_BUSINESS_CARD);setBusinessOwner(cached?owner:"");
     setNotice("No se pudo sincronizar la JCard de negocio. Verifica tu conexión.");
    }
   }
  })();
  return()=>{active=false;businessScope.current=null;};
 },[workspace.reload,workspace.data?.card.id,workspaceSession]));
  useEffect(()=>{const id=workspace.data?.card.id;if(!id)return;let live=true;void identityVerified(id).then(v=>{if(live)setVerifiedIdentity(v);}).catch(()=>{if(live)setVerifiedIdentity(false);});return()=>{live=false;};},[workspace.data?.card.id]);
  const professionCatalog=useProfessionalData(loadCatalog,false,false,!!ownerId&&(!!ownHistory||needsHistoryDetails||businessOpen));
  const [showEmploymentProfessionPicker,setShowEmploymentProfessionPicker]=useState(false);
  const catalogProfessions=professionCatalog.data?.professions??[];
  const findCatalogProfession=(value:string)=>catalogProfessions.find(p=>p.code===value||p.label.toLocaleLowerCase("es")===value.trim().toLocaleLowerCase("es"));
  const selectedEmploymentProfession=findCatalogProfession(draft.profession||draft.role);
  useFocusEffect(useCallback(()=>{
   let live=true;setEmployerLink(null);
   const owner=ownerId;if(!owner||!workspaceSession)return()=>{live=false;};
   void(async()=>{try{
    const scope=await captureMessageScope({owner,session:workspaceSession});
    if(scope.owner!==owner)throw Error("La cuenta cambió.");
    const rows=await getEmployerLinks(scope);
    await assertMessageScope(scope);
    const verified=rows.find(row=>row.worker_id===owner&&row.status==="approved");
    if(live)setEmployerLink(verified?{owner,id:verified.company_id,name:verified.name,handle:verified.handle}:null);
   }catch{if(live)setEmployerLink(null);}})();
   return()=>{live=false;setEmployerLink(null);};
  },[ownerId,workspaceSession]));
  useEffect(()=>{if(!ownerId)return;let live=true;void readBusinessRating(ownerId).then(value=>{if(live)setBusinessRating(value);}).catch(()=>{});return()=>{live=false;};},[ownerId]);
  useFocusEffect(useCallback(()=>{if(ownerId&&workspaceSession&&needsHistoryDetails)void refreshCV();return()=>{cvRevision.current++;cvScope.current=null;setIncomingCV([]);};},[ownerId,workspaceSession,needsHistoryDetails]));
  const p = DEMO_PROFILE;

  function send(company: string) {
    if (!canSendHistory("company", p.isOwner, DEMO_REQUESTING_COMPANIES.includes(company))) {
      setNotice("Solo puedes enviar tu historial a empresas que lo hayan solicitado para contratarte.");
      return;
    }
    setSendOpen(false);
    setNotice("Historial enviado a " + company + " por mensajería interna.");
  }

  async function add() {
    const id=historyEntryId.current;
    if(!id||(editingId&&editingId!==id))return;
    const existing=editingId?history.find(row=>row.id===editingId&&canDeleteApprovedEmployment(row)):undefined;
    if(editingId&&!existing)return;
    const from = Number(draft.from), to = draft.to ? Number(draft.to) : null;
    const currentYear=new Date().getFullYear();
    const fromMonth=Number(draft.fromMonth),toMonth=Number(draft.toMonth);
    if(!Number.isInteger(fromMonth)||fromMonth<1||fromMonth>12||!Number.isInteger(toMonth)||toMonth<1||toMonth>12){setFormError("Los meses deben estar entre 1 y 12.");return;}
    if (to!==null && to===from && toMonth<fromMonth){setFormError("El mes de término debe ser posterior al de inicio.");return;}
    const preserveProfession=existing&&!draft.profession;
    if(!preserveProfession&&!selectedEmploymentProfession){setFormError("Selecciona un cargo del catálogo de profesiones.");return;}
    if (!draft.company.trim() || !draft.role.trim() || !draft.from.trim() || !Number.isInteger(from) || from < 1950 || from > currentYear || (to!==null&&(!Number.isInteger(to)||to<from||to>currentYear))) {
      setFormError("Completa empresa, cargo y años válidos (el final no puede ser anterior al inicio).");
      return;
    }
    if(draft.address.trim().length>500||draft.contact.trim().length>500){setFormError("Dirección y contacto admiten hasta 500 caracteres cada uno.");return;}
    const updated:EmploymentEntry={
     id,company:draft.company.trim(),role:preserveProfession?existing.role:selectedEmploymentProfession!.label,
     professions:preserveProfession?existing.professions:[selectedEmploymentProfession!.code],
     fromMonth,toMonth,from,to,address:draft.address.trim(),contact:draft.contact.trim(),status:"pending",verifiedBy:null
    };
    await changeHistory((owner,scope)=>writeCloudHistory(updated,owner,scope),"Experiencia guardada.","No se pudo guardar la experiencia. Vuelve a intentarlo.");
  }

  async function removeEmployment(){
    const id=editingId;
    if(!confirmHistoryDelete||!id||id!==historyEntryId.current||!history.some(row=>row.id===id&&canDeleteApprovedEmployment(row)))return;
    await changeHistory((owner,scope)=>deleteCloudHistory(id,owner,scope),"Experiencia eliminada.","No se pudo confirmar la eliminación. Actualiza el historial.");
  }

  async function changeHistory(change:(owner:string,scope:MessageScope)=>Promise<void>,success:string,failure:string){
    const scope=historyFormScope.current,owner=scope?.owner;
    if(!scope||!owner||owner!==ownerId||historyScope.current!==scope||!historyEditable||historySaving.current)return;
    Keyboard.dismiss();
    historySaving.current=true;setHistoryBusy(true);setFormError("");
    const valid=()=>historyScope.current===scope&&historyFormScope.current===scope;
    try{
     await captureMessageScope(scope);
     if(!valid())return;
     await change(owner,scope);
     if(!valid())return;
     const result=await loadCloudHistory(owner,scope);
     if(!valid())return;
     setHistoryState({...scope,...result});
     historyFormScope.current=null;historyEntryId.current=null;
     setAddOpen(false);setEditingId(null);setShowEmploymentProfessionPicker(false);
     setNotice(success);
    }catch{if(valid())setFormError(failure);}
    finally{historySaving.current=false;setHistoryBusy(false);}
  }

  // The JCard owns the seals. Work history contributes elapsed time only.
  // Match canonical catalog codes and legacy labels without merging distinct trades.
  const normalizeProfession=(value:string)=>value.toLocaleLowerCase("es").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]/g,"");
  const professionKey=(value:string)=>{
    const normalized=normalizeProfession(value);
    const declared=workspace.data?.professions.find(p=>p.profession_code===value||normalizeProfession(p.label)===normalized);
    return declared?.profession_code??catalogProfessions.find(p=>p.code===value||normalizeProfession(p.label)===normalized)?.code??normalized;
  };
  const seals: JCardSeal[] = workspace.data?.card.seals.map(seal=>{
    const key=professionKey(seal.profession);
    const matchingHistory=history.filter(entry=>(entry.professions?.length?entry.professions:[entry.role]).some(value=>professionKey(value)===key));
    const months=experienceKnown?employmentMonths(matchingHistory):undefined;
    return {...seal,months};
  })??[];
  const uniqueSeals=seals.filter((seal,index)=>seals.findIndex(other=>professionKey(other.profession)===professionKey(seal.profession))===index);
  const primaryProfessionKey=workspace.data?.professions.find(p=>p.primary_profession)?.profession_code??professionKey(workspace.data?.card.role??"");
  const primaryEntries=history.filter(entry=>(entry.professions?.length?entry.professions:[entry.role]).some(value=>professionKey(value)===primaryProfessionKey));
  const primaryExperienceMonths=experienceKnown?employmentMonths(primaryEntries):undefined;
  const secondaryProfessions=(workspace.data?.professions??[]).filter(profession=>!profession.primary_profession).map(profession=>{
    const catalog=catalogProfessions.find(item=>item.code===profession.profession_code);
    const matchingHistory=history.filter(entry=>(entry.professions?.length?entry.professions:[entry.role]).some(value=>professionKey(value)===profession.profession_code));
    const matchedSeal=uniqueSeals.find(seal=>professionKey(seal.profession)===profession.profession_code);
    return {code:profession.profession_code,name:profession.label,icon:(matchedSeal?.icon??catalog?.icon??"briefcase-outline") as JCardSeal["icon"],months:experienceKnown?employmentMonths(matchingHistory):undefined,verified:matchedSeal?.verified??false};
  });

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={[s.screen,{backgroundColor:jt.bg}]}>
      <Animated.View pointerEvents={tabsPinned?"none":"box-none"} style={{ position:"absolute",top:insets.top,left:0,right:0,zIndex:10,height:NAVIGATION_ROW_HEIGHT,flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 8,transform:[{translateY:topHeaderOffset}],opacity:topHeaderOpacity }}>
        <View pointerEvents="none" style={{position:"absolute",top:0,left:0,right:0,height:fadeHeight}}>
          <Svg width="100%" height="100%" accessible={false}>
            <Defs><LinearGradient id="profileTopFade" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0" stopColor={theme==="light"?jt.bg:colors.paper} stopOpacity={0.92}/>
              <Stop offset={1-fadeCenter} stopColor={theme==="light"?jt.bg:colors.paper} stopOpacity={0.72}/>
              <Stop offset={1-fadeCenter*.4} stopColor={theme==="light"?jt.bg:colors.paper} stopOpacity={.09}/>
              <Stop offset="1" stopColor={theme==="light"?jt.bg:colors.paper} stopOpacity={0}/>
            </LinearGradient>
            <LinearGradient id="profileTopShade" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0" stopColor={jt.ink} stopOpacity={theme==="light"?.11:.08}/>
              <Stop offset=".55" stopColor={jt.ink} stopOpacity={0}/>
            </LinearGradient></Defs>
            <Rect width="100%" height="100%" fill="url(#profileTopFade)"/>
            <Rect width="100%" height="100%" fill="url(#profileTopShade)"/>
          </Svg>
        </View>
        <View pointerEvents="none" style={{flex:1}}/>
        <View pointerEvents="box-none" style={{flexDirection:"row",alignItems:"center",gap:2}}>
          <JobeenCreateMenu/>
          <NotificationBell/>
          <Pressable accessibilityRole="button" accessibilityLabel="Opciones del perfil" accessibilityState={{expanded:profileToolsOpen}} onPress={()=>profileToolsOpen?closeProfileMenu():openProfileMenu()} style={{width:JOBEEN_CONTROL.touchTarget,height:JOBEEN_CONTROL.touchTarget,alignItems:"center",justifyContent:"center",borderRadius:24}}><Ionicons name="ellipsis-horizontal" size={23} color={colors.ink}/></Pressable>
        </View>
      </Animated.View>
      <Modal visible={profileToolsOpen} transparent animationType="none" onRequestClose={closeProfileMenu} statusBarTranslucent={false}>
        <View style={{flex:1,flexDirection:"row"}}>
          <View pointerEvents="none" style={{position:"absolute",top:0,bottom:0,left:0,right:0,backgroundColor:modal.scrim}}/>
          <Pressable accessibilityRole="button" accessibilityLabel="Cerrar menú de perfil" onPress={closeProfileMenu} style={{flex:1}}/>
          <View style={{width:Math.min(screenWidth*0.88,410)}}><SafeAreaView edges={["top","bottom"]}
           style={{flex:1,backgroundColor:modal.surface,borderTopLeftRadius:modal.radius.dialog,borderBottomLeftRadius:modal.radius.dialog,overflow:"hidden"}}>
            <ScrollView contentContainerStyle={{paddingHorizontal:JOBEEN_CONTROL.modalHorizontalPadding,paddingTop:16,paddingBottom:30,gap:2}}>
              <SettingsDrawerHeader title="Mi perfil" onClose={closeProfileMenu}/>
              {!!ownerId&&workspace.scope?.owner===ownerId&&<><Text accessibilityRole="header" style={{fontSize:JOBEEN_TYPE.sectionTitle,lineHeight:JOBEEN_LINE_HEIGHT.sectionTitle,color:modal.muted,fontWeight:"600",marginTop:8}}>JCard</Text>
              <SettingsMenuRow title="Editar JCard" icon="create-outline" onPress={openOwnEditor}/></>}
              <Text accessibilityRole="header" style={{fontSize:JOBEEN_TYPE.sectionTitle,lineHeight:JOBEEN_LINE_HEIGHT.sectionTitle,color:modal.muted,fontWeight:"600",marginTop:8}}>Mi actividad</Text>
              {!!ownerId&&<SettingsMenuRow title="Mis contactos" icon="people-outline" variant="action" onPress={()=>{setContactsRequested(ownerId);closeProfileMenu();}}/>}
              <Text accessibilityRole="header" style={{fontSize:JOBEEN_TYPE.sectionTitle,lineHeight:JOBEEN_LINE_HEIGHT.sectionTitle,color:modal.muted,fontWeight:"600",marginTop:12}}>Desarrollo profesional</Text>
              <SettingsMenuRow title="Certificados y sellos" icon="ribbon-outline" onPress={()=>{closeProfileMenu();router.push("/certificates");}}/>
              <SettingsMenuRow title="Oportunidades laborales" icon="briefcase-outline" onPress={()=>{closeProfileMenu();router.push("/opportunities");}}/>
              <SettingsMenuRow title="Reseñas de empresas" icon="star-outline" onPress={()=>{closeProfileMenu();router.push("/reviews");}}/>
              <SettingsMenuRow title="Mi zona profesional" icon="location-outline" onPress={()=>{closeProfileMenu();router.push("/map-presence");}}/>
              {(!!workspace.data?.organization||!!workspace.data?.reviewer)&&<Text accessibilityRole="header" style={{fontSize:JOBEEN_TYPE.sectionTitle,lineHeight:JOBEEN_LINE_HEIGHT.sectionTitle,color:modal.muted,fontWeight:"600",marginTop:12}}>Gestión profesional</Text>}
              {!!workspace.data?.organization&&<SettingsMenuRow title="Mi empresa o institución" icon="business-outline" onPress={()=>{closeProfileMenu();router.push("/company");}}/>}
              {!!workspace.data?.reviewer&&<SettingsMenuRow title="Revisar acreditaciones" icon="shield-checkmark-outline" onPress={()=>{closeProfileMenu();router.push("/credential-review");}}/>}
              {__DEV__&&<SettingsMenuRow title="Ver perfil ficticio (demo)" icon="eye-outline" onPress={()=>{closeProfileMenu();router.push("/demo-profile");}}/>}
            </ScrollView>
          </SafeAreaView></View>
        </View>
      </Modal>

      <Animated.ScrollView ref={profileScroll} stickyHeaderIndices={[1]} scrollEventThrottle={16}
        style={{flex:1}}
        contentInsetAdjustmentBehavior="never"
        onScroll={Animated.event([{nativeEvent:{contentOffset:{y:profileScrollY}}}],{
          useNativeDriver:true,
          listener:(event:NativeSyntheticEvent<NativeScrollEvent>)=>{
            const pinned=tabOffset>0&&event.nativeEvent.contentOffset.y>=tabOffset-2;
            setTabsPinned(previous=>previous===pinned?previous:pinned);
          }
        })}
        showsVerticalScrollIndicator={false}>
        <Animated.View style={{paddingBottom:12,zIndex:0,transform:[{translateY:smoothHeroParallax}]}}>
        <ProfileIdentityHeader
          card={workspace.data?.card ? <><JobinCard card={{...workspace.data.card,identityVerified:verifiedIdentity,seals:uniqueSeals,rating:null,reviewCount:0,business:{...(businessOwner===workspace.data.card.id?business:EMPTY_BUSINESS_CARD),rating:businessRating.rating,reviewCount:businessRating.count},years:primaryExperienceMonths===undefined?workspace.data.card.years:Math.floor(primaryExperienceMonths/12),primaryExperienceMonths,secondaryProfessions}} onEditBusiness={editBusiness} onEditBusinessMedia={replaceBusinessImage} onEditPersonalPhoto={changePersonalPhoto} initialSide={card==="business"?"business":"personal"} selectedSide={aboutSide} onActiveSideChange={setAboutSide} awardsInAbout profileInset={16} profileCoverScope={workspace.scope} ownerQuickActions={{onPanel:()=>router.push("/panel"),onLive:()=>currentLive?router.push({pathname:"/live",params:{view:"studio"}}):router.push("/live"),liveLabel:currentLive?"Volver al Live":"En vivo"}} showOwnerActions ownerId={workspace.data.card.id} employerLink={employerLink?.owner===ownerId?employerLink:null}/>
            {!!workspace.error&&isJCardConnectivityError(workspace.error)&&<View style={{marginTop:12,paddingHorizontal:16}}>
              <JCardOfflineNotice retry={workspace.reload} cached/>
            </View>}
           </> : <JCardLoadState loading={workspace.loading} error={workspace.error||"No se pudo recuperar la JCard. Vuelve a intentarlo."} retry={workspace.reload} profileInset={16}/>}
          actions={(notice||historyError&&ownerId)?<View style={{paddingHorizontal:16,gap:12}}>
           {!!notice&&<Notice text={notice} onClose={()=>setNotice("")}/>}
           {historyError&&ownerId&&<PageState kind="error" message="No se pudo recuperar el historial privado. Vuelve a intentarlo." actionLabel="Reintentar" onAction={retryHistory}/>}
          </View>:null}
          trust={workspace.data?.card?<ProfessionalTrustMark worker={workspace.data.card.id} inset={16}/>:null}
          profileUserId={workspace.data?.card?.id} contactsMenuRef={contactsMenuRef} countsInCard expectedScope={workspace.scope}
        />
        </Animated.View>
        <View onLayout={event=>setTabOffset(event.nativeEvent.layout.y)}
          style={{zIndex:3,backgroundColor:jt.bg,borderTopLeftRadius:18,borderTopRightRadius:18}}>
          <ProfileSectionTabs section={mode} onSelect={selectSection} pinned={tabsPinned} showPrivateJCards/>
        </View>
        <View style={{gap:16,paddingHorizontal:16,paddingTop:20,paddingBottom:contentBottom,minHeight:screenHeight,backgroundColor:jt.bg,zIndex:2}}>
        {mode==="jcards"&&ownerId&&<SavedJCardsGallery key={ownerId} owner={ownerId}/>}
        {mode==="live"&&<View style={{gap:12,padding:14,borderWidth:1,borderColor:colors.line,borderRadius:14}}>
          <Text style={s.h3}>Transmisiones en vivo</Text>
          <Text style={s.muted}>Cuando este perfil transmita, aparecerá aquí la vista previa para entrar al directo.</Text>
          <View style={{height:145,backgroundColor:colors.accent,borderRadius:12,justifyContent:"center",alignItems:"center",gap:8}}>
            <Ionicons name="radio-outline" size={35} color={colors.muted}/>
            <Text style={s.muted}>Sin transmisión activa verificada</Text>
          </View>
        </View>}
        {mode === "cv" && <ProfileAboutSelector side={aboutSide} onSelect={setAboutSide}/>}
        {mode==="cv"&&aboutSide==="business"&&ownerId&&<ProfileBusinessAbout business={businessOwner===ownerId&&businessScope.current?.owner===ownerId&&businessScope.current?.session===workspaceSession?business:undefined} target={ownerId} scope={businessScope.current?.owner===ownerId&&businessScope.current?.session===workspaceSession?businessScope.current:null} onEdit={editBusiness}/>}
        {mode === "cv" && aboutSide==="personal" && (
          <View style={{ gap: 14 }}>
            {ownerId&&workspace.scope?.owner===ownerId&&<ProfilePersonalContact target={ownerId} scope={workspace.scope}/>}
            {workspace.data?.card&&<ProfilePersonalLanguages languages={workspace.data.card.languages} key={ownerId+":"+workspaceSession} own/>}
            <Text accessibilityRole="header" style={s.h3}>Historial profesional</Text>
            {experienceKnown&&<Text style={s.muted}>Experiencia total registrada: {experienceLabel(employmentMonths(history))}.</Text>}
            {ownerId&&historyLoading&&!historyError&&<PageState kind="loading" message="Cargando historial profesional…"/>}
            {ownHistory&&!historyLoading&&!historyEditable&&<PageState kind="error" message="Los contactos privados y la edición del historial no están disponibles." actionLabel="Reintentar" onAction={retryHistory}/>}
            {ownHistory?.reviewPending&&<PageState kind="info" message="Parte de tu historial está en revisión de titularidad."/>}
            {experienceKnown&&history.length===0&&<Text style={s.muted}>Todavía no agregaste empleos.</Text>}
            <ProfessionalHistoryGrid key={ownerId+":"+workspaceSession} catalog={catalogProfessions}
             rows={history.map(entry=>({id:entry.id,company:entry.company,role:entry.role,from:entry.from,to:entry.to,professions:entry.professions,verifiedBy:entry.verifiedBy,onEdit:historyEditable&&canDeleteApprovedEmployment(entry)?()=>openEmployment(entry):undefined}))}
             onAdd={historyEditable?()=>openEmployment():undefined}/>
            <View style={{gap:8}}><Button secondary title="Actualizar solicitudes de CV" onPress={()=>void refreshCV()}/>{incomingCV.filter(req=>req.owner_id===ownerId).map(req=><View key={req.id} style={{gap:6,padding:10,borderWidth:1,borderColor:colors.line,borderRadius:10}}><Text style={s.text}>Solicitud {req.requester_id.slice(0,8)} · {req.status}</Text>{req.status==="pending"&&<View style={s.row}><Button title="Autorizar" onPress={()=>void answerCV(req.id,true)}/><Button secondary title="Rechazar" onPress={()=>void answerCV(req.id,false)}/></View>}{req.status==="approved"&&<Button secondary title="Revocar acceso" onPress={()=>void cancelCV(req.id)}/>}</View>)}</View>
            <View style={s.row}>
              <Button secondary title="Compartir CV" disabled={!ownHistory} onPress={() => void shareCV()} />
            </View>
          </View>
        )}

        {mode==="grid"&&ownerId&&<ProfileOwnedPosts filter="all"/>}
        {mode==="videos"&&ownerId&&<ProfileOwnedPosts filter="videos"/>}
        {mode==="live"&&ownerId&&<ProfileOwnedPosts filter="live"/>}
        </View>
      </Animated.ScrollView>

      <BottomSheet visible={businessOpen} onClose={()=>setBusinessOpen(false)} title="Editar JCard de negocio">
       <View style={{gap:12,paddingVertical:12}}>
        <Text style={s.muted}>Si no tienes empresa, deja el nombre vacío y usa esta cara para presentarte profesionalmente.</Text>
        {(["name","category","opened","closed","email","emailSecondary","phone","phoneLabel","phoneSecondary","phoneSecondaryLabel","location","services"] as const).map(key=><View key={key} style={{gap:4}}>
         <Text style={s.muted}>{{name:"Nombre de empresa (opcional)",category:"Categoría profesional (opcional)",opened:"Año de apertura (opcional)",closed:"Año de cierre (opcional)",email:"Correo electrónico empresarial (opcional)",emailSecondary:"Correo electrónico secundario (opcional)",phone:"Teléfono empresarial (opcional)",phoneLabel:"Identificador teléfono 1 (opcional)",phoneSecondary:"Teléfono secundario (opcional)",phoneSecondaryLabel:"Identificador teléfono 2 (opcional)",location:"Dirección empresarial (opcional)",services:"Servicios (máximo 3, separados por comas) (opcional)"}[key]}</Text>
         {key==="category"?<View style={{gap:6}}><Pressable accessibilityRole="button" accessibilityLabel="Elegir categoría empresarial" accessibilityState={{expanded:businessCategoryOpen}} onPress={()=>{Keyboard.dismiss();setBusinessCategoryOpen(v=>!v);}} style={{borderColor:colors.line,borderWidth:1,padding:12,borderRadius:10,flexDirection:"row",alignItems:"center",justifyContent:"space-between",minHeight:48}}><Text style={{color:businessDraft.category?colors.ink:colors.muted,flex:1}}>{professionCatalog.data?.categories.find(c=>c.code===businessDraft.category||c.label===businessDraft.category)?.label??(businessDraft.category||"Seleccionar categoría")}</Text><Ionicons name={businessCategoryOpen?"chevron-up":"chevron-down"} size={20} color={colors.muted}/></Pressable>{businessCategoryOpen&&<View style={{gap:6}}><TextInput accessibilityLabel="Buscar categoría empresarial" placeholder="Buscar sector o categoría…" placeholderTextColor={colors.muted} value={businessCategoryQuery} onChangeText={setBusinessCategoryQuery} style={{fontSize:JOBEEN_TYPE.input,lineHeight:JOBEEN_LINE_HEIGHT.input,color:colors.ink,borderColor:colors.line,borderWidth:1,borderRadius:8,padding:10}}/><ScrollView nestedScrollEnabled style={{maxHeight:230,borderWidth:1,borderColor:colors.line,borderRadius:10}} keyboardShouldPersistTaps="handled">{!professionCatalog.data?<Text style={[s.muted,{padding:12}]}>Cargando categorías...</Text>:<><Pressable onPress={()=>{setBusinessDraft(d=>({...d,category:""}));setBusinessCategoryOpen(false);}} style={{padding:12}}><Text style={{color:colors.muted}}>Ninguna (opcional)</Text></Pressable>{["Climatización HVAC","Refrigeración"].filter(label=>!professionCatalog.data?.categories.some(c=>c.label===label)).map(label=><Pressable key={label} accessibilityRole="button" onPress={()=>{setBusinessDraft(d=>({...d,category:label}));setBusinessCategoryOpen(false);}} style={{padding:12,borderTopWidth:1,borderTopColor:colors.line,flexDirection:"row",alignItems:"center",gap:8}}><Ionicons name="grid-outline" size={17} color={colors.muted}/><Text style={{color:colors.ink}}>{label}</Text></Pressable>)} {professionCatalog.data.categories.filter(c=>c.label.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().includes(businessCategoryQuery.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim())).map(c=><Pressable key={c.code} accessibilityRole="button" accessibilityState={{selected:businessDraft.category===c.code||businessDraft.category===c.label}} onPress={()=>{setBusinessDraft(d=>({...d,category:c.code}));setBusinessCategoryOpen(false);}} style={{padding:12,borderTopWidth:1,borderTopColor:colors.line,flexDirection:"row",alignItems:"center",gap:8}}><Ionicons name="grid-outline" size={17} color={colors.muted}/><Text style={{color:colors.ink}}>{c.label}</Text></Pressable>)}</>}</ScrollView></View>}</View>:<TextInput accessibilityLabel={key} value={businessDraft[key]} maxLength={key==="name"?30:key==="services"?100:(key==="phoneLabel"||key==="phoneSecondaryLabel")?16:undefined} keyboardType={(key==="email"||key==="emailSecondary")?"email-address":(key==="phone"||key==="phoneSecondary")?"phone-pad":key==="opened"||key==="closed"?"number-pad":"default"} autoCapitalize={key==="email"||key==="emailSecondary"?"none":"sentences"} onChangeText={v=>setBusinessDraft(d=>({...d,[key]:v}))} placeholderTextColor={colors.muted} style={{fontSize:JOBEEN_TYPE.input,lineHeight:JOBEEN_LINE_HEIGHT.input,color:colors.ink,borderColor:colors.line,borderWidth:1,padding:12,borderRadius:10}}/>}{key==="services"&&<Text style={[s.muted,{textAlign:"right"}]}>{businessDraft.services.length}/100</Text>}
        </View>)}
        <Text style={s.muted}>Los años deben tener cuatro dígitos, por ejemplo 2020. El año de cierre puede quedar vacío si el negocio sigue activo.</Text><Text style={s.muted}>El check de licencia comercial solo se activa después de verificar la documentación, no al editar estos datos.</Text>
        <Button secondary title="Editar apariencia" onPress={()=>{setBusinessOpen(false);router.push("/jcard-business-backgrounds");}}/>
        <Button title="Guardar" onPress={saveBusiness}/>
       </View>
      </BottomSheet>
      <BottomSheet visible={sendOpen} onClose={() => setSendOpen(false)} title="Enviar historial">
        <View style={{ gap: 14, paddingVertical: 16 }}>
          {DEMO_REQUESTING_COMPANIES.length === 0 ? (
            <Text style={s.muted}>Ninguna empresa ha solicitado tu historial todavía.</Text>
          ) : DEMO_REQUESTING_COMPANIES.map(company => <Button key={company} title={"Enviar a " + company} onPress={() => send(company)} />)}
        </View>
      </BottomSheet>

      <BottomSheet visible={addOpen&&historyEditable} onClose={() => {if(!historySaving.current){historyFormScope.current=null;setAddOpen(false);}}} title={confirmHistoryDelete?"Eliminar experiencia":editingId?"Editar experiencia":"Agregar experiencia"}>
        {confirmHistoryDelete?<View style={{gap:12,paddingVertical:16}}>
          <Text style={s.text}>Se eliminarán esta experiencia y sus datos de contacto. Esta acción no se puede deshacer.</Text>
          {!!formError&&<Text accessibilityRole="alert" style={{color:colors.reaction}}>{formError}</Text>}
          <Button title="Eliminar" variant="danger" busy={historyBusy} onPress={()=>void removeEmployment()}/>
          <Button title="Cancelar" secondary disabled={historyBusy} onPress={()=>{setConfirmHistoryDelete(false);setFormError("");}}/>
        </View>:<View style={{ gap: 12, paddingVertical: 16 }}>
          <View style={{gap:6}}><Text style={s.muted}>Empresa</Text>
           <TextInput accessibilityLabel="Empresa" placeholder="Empresa" placeholderTextColor={colors.muted} value={draft.company} onChangeText={v=>setDraft(d=>({...d,company:v}))} style={{fontSize:JOBEEN_TYPE.input,lineHeight:JOBEEN_LINE_HEIGHT.input,color:colors.ink,borderColor:colors.line,borderWidth:1,padding:14,borderRadius:10}}/>
          </View>
          <View style={{gap:8}}>
           <Text style={s.muted}>Cargo / profesión ejercida</Text>
           <Pressable accessibilityRole="button" accessibilityLabel="Elegir cargo del catálogo" onPress={()=>setShowEmploymentProfessionPicker(v=>!v)} style={{borderColor:colors.line,borderWidth:1,padding:14,borderRadius:10,flexDirection:"row",alignItems:"center",justifyContent:"space-between",gap:8}}>
            <Text style={{color:selectedEmploymentProfession?colors.ink:colors.muted,flex:1}}>{selectedEmploymentProfession?.label||(editingId?draft.role:"Selecciona una profesión")}</Text>
            <Ionicons name={showEmploymentProfessionPicker?"chevron-up":"chevron-down"} size={20} color={colors.ink}/>
           </Pressable>
           {showEmploymentProfessionPicker&&<ProfessionPicker catalog={professionCatalog.data??null} value={selectedEmploymentProfession?.code??""} onChange={code=>{const match=catalogProfessions.find(p=>p.code===code);if(match){setDraft(d=>({...d,role:match.label,profession:match.code}));setShowEmploymentProfessionPicker(false);setFormError("");}}}/>}
           {!selectedEmploymentProfession&&!!draft.role&&<Text style={s.muted}>Puedes conservar el cargo anterior o seleccionar uno del catálogo.</Text>}
          </View>
          {(["from","to"] as const).map(key=><View key={key} style={{gap:6}}>
           <Text style={s.muted}>{key==="from"?"Año de inicio":"Año de término (opcional)"}</Text>
           <TextInput accessibilityLabel={key==="from"?"Año de inicio":"Año de término"} placeholder="AAAA" placeholderTextColor={colors.muted} value={draft[key]} onChangeText={v=>setDraft(d=>({...d,[key]:v}))} keyboardType="number-pad" style={{fontSize:JOBEEN_TYPE.input,lineHeight:JOBEEN_LINE_HEIGHT.input,color:colors.ink,borderColor:colors.line,borderWidth:1,padding:14,borderRadius:10}}/>
          </View>)}
          {!!formError&&<Text accessibilityRole="alert" style={{color:colors.reaction}}>{formError}</Text>}
          <Text style={s.h3}>Meses de trabajo</Text>
          <Text style={s.muted}>Selecciona el mes de inicio y de finalización.</Text>
          {(["fromMonth","toMonth"] as const).map(key=><View key={key} style={{gap:6}}>
           <Text style={s.muted}>{key==="fromMonth"?"Mes de inicio":"Mes de término"}</Text>
           <View style={{flexDirection:"row",flexWrap:"wrap",gap:6}}>{["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"].map((month,index)=><Pressable key={month} accessibilityRole="button" accessibilityState={{selected:Number(draft[key])===index+1}} onPress={()=>setDraft(d=>({...d,[key]:String(index+1)}))} style={{minWidth:"22%",minHeight:42,borderWidth:1,borderColor:colors.line,borderRadius:10,alignItems:"center",justifyContent:"center",backgroundColor:Number(draft[key])===index+1?colors.ink:colors.card}}><Text style={{color:Number(draft[key])===index+1?colors.inverse:colors.ink,fontWeight:Number(draft[key])===index+1?"800":"400"}}>{Number(draft[key])===index+1?"✓ "+month:month}</Text></Pressable>)}</View>
          </View>)}
          <Text style={s.h3}>Contacto de la empresa (opcional)</Text>
          <Text style={s.muted}>Estos datos ayudan a identificar a tu empleador. No implican que la experiencia esté verificada.</Text>
          <Text style={s.muted}>Dirección de la empresa</Text>
          <TextInput accessibilityLabel="Dirección de la empresa" placeholder="Calle, ciudad, estado" placeholderTextColor={colors.muted} value={draft.address} onChangeText={v=>setDraft(d=>({...d,address:v}))} style={{fontSize:JOBEEN_TYPE.input,lineHeight:JOBEEN_LINE_HEIGHT.input,color:colors.ink,borderColor:colors.line,borderWidth:1,padding:14,borderRadius:10}}/>
          <Text style={s.muted}>Teléfono o correo de la empresa</Text>
          <TextInput accessibilityLabel="Teléfono o correo de la empresa" placeholder="Teléfono o email de contacto" placeholderTextColor={colors.muted} value={draft.contact} onChangeText={v=>setDraft(d=>({...d,contact:v}))} autoCapitalize="none" style={{fontSize:JOBEEN_TYPE.input,lineHeight:JOBEEN_LINE_HEIGHT.input,color:colors.ink,borderColor:colors.line,borderWidth:1,padding:14,borderRadius:10}}/>
          <Button title="Guardar" busy={historyBusy} busyLabel="Guardando…" onPress={add}/>
          {!!editingId&&<Button title="Eliminar experiencia" variant="danger" disabled={historyBusy} onPress={()=>{setConfirmHistoryDelete(true);setFormError("");}}/>}
        </View>}
      </BottomSheet>
      <JobeenShareSheet visible={cvShareOpen&&!!ownHistory} onClose={()=>setCvShareOpen(false)} label="Currículum"
       theme={theme} contentTitle="Compartir CV"
       contentMessage={["Historial profesional de Jobin",...history.map(e=>`${e.role} · ${e.company} · ${e.from}/${e.fromMonth??1} - ${e.to??"Actualidad"}/${e.toMonth??12}`)].join("\n")}
       onError={setNotice}/>
    </SafeAreaView>
  );
}
