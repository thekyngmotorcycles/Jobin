import Svg,{Circle,Defs,LinearGradient,Stop} from "react-native-svg";
import {Text,View} from "react-native";
import {proficiencyColors} from "../theme/jcard";
export const LANGUAGE_LEVELS=[
 {label:"Básico",value:20,code:"A1–A2"},
 {label:"Intermedio",value:45,code:"B1"},
 {label:"Intermedio alto",value:65,code:"B2"},
 {label:"Avanzado",value:82,code:"C1"},
 {label:"Dominio completo",value:100,code:"C2"},
] as const;
export function languageLabel(value:number){if(value>=95)return "Dominio completo";if(value>=75)return "Avanzado";if(value>=55)return "Intermedio alto";if(value>=35)return "Intermedio";return "Básico";}
export function languageSymbol(name:string){const n=name.trim().toLocaleLowerCase();if(/español|spanish|castellano/.test(n))return "ES";if(/inglés|ingles|english/.test(n))return "EN";if(/francés|frances|french/.test(n))return "FR";if(/portugués|portugues|portuguese/.test(n))return "PT";if(/alemán|aleman|german/.test(n))return "DE";if(/italiano|italian/.test(n))return "IT";return (name.trim().slice(0,2)||"ID").toLocaleUpperCase();}
export function LanguageRing({name,value,color,track}:{name:string;value:number;color:string;track:string}){
 const size=64,radius=25,circumference=2*Math.PI*radius,progress=Math.max(0,Math.min(100,value))/100;
 return <View accessible accessibilityLabel={name+", "+languageLabel(value)} style={{width:size,height:size,alignItems:"center",justifyContent:"center"}}>
  <Svg width={size} height={size} viewBox="0 0 64 64" style={{position:"absolute"}}><Defs><LinearGradient id="jobinLevelGradient" x1="0%" y1="0%" x2="100%" y2="100%"><Stop offset="0%" stopColor={proficiencyColors.low}/><Stop offset="50%" stopColor={proficiencyColors.middle}/><Stop offset="100%" stopColor={proficiencyColors.high}/></LinearGradient></Defs>
   <Circle cx="32" cy="32" r={radius} stroke={track} strokeWidth="5" fill="none"/>
   <Circle cx="32" cy="32" r={radius} stroke="url(#jobinLevelGradient)" strokeWidth="6" fill="none" strokeDasharray={circumference} strokeDashoffset={circumference*(1-progress)} strokeLinecap="round" rotation="-90" origin="32,32"/>
  </Svg>
  <Text style={{color,fontSize:16,fontWeight:"800"}}>{languageSymbol(name)}</Text>
 </View>;
}
