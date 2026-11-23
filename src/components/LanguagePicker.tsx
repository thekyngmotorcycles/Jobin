import {useMemo,useState} from "react";
import {FlatList,Modal,Pressable,Text,TextInput,View,useWindowDimensions} from "react-native";
import {JOBEEN_CONTROL} from "../theme/control-metrics";
import {JOBEEN_TYPE} from "../theme/typography";
import {Ionicons} from "@expo/vector-icons";
import {useUi} from "./ui";
import {jobeenModalTokens} from "../theme/modals";
import {JOBEEN_TYPE} from "../theme/typography";
import {useTheme} from "../state/ThemeProvider";
import {JOBIN_LANGUAGES,canonicalLanguage,normalizedLanguage} from "../lib/languages";

export function LanguagePicker({value,onChange,selected=[]}:{value:string;onChange:(name:string)=>void;selected?:string[]}){
 const {s,colors}=useUi();const {theme}=useTheme();const modal=jobeenModalTokens(theme);const {width,height}=useWindowDimensions();
 const [open,setOpen]=useState(false);const [query,setQuery]=useState("");
 const current=canonicalLanguage(value)??value;
 const options=useMemo(()=>JOBIN_LANGUAGES.filter(name=>normalizedLanguage(name).includes(normalizedLanguage(query))),[query]);
 const unavailable=new Set(selected.map(name=>canonicalLanguage(name)??name));
 return <>
  <Pressable accessibilityRole="button" accessibilityLabel="Seleccionar idioma" accessibilityState={{expanded:open}} onPress={()=>{setQuery("");setOpen(true);}} style={{minHeight:48,borderWidth:1,borderColor:modal.border,borderRadius:modal.radius.control,backgroundColor:modal.inner,paddingHorizontal:12,flexDirection:"row",alignItems:"center",gap:8,flex:1}}>
   <Text numberOfLines={1} style={[s.text,{flex:1,color:current?colors.ink:colors.muted}]}>{current||"Seleccionar idioma"}</Text><Ionicons name="chevron-down" size={18} color={colors.muted}/>
  </Pressable>
  <Modal visible={open} transparent animationType="fade" onRequestClose={()=>setOpen(false)}>
   <View style={{flex:1,backgroundColor:modal.scrim,alignItems:"center",justifyContent:"center",padding:18}}>
    <Pressable style={{position:"absolute",top:0,bottom:0,left:0,right:0}} onPress={()=>setOpen(false)} accessibilityLabel="Cerrar selección de idioma"/>
    <View style={{width:Math.min(width-36,360),maxHeight:Math.min(height*0.6,430),backgroundColor:modal.surface,borderRadius:modal.radius.dialog,borderWidth:1,borderColor:modal.border,padding:16,gap:12}}>
     <View style={{flexDirection:"row",alignItems:"center",justifyContent:"space-between"}}>
      <Text style={[s.h3,{fontSize:JOBEEN_TYPE.modalTitle}]}>Seleccionar idioma</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Cerrar lista" onPress={()=>setOpen(false)} style={{padding:5}}><Ionicons name="close" size={24} color={colors.ink}/></Pressable>
     </View>
     <TextInput autoCapitalize="sentences" autoCorrect={false} value={query} onChangeText={setQuery} placeholder="Buscar idioma…" placeholderTextColor={colors.muted} accessibilityLabel="Buscar idioma" style={[s.text,{borderWidth:1,borderColor:colors.outline,borderRadius:JOBEEN_CONTROL.inputRadius,paddingHorizontal:12,minHeight:JOBEEN_CONTROL.inputHeight,fontSize:JOBEEN_TYPE.input,color:colors.ink}]}/>
     <FlatList data={options} keyExtractor={item=>item} keyboardShouldPersistTaps="handled" style={{flexGrow:0}} ListEmptyComponent={<Text style={[s.muted,{paddingVertical:18,textAlign:"center"}]}>No se encontraron idiomas.</Text>} renderItem={({item})=>{
      const disabled=unavailable.has(item)&&item!==current;
      return <Pressable accessibilityRole="button" accessibilityState={{selected:item===current,disabled}} disabled={disabled} onPress={()=>{onChange(item);setOpen(false);}} style={{minHeight:45,flexDirection:"row",alignItems:"center",paddingHorizontal:12,borderRadius:8,backgroundColor:item===current?modal.soft:modal.surface,opacity:disabled?0.45:1}}>
       <Text style={[s.text,{flex:1,fontWeight:item===current?"700":"400"}]}>{item}{disabled?" · Ya agregado":""}</Text>{item===current&&<Ionicons name="checkmark" size={19} color={colors.ink}/>}
      </Pressable>;
     }}/>
    </View>
   </View>
  </Modal>
 </>;
}
