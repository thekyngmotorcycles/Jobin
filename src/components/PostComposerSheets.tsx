import {Ionicons} from "@expo/vector-icons";
import {Image,Pressable,ScrollView,Text,TextInput,View} from "react-native";
import {BottomSheet} from "./social-ui";
import {useTheme} from "../state/ThemeProvider";
import {jobeenTokens} from "../theme/jobeen";
import type {PostDraft,PostDraftPhoto} from "../lib/post-drafts";
import type {PostMention} from "../lib/post-mentions";
import type {FeedAudience,FeedPostKind} from "../lib/social-content";

type Props={
 exitOpen:boolean;onContinue:()=>void;onSaveExit:()=>void;onDiscardExit:()=>void;
 previewOpen:boolean;onClosePreview:()=>void;
 draftsOpen:boolean;onCloseDrafts:()=>void;drafts:PostDraft[];
 onRestore:(draft:PostDraft)=>void;onDelete:(draft:PostDraft)=>void;
 optionsOpen:boolean;onCloseOptions:()=>void;
 body:string;kind:FeedPostKind;mediaTitle:string;photos:PostDraftPhoto[];audience:FeedAudience;followers:boolean;contacts:boolean;
 onAlt:(id:string,text:string)=>void;
 mentionQuery:string;onMentionQuery:(value:string)=>void;mentions:PostMention[];
 onMention:(person:PostMention)=>void;mentionSearching:boolean;
};
export function PostComposerSheets(p:Props){
 const {theme}=useTheme();const t=jobeenTokens(theme);
 const action=(label:string,icon:React.ComponentProps<typeof Ionicons>["name"],onPress:()=>void,primary=false)=>
  <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress}
   style={{flexDirection:"row",alignItems:"center",gap:12,minHeight:50,borderRadius:15,
    borderWidth:primary?0:1,borderColor:t.line,backgroundColor:primary?t.ink:t.cream,
    paddingHorizontal:15,justifyContent:"center"}}>
   <Ionicons name={icon} size={19} color={primary?t.surface:t.ink}/>
   <Text style={{color:primary?t.surface:t.ink,fontSize:14,fontWeight:"700"}}>{label}</Text>
  </Pressable>;
 return <>
  <BottomSheet visible={p.exitOpen} onClose={p.onContinue} title="¿Qué deseas hacer con tu publicación?">
   <View style={{gap:11,paddingTop:8}}>
    <Text style={{fontSize:13,lineHeight:20,color:t.ink2,marginBottom:5}}>
     Puedes guardar el trabajo y continuar después o descartarlo. Ninguna opción lo publicará.
    </Text>
    {action("Guardar borrador","bookmark-outline",p.onSaveExit,true)}
    {action("Descartar cambios","trash-outline",p.onDiscardExit)}
    <Pressable accessibilityRole="button" accessibilityLabel="Continuar editando" onPress={p.onContinue}
     style={{minHeight:44,alignItems:"center",justifyContent:"center"}}>
     <Text style={{color:t.ink2,fontWeight:"600",fontSize:14}}>Continuar editando</Text>
    </Pressable>
   </View>
  </BottomSheet>

  <BottomSheet visible={p.previewOpen} onClose={p.onClosePreview} title="Vista previa">
   <View style={{gap:13,paddingVertical:10}}>
    <View style={{flexDirection:"row",alignItems:"center",gap:8}}>
     <Ionicons name={p.audience==="public"?"globe-outline":"lock-closed-outline"} size={16} color={t.ink}/>
     <Text style={{fontSize:12,color:t.ink2}}>{p.audience==="public"?"Publicación pública":
      "Privado · "+[p.followers?"Seguidores":"",p.contacts?"Contactos":""].filter(Boolean).join(" y ")}</Text>
    </View>
    <View style={{borderRadius:18,borderWidth:1,borderColor:t.line,backgroundColor:t.surface,padding:16,gap:12}}>
     {(p.kind==="video"||p.kind==="live")&&<View style={{flexDirection:"row",alignItems:"center",gap:10,
      borderRadius:13,backgroundColor:t.cream,padding:13}}>
      <Ionicons name={p.kind==="live"?"radio-outline":"videocam-outline"} size={23} color={t.ink}/>
      <View style={{flex:1,gap:3}}>
       <Text style={{fontWeight:"700",color:t.ink,fontSize:13}}>{p.kind==="video"?"Video aprobado":"Clip de Live"}</Text>
       <Text style={{color:t.ink2,fontSize:12}}>{p.mediaTitle||"Selecciona un contenido antes de publicar"}</Text>
      </View>
     </View>}
     <Text style={{color:t.ink,fontSize:15,lineHeight:23}}>{p.body||"Sin descripción"}</Text>
     {!!p.photos.length&&<ScrollView horizontal showsHorizontalScrollIndicator={false}
      contentContainerStyle={{gap:8}}>
      {p.photos.map((photo,i)=><Image key={photo.id} source={{uri:photo.uri}}
       accessibilityLabel={photo.altText||"Foto "+(i+1)}
       style={{height:175,width:155,borderRadius:11,backgroundColor:t.cream}}/>)}
     </ScrollView>}
    </View>
    <Text style={{color:t.ink2,fontSize:12}}>Así se mostrará tu publicación. Todavía no se ha compartido.</Text>
    {action("Volver a editar","create-outline",p.onClosePreview,true)}
   </View>
  </BottomSheet>

  <BottomSheet visible={p.draftsOpen} onClose={p.onCloseDrafts} title="Mis borradores">
   <View style={{gap:10,paddingTop:8}}>
    {!p.drafts.length&&<Text style={{color:t.ink2,fontSize:13}}>Todavía no tienes borradores guardados.</Text>}
    {p.drafts.map(d=><View key={d.id} style={{flexDirection:"row",alignItems:"center",gap:8,
     borderWidth:1,borderColor:t.line,borderRadius:16,padding:10,backgroundColor:t.surface}}>
     <Pressable accessibilityRole="button" accessibilityLabel={"Continuar borrador "+(d.body||"sin texto")} onPress={()=>p.onRestore(d)}
      style={{flex:1,gap:4,minHeight:48,justifyContent:"center"}}>
      <Text numberOfLines={1} style={{fontSize:14,fontWeight:"700",color:t.ink}}>{d.body.trim()||"Publicación con adjuntos"}</Text>
      <Text style={{fontSize:11,color:t.ink2}}>{new Date(d.updatedAt).toLocaleString("es")} · {d.photos.length} fotos</Text>
     </Pressable>
     <Pressable accessibilityRole="button" accessibilityLabel="Eliminar borrador" onPress={()=>p.onDelete(d)}
      style={{width:44,height:44,alignItems:"center",justifyContent:"center"}}>
      <Ionicons name="trash-outline" color={t.ink2} size={20}/>
     </Pressable>
    </View>)}
   </View>
  </BottomSheet>

  <BottomSheet visible={p.optionsOpen} onClose={p.onCloseOptions} title="Opciones de publicación">
   <View style={{gap:15,paddingTop:8}}>
    <View style={{gap:8}}>
     <View style={{flexDirection:"row",alignItems:"center",gap:8}}>
      <Ionicons name="at-outline" size={21} color={t.ink}/>
      <Text style={{color:t.ink,fontWeight:"700",fontSize:15}}>Etiquetar profesionales y empresas</Text>
     </View>
     <TextInput accessibilityLabel="Buscar profesionales o empresas para etiquetar"
      value={p.mentionQuery} onChangeText={p.onMentionQuery}
      placeholder="Buscar por nombre" placeholderTextColor={t.ink2}
      style={{borderWidth:1,borderColor:t.line,borderRadius:13,backgroundColor:t.surface,
       paddingHorizontal:13,minHeight:45,color:t.ink,fontSize:14}}/>
     {p.mentionSearching&&<Text style={{color:t.ink2,fontSize:12}}>Buscando cuentas...</Text>}
     {p.mentions.map(person=><Pressable key={person.id} accessibilityRole="button"
      accessibilityLabel={"Etiquetar "+person.name} onPress={()=>p.onMention(person)}
      style={{minHeight:44,flexDirection:"row",alignItems:"center",gap:9,paddingHorizontal:8}}>
      <Ionicons name={person.company?"business-outline":"person-outline"} size={19} color={t.ink}/>
      <View style={{flex:1}}>
       <Text style={{color:t.ink,fontSize:13}}>{person.name}</Text>
       {!!person.handle&&<Text style={{color:t.ink2,fontSize:11}}>@{person.handle}</Text>}
      </View>
      <Ionicons name="add-circle-outline" size={20} color={t.ink}/>
     </Pressable>)}
    </View>
    {!!p.photos.length&&<View style={{gap:9,borderTopWidth:1,borderColor:t.line,paddingTop:13}}>
     <View style={{flexDirection:"row",gap:8,alignItems:"center"}}>
      <Ionicons name="accessibility-outline" color={t.ink} size={21}/>
      <Text style={{color:t.ink,fontWeight:"700",fontSize:15}}>Texto alternativo</Text>
     </View>
     <Text style={{color:t.ink2,fontSize:12}}>Describe cada imagen para quienes usan lectores de pantalla.</Text>
     {p.photos.map((photo,i)=><View key={photo.id} style={{flexDirection:"row",gap:10,alignItems:"center"}}>
      <Image source={{uri:photo.uri}} style={{width:55,height:55,borderRadius:9}}/>
      <TextInput accessibilityLabel={"Descripción accesible de fotografía "+(i+1)}
       value={photo.altText} onChangeText={value=>p.onAlt(photo.id,value)} multiline maxLength={500}
       placeholder={"Descripción foto "+(i+1)} placeholderTextColor={t.ink2}
       style={{flex:1,minHeight:51,maxHeight:100,borderWidth:1,borderColor:t.line,
        backgroundColor:t.surface,color:t.ink,borderRadius:12,padding:10,fontSize:12}}/>
     </View>)}
    </View>}
    <View style={{flexDirection:"row",alignItems:"center",gap:9,paddingTop:13,borderTopWidth:1,borderColor:t.line,opacity:0.6}}>
     <Ionicons name="calendar-outline" color={t.ink2} size={22}/>
     <View style={{flex:1,gap:3}}>
      <Text style={{color:t.ink,fontSize:14,fontWeight:"700"}}>Programar publicación</Text>
      <Text style={{color:t.ink2,fontSize:12}}>Disponible cuando el servidor pueda publicar automáticamente.</Text>
     </View>
    </View>
    {action("Aplicar opciones","checkmark-outline",p.onCloseOptions,true)}
   </View>
  </BottomSheet>
 </>;
}
