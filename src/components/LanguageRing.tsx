import Svg,{Path,Defs,LinearGradient,Stop} from "react-native-svg";
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
/** Flags represent a familiar country/region associated with a language, not its only speakers. */
export const LANGUAGE_FLAGS:Record<string,string>={
 "Albanés": "🇦🇱",
 "Alemán": "🇩🇪",
 "Amárico": "🇪🇹",
 "Árabe": "🇸🇦",
 "Armenio": "🇦🇲",
 "Azerí": "🇦🇿",
 "Bengalí": "🇧🇩",
 "Bielorruso": "🇧🇾",
 "Birmano": "🇲🇲",
 "Bosnio": "🇧🇦",
 "Búlgaro": "🇧🇬",
 "Catalán": "🇦🇩",
 "Checo": "🇨🇿",
 "Chino (cantonés)": "🇭🇰",
 "Chino (mandarín)": "🇨🇳",
 "Coreano": "🇰🇷",
 "Croata": "🇭🇷",
 "Danés": "🇩🇰",
 "Eslovaco": "🇸🇰",
 "Esloveno": "🇸🇮",
 "Español": "🇪🇸",
 "Estonio": "🇪🇪",
 "Filipino (tagalo)": "🇵🇭",
 "Finés": "🇫🇮",
 "Francés": "🇫🇷",
 "Gallego": "🇪🇸",
 "Georgiano": "🇬🇪",
 "Griego": "🇬🇷",
 "Guaraní": "🇵🇾",
 "Hebreo": "🇮🇱",
 "Hindi": "🇮🇳",
 "Húngaro": "🇭🇺",
 "Indonesio": "🇮🇩",
 "Inglés": "🇬🇧",
 "Islandés": "🇮🇸",
 "Italiano": "🇮🇹",
 "Japonés": "🇯🇵",
 "Jemer": "🇰🇭",
 "Kazajo": "🇰🇿",
 "Kinyarwanda": "🇷🇼",
 "Kurdo": "🇮🇶",
 "Lao": "🇱🇦",
 "Letón": "🇱🇻",
 "Lituano": "🇱🇹",
 "Macedonio": "🇲🇰",
 "Malayo": "🇲🇾",
 "Malayalam": "🇮🇳",
 "Maratí": "🇮🇳",
 "Mongol": "🇲🇳",
 "Nepalí": "🇳🇵",
 "Neerlandés": "🇳🇱",
 "Noruego": "🇳🇴",
 "Persa (farsi)": "🇮🇷",
 "Polaco": "🇵🇱",
 "Portugués": "🇵🇹",
 "Punyabí": "🇮🇳",
 "Quechua": "🇵🇪",
 "Rumano": "🇷🇴",
 "Ruso": "🇷🇺",
 "Serbio": "🇷🇸",
 "Suajili": "🇹🇿",
 "Sueco": "🇸🇪",
 "Tailandés": "🇹🇭",
 "Tamil": "🇮🇳",
 "Telugu": "🇮🇳",
 "Turco": "🇹🇷",
 "Ucraniano": "🇺🇦",
 "Urdu": "🇵🇰",
 "Uzbeko": "🇺🇿",
 "Vietnamita": "🇻🇳",
 "Yoruba": "🇳🇬",
 "Zulú": "🇿🇦"
};
export function languageFlag(name:string){
 const key=name.trim().normalize("NFD").replace(/[\\u0300-\\u036f]/g,"").toLowerCase();
 const aliases:Record<string,string>={spanish:"Español",castellano:"Español",english:"Inglés",french:"Francés",portuguese:"Portugués",german:"Alemán",italian:"Italiano",mandarin:"Chino (mandarín)",chino:"Chino (mandarín)"};
 const canonical=Object.keys(LANGUAGE_FLAGS).find(language=>language.normalize("NFD").replace(/[\\u0300-\\u036f]/g,"").toLowerCase()===key)??aliases[key];
 return canonical?LANGUAGE_FLAGS[canonical]:"🌐";
}
function wavyArc(fraction:number){const steps=Math.max(2,Math.round(140*fraction));let path="";for(let i=0;i<=steps;i++){const angle=-Math.PI/2+2*Math.PI*fraction*i/steps;const radius=25+1.1*Math.sin(i/steps*2*Math.PI*fraction*18);const x=32+radius*Math.cos(angle),y=32+radius*Math.sin(angle);path+=(i===0?"M":"L")+x.toFixed(2)+" "+y.toFixed(2)+" ";}return path;}
export function LanguageRing({name,value,color,track}:{name:string;value:number;color:string;track:string}){
 const size=52,progress=Math.max(0,Math.min(100,value))/100;
 const activeColor=progress<=0.5?proficiencyColors.low:progress<0.8?proficiencyColors.middle:proficiencyColors.high;
 return <View accessible accessibilityLabel={name+", "+languageLabel(value)} style={{width:size,height:size,alignItems:"center",justifyContent:"center"}}>
  <Svg width={size} height={size} viewBox="0 0 64 64" style={{position:"absolute"}}><Defs><LinearGradient id="jobinLevelGradient" x1="0%" y1="0%" x2="100%" y2="100%"><Stop offset="0%" stopColor={proficiencyColors.low}/><Stop offset="50%" stopColor={proficiencyColors.middle}/><Stop offset="100%" stopColor={proficiencyColors.high}/></LinearGradient></Defs>
   <Path d={wavyArc(1)} stroke={track} strokeWidth="5" fill="none"/>
   <Path d={wavyArc(progress)} stroke={activeColor} strokeWidth="6" fill="none" strokeLinecap="round"/>
  </Svg>
  <Text style={{color,fontSize:19,fontWeight:"800"}}>{languageFlag(name)}</Text>
 </View>;
}
