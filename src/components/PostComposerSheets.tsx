import {Ionicons} from "@expo/vector-icons";
import {Image,KeyboardAvoidingView,Modal,Platform,Pressable,ScrollView,Text,TextInput,View,useWindowDimensions} from "react-native";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {PublicProfileAvatar} from "./PublicProfileAvatar";
import {useTheme} from "../state/ThemeProvider";
import {jobeenTokens} from "../theme/jobeen";
import {jobeenModalTokens} from "../theme/modals";
import {JOBEEN_TYPE} from "../theme/typography";
import {JOBEEN_CONTROL} from "../theme/control-metrics";
import {draftPhotoDisplayUri} from "../lib/post-draft-photo";
import {MAX_POST_DRAFTS,type PostDraft,type PostDraftPhoto} from "../lib/post-drafts";
import type {FeedAudience,FeedPostKind} from "../lib/social-content";

type Props={
 exitOpen:boolean;onContinue:()=>void;onSaveExit:()=>void;onDiscardExit:()=>void;
 previewOpen:boolean;onClosePreview:()=>void;
 draftsOpen:boolean;onCloseDrafts:()=>void;drafts:PostDraft[];
 onRestore:(draft:PostDraft)=>void;onDelete:(draft:PostDraft)=>void;
 body:string;kind:FeedPostKind;mediaTitle:string;photos:PostDraftPhoto[];
 audience:FeedAudience;followers:boolean;contacts:boolean;
 authorId:string;authorName:string;authorHandle:string;
 altPhotoId:string|null;onCloseAlt:()=>void;onAlt:(id:string,text:string)=>void;
};
export function PostComposerSheets(p:Props){
 const {theme}=useTheme();const t=jobeenTokens(theme);const modal=jobeenModalTokens(theme);const danger=jobeenModalTokens(theme,"danger");
 const {width:screenWidth}=useWindowDimensions();const safe=useSafeAreaInsets();
 const cardWidth=Math.min(screenWidth-32,500);
 const photoWidth=cardWidth-2;
 const altPhoto=p.photos.find(x=>x.id===p.altPhotoId);
 const action=(label:string,icon:React.ComponentProps<typeof Ionicons>["name"],onPress:()=>void,primary=false)=>
  <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress}
   style={{minHeight:JOBEEN_CONTROL.touchTarget,alignItems:"center",justifyContent:"center"}}>
   <View style={{width:"100%",height:JOBEEN_CONTROL.visualAction+2,flexDirection:"row",alignItems:"center",justifyContent:"center",gap:8,
    backgroundColor:primary?modal.accent:modal.inner,borderWidth:primary?0:1,borderColor:label==="Descartar cambios"?danger.icon:modal.border,
    borderRadius:modal.radius.control,paddingHorizontal:15}}>
    <Ionicons name={icon} size={18} color={primary?modal.onAccent:label==="Descartar cambios"?danger.icon:modal.text}/>
    <Text style={{fontSize:JOBEEN_TYPE.modalAction,fontWeight:"700",color:primary?modal.onAccent:label==="Descartar cambios"?danger.icon:modal.text}}>{label}</Text>
   </View>
  </Pressable>;
 const backdrop=(onPress:()=>void)=><Pressable accessibilityRole="button" accessibilityLabel="Cerrar ventana"
  onPress={onPress} style={{position:"absolute",top:0,bottom:0,left:0,right:0,backgroundColor:modal.scrim}}/>;
 const floatingCard=(title:string,onClose:()=>void,children:React.ReactNode)=>(
  <KeyboardAvoidingView style={{flex:1,alignItems:"center",justifyContent:"center",paddingHorizontal:16}}
   behavior={Platform.OS==="ios"?"padding":undefined}>
   {backdrop(onClose)}
   <View accessibilityViewIsModal style={{width:cardWidth,maxHeight:"82%",borderRadius:modal.radius.dialog,overflow:"hidden",
    backgroundColor:modal.surface,shadowColor:t.floatingCardShadow,shadowOpacity:0.2,shadowRadius:25,
    shadowOffset:{width:0,height:10},elevation:18}}>
    <View style={{paddingHorizontal:16,paddingTop:12,paddingBottom:8,flexDirection:"row",alignItems:"center",gap:9}}>
     <Text accessibilityRole="header" style={{flex:1,fontSize:JOBEEN_TYPE.modalTitle,fontWeight:"800",color:modal.text}}>{title}</Text>
     <Pressable accessibilityRole="button" accessibilityLabel="Cerrar" onPress={onClose}
      style={{width:JOBEEN_CONTROL.touchTarget,height:JOBEEN_CONTROL.touchTarget,alignItems:"center",justifyContent:"center"}}>
      <Ionicons name="close" size={22} color={t.ink}/>
     </Pressable>
    </View>
    {children}
   </View>
  </KeyboardAvoidingView>
 );
 return <>
  <Modal transparent visible={p.exitOpen} animationType="slide" onRequestClose={p.onContinue} statusBarTranslucent={false}>
   <View style={{flex:1,justifyContent:"flex-end"}}>
    {backdrop(p.onContinue)}
    <View accessibilityViewIsModal style={{maxWidth:700,width:"100%",alignSelf:"center",
     backgroundColor:modal.surface,borderTopLeftRadius:modal.radius.sheet,borderTopRightRadius:modal.radius.sheet,overflow:"hidden",
     paddingHorizontal:20,paddingTop:12,paddingBottom:Math.max(safe.bottom,22),
     shadowColor:t.floatingCardShadow,shadowOpacity:0.2,shadowRadius:20,elevation:20}}>
     <View style={{width:42,height:5,backgroundColor:modal.handle,borderRadius:5,alignSelf:"center",marginBottom:18}}/>
     <Text accessibilityRole="header" style={{fontSize:JOBEEN_TYPE.modalTitle,lineHeight:22,color:modal.text,fontWeight:"800",marginBottom:8}}>
      ¿Guardar tu publicación?
     </Text>
     <Text style={{fontSize:13,lineHeight:20,color:t.ink2,marginBottom:22}}>
      Puedes continuar después o descartar los cambios. No se publicará ningún contenido.
     </Text>
     <View style={{gap:10}}>
      {action("Guardar borrador","bookmark-outline",p.onSaveExit,true)}
      {action("Descartar cambios","trash-outline",p.onDiscardExit)}
      <Pressable accessibilityRole="button" accessibilityLabel="Continuar editando" onPress={p.onContinue}
       style={{minHeight:JOBEEN_CONTROL.touchTarget,alignItems:"center",justifyContent:"center"}}>
       <Text style={{color:t.ink2,fontSize:14,fontWeight:"600"}}>Continuar editando</Text>
      </Pressable>
     </View>
    </View>
   </View>
  </Modal>

  <Modal transparent visible={p.draftsOpen} animationType="fade" onRequestClose={p.onCloseDrafts} statusBarTranslucent={false}>
   {floatingCard("Borradores",p.onCloseDrafts,
    p.drafts.length?<ScrollView showsVerticalScrollIndicator contentContainerStyle={{paddingHorizontal:JOBEEN_CONTROL.modalHorizontalPadding,paddingBottom:18,gap:12}}>
     <Text style={{fontSize:JOBEEN_TYPE.secondary,color:modal.muted}}>{p.drafts.length} de {MAX_POST_DRAFTS} borradores</Text>
     <View style={{flexDirection:"row",flexWrap:"wrap",gap:10}}>
      {p.drafts.map((draft,index)=><View key={draft.id} style={{width:"48%",borderRadius:modal.radius.control,
       borderWidth:1,borderColor:t.line,backgroundColor:t.surface,overflow:"hidden"}}>
       <Pressable accessibilityRole="button" accessibilityLabel={"Continuar borrador "+(index+1)}
        onPress={()=>p.onRestore(draft)}>
        <View style={{height:94,alignItems:"center",justifyContent:"center",backgroundColor:t.cream}}>
         {draftPhotoDisplayUri(draft.photos[0])?<Image source={{uri:draftPhotoDisplayUri(draft.photos[0])}}
          style={{width:"100%",height:"100%"}} resizeMode="cover"/>:
          <Ionicons name={draft.kind==="video"||draft.kind==="live"?"videocam-outline":"document-text-outline"}
           size={32} color={t.ink2}/>}
        </View>
        <View style={{padding:9,gap:4,minHeight:61}}>
         <Text numberOfLines={1} style={{color:t.ink,fontSize:JOBEEN_TYPE.secondary,fontWeight:"700"}}>
          {draft.body.trim()||"Publicación sin descripción"}</Text>
         <Text numberOfLines={1} style={{color:modal.muted,fontSize:JOBEEN_TYPE.caption}}>
          {new Date(draft.updatedAt).toLocaleDateString("es")} · {draft.photos.length} fotos</Text>
        </View>
       </Pressable>
       <Pressable accessibilityRole="button" accessibilityLabel={"Eliminar borrador "+(index+1)}
        onPress={()=>p.onDelete(draft)}
        style={{position:"absolute",top:3,right:3,width:JOBEEN_CONTROL.touchTarget,height:JOBEEN_CONTROL.touchTarget,borderRadius:24,
         alignItems:"center",justifyContent:"center",backgroundColor:t.surface}}>
        <Ionicons name="trash-outline" size={19} color={t.ink}/>
       </Pressable>
      </View>)}
     </View>
    </ScrollView>:<View style={{paddingHorizontal:18,paddingTop:6,paddingBottom:20}}>
     <Text style={{color:modal.muted,fontSize:JOBEEN_TYPE.body,lineHeight:21}}>Aún no tienes borradores guardados.</Text>
    </View>)}
  </Modal>

  <Modal transparent visible={p.previewOpen} animationType="fade" onRequestClose={p.onClosePreview} statusBarTranslucent={false}>
   {floatingCard("Vista previa",p.onClosePreview,
    <ScrollView showsVerticalScrollIndicator keyboardShouldPersistTaps="handled"
     contentContainerStyle={{paddingBottom:16,gap:12}}>
     <View style={{flexDirection:"row",alignItems:"center",gap:9,paddingHorizontal:14,paddingTop:7}}>
      <Ionicons name={p.audience==="public"?"globe-outline":"lock-closed-outline"} size={16} color={t.ink2}/>
      <Text style={{fontSize:12,color:t.ink2}}>{p.audience==="public"?"Publicación pública":
       "Privado · "+[p.followers?"Seguidores":"",p.contacts?"Contactos":""].filter(Boolean).join(" y ")}</Text>
     </View>
     <View style={{marginHorizontal:1,borderTopWidth:1,borderBottomWidth:1,borderColor:t.line,
      backgroundColor:t.surface,paddingVertical:12,gap:12}}>
      <View style={{flexDirection:"row",alignItems:"center",gap:10,paddingHorizontal:14}}>
       <PublicProfileAvatar userId={p.authorId} name={p.authorName} size={38}/>
       <View style={{flex:1,gap:2}}>
        <Text numberOfLines={1} style={{color:t.ink,fontSize:14,fontWeight:"700"}}>{p.authorName}</Text>
        <Text numberOfLines={1} style={{color:t.ink2,fontSize:11}}>{p.authorHandle?"@"+p.authorHandle:"@usuario"} · Ahora</Text>
       </View>
       <Ionicons name="ellipsis-horizontal" size={20} color={t.ink2}/>
      </View>
      {p.kind==="photos"&&!!p.photos.length&&<View style={{width:photoWidth,alignSelf:"center"}}>
       <ScrollView horizontal pagingEnabled nestedScrollEnabled showsHorizontalScrollIndicator={false}>
        {p.photos.map((photo,i)=><Image key={photo.id} source={{uri:draftPhotoDisplayUri(photo)}}
         accessibilityLabel={photo.altText||"Fotografía "+(i+1)}
         style={{width:photoWidth,height:photoWidth,backgroundColor:t.cream}} resizeMode="cover"/>)}
       </ScrollView>
       <Text style={{fontSize:11,textAlign:"center",color:t.ink2,paddingTop:5}}>{p.photos.length} fotografías</Text>
      </View>}
      {(p.kind==="video"||p.kind==="live")&&<View style={{height:170,backgroundColor:t.cream,
       alignItems:"center",justifyContent:"center",gap:8}}>
       <Ionicons name={p.kind==="live"?"radio-outline":"play-circle-outline"} size={44} color={t.ink}/>
       <Text style={{color:t.ink,fontWeight:"700",fontSize:13}}>{p.mediaTitle||"Contenido sin seleccionar"}</Text>
      </View>}
      {!!p.body&&<Text style={{fontSize:14,lineHeight:21,color:t.ink,paddingHorizontal:14}}>{p.body}</Text>}
      <View style={{flexDirection:"row",gap:30,alignItems:"center",paddingHorizontal:14,paddingVertical:6}}>
       <Ionicons name="heart-outline" size={22} color={t.ink}/>
       <Ionicons name="chatbubble-outline" size={20} color={t.ink}/>
       <Ionicons name="arrow-redo-outline" size={22} color={t.ink}/>
       <View style={{flex:1}}/>
       <Ionicons name="bookmark-outline" size={22} color={t.ink}/>
      </View>
     </View>
     <Text style={{fontSize:JOBEEN_TYPE.secondary,color:t.ink2,paddingHorizontal:16}}>Vista de ejemplo. Tu publicación todavía no es visible para otros usuarios.</Text>
     <View style={{paddingHorizontal:16}}>{action("Volver a editar","create-outline",p.onClosePreview,true)}</View>
    </ScrollView>)}
  </Modal>

  <Modal transparent visible={!!p.altPhotoId} animationType="fade" onRequestClose={p.onCloseAlt} statusBarTranslucent={false}>
   {floatingCard("Describir foto",p.onCloseAlt,
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{padding:16,gap:12}}>
     {!!altPhoto&&<Image source={{uri:draftPhotoDisplayUri(altPhoto)}} resizeMode="contain"
      style={{width:"100%",height:150,borderRadius:12,backgroundColor:t.cream}}/>}
     <Text style={{color:t.ink2,fontSize:12,lineHeight:18}}>
      Esta descripción opcional ayuda a las personas que usan lectores de pantalla a comprender la fotografía.
     </Text>
     {!!altPhoto&&<TextInput accessibilityLabel="Descripción accesible de fotografía"
      value={altPhoto.altText} onChangeText={value=>p.onAlt(altPhoto.id,value)}
      placeholder="Describe qué aparece en la imagen" placeholderTextColor={t.ink2}
      maxLength={500} multiline textAlignVertical="top"
      style={{minHeight:90,maxHeight:160,padding:12,color:t.ink,backgroundColor:t.surface,
       borderRadius:14,borderWidth:1,borderColor:t.line,fontSize:14}}/>}
     {action("Guardar descripción","checkmark-outline",p.onCloseAlt,true)}
    </ScrollView>)}
  </Modal>
 </>;
}
