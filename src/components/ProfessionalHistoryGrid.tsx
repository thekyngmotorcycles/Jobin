import {useState} from "react";
import {Ionicons} from "@expo/vector-icons";
import {Pressable,Text,View,useWindowDimensions} from "react-native";
import {BottomSheet} from "./social-ui";
import {EmploymentBanner} from "./EmploymentBanner";
import {employmentBannerFamily} from "../lib/employment-banner";
import {BANNER_PALETTES,EMPLOYMENT_ART} from "../theme/employment-art";
import type {Profession} from "../lib/professional-types";
import {useTheme} from "../state/ThemeProvider";
import {jobeenTokens} from "../theme/jobeen";
import {JOBEEN_CONTROL} from "../theme/control-metrics";
import {useRoyalHiveTypography} from "../theme/ProfileTypographyScope";

export type HistoryTile={id:string;company:string;role:string;from:number;to:number|null;professions?:readonly string[];verifiedBy?:string|null;onEdit?:()=>void};
export function ProfessionalHistoryGrid({rows,catalog=[],onAdd}:{rows:HistoryTile[];catalog?:readonly Profession[];onAdd?:()=>void}){
 const {theme}=useTheme(),jt=jobeenTokens(theme);
 const {fontScale}=useWindowDimensions();
 const {type:JOBEEN_TYPE,lineHeight:JOBEEN_LINE_HEIGHT,adaptive}=useRoyalHiveTypography();
 const [selected,setSelected]=useState<string|null>(null);
 const detail=rows.find(row=>row.id===selected);
 const period=(row:HistoryTile)=>row.from+"–"+(row.to??"Actualidad");
 const verification=(row:HistoryTile)=>row.verifiedBy?"Verificada":row.verifiedBy===null?"No verificada":"Verificación no disponible";
 return <View style={{gap:8}}>
  <View style={{flexDirection:"row",flexWrap:"wrap",marginHorizontal:-4}}>
   {rows.map(row=>{
    const family=employmentBannerFamily(row.role,row.professions,catalog);
    return <View key={row.id} style={{width:"50%",padding:4}}>
     <Pressable accessibilityRole="button" accessibilityLabel={row.company+", "+row.role+", "+period(row)+", "+verification(row)+". Ver detalles"} onPress={()=>setSelected(row.id)}
      style={{aspectRatio:fontScale<=1.15?1:undefined,minHeight:fontScale<=1.15?128:180,borderRadius:16,overflow:"hidden",backgroundColor:BANNER_PALETTES[family][0],padding:10,justifyContent:"space-between",gap:3,borderWidth:1,borderColor:theme==="light"?EMPLOYMENT_ART.tone39:EMPLOYMENT_ART.tone40}}>
      <EmploymentBanner family={family}/>
      <Text numberOfLines={2} style={{fontSize:JOBEEN_TYPE.body,fontWeight:adaptive?"600":"700",color:EMPLOYMENT_ART.tone37}}>{row.company}</Text>
      <Text numberOfLines={2} style={{fontSize:JOBEEN_TYPE.caption,fontWeight:"500",color:EMPLOYMENT_ART.tone41}}>{row.role}</Text>
      <View style={{gap:3}}>
       <Text numberOfLines={1} style={{fontSize:JOBEEN_TYPE.caption,color:EMPLOYMENT_ART.tone37}}>{period(row)}</Text>
       <View style={{flexDirection:"row",alignItems:"center",gap:4}}>
        <Ionicons name={row.verifiedBy?"checkmark-circle-outline":"ellipse-outline"} size={14} color={row.verifiedBy?EMPLOYMENT_ART.tone42:EMPLOYMENT_ART.tone43}/>
        <Text numberOfLines={2} style={{flex:1,minWidth:0,fontSize:JOBEEN_TYPE.micro,color:row.verifiedBy?EMPLOYMENT_ART.tone42:EMPLOYMENT_ART.tone43,fontWeight:"600"}}>{verification(row)}</Text>
       </View>
      </View>
     </Pressable>
    </View>;
   })}
   {!!onAdd&&<View style={{width:"50%",padding:4}}><Pressable accessibilityRole="button" accessibilityLabel="Agregar empleo" onPress={onAdd} style={{aspectRatio:fontScale<=1.15?1:undefined,minHeight:fontScale<=1.15?128:180,borderRadius:16,borderWidth:1,borderStyle:"dashed",borderColor:jt.outline,backgroundColor:jt.surface,alignItems:"center",justifyContent:"center",gap:8,padding:10}}>
    <Ionicons name="add-circle-outline" size={28} color={jt.accentText}/><Text style={{color:jt.ink,fontSize:adaptive?JOBEEN_TYPE.action:JOBEEN_TYPE.secondary,fontWeight:adaptive?"500":"600",textAlign:"center"}}>Agregar empleo</Text>
   </Pressable></View>}
  </View>
  <BottomSheet visible={!!detail} title={detail?.company??"Experiencia profesional"} onClose={()=>setSelected(null)}>
   {!!detail&&<View style={{gap:12}}>
    <Text style={{color:jt.ink,fontWeight:adaptive?"600":"700",fontSize:JOBEEN_TYPE.sectionTitle,lineHeight:JOBEEN_LINE_HEIGHT.sectionTitle}}>{detail.role}</Text>
    <Text style={{color:jt.ink2,fontSize:JOBEEN_TYPE.body,lineHeight:JOBEEN_LINE_HEIGHT.body}}>{period(detail)}</Text>
    <Text style={{color:jt.ink,fontSize:JOBEEN_TYPE.body,lineHeight:JOBEEN_LINE_HEIGHT.body}}>{detail.verifiedBy?"Verificada por "+detail.verifiedBy:verification(detail)}</Text>
    {!!detail.onEdit&&<Pressable accessibilityRole="button" accessibilityLabel={"Editar empleo en "+detail.company} onPress={()=>{setSelected(null);detail.onEdit?.();}} style={{minHeight:JOBEEN_CONTROL.touchTarget,alignItems:"center",justifyContent:"center",backgroundColor:jt.yellow,borderRadius:12}}><Text style={{color:jt.onYellow,fontWeight:adaptive?"500":"700",fontSize:JOBEEN_TYPE.action,lineHeight:JOBEEN_LINE_HEIGHT.action}}>Editar experiencia</Text></Pressable>}
   </View>}
  </BottomSheet>
 </View>;
}
