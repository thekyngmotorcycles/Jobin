import {Text,View} from "react-native";
import {useTheme} from "../state/ThemeProvider";
import {jobeenTokens} from "../theme/jobeen";

/** Count of confirmed files, not estimated bytes or fictional upload speed. */
export function JobinFileProgress({done,total}:{done:number;total:number}){
 const {theme}=useTheme(),t=jobeenTokens(theme);
 const max=Math.max(1,Math.floor(total)),value=Math.min(max,Math.max(0,Math.floor(done)));
 const percent=Math.round(value/max*100);
 return <View accessibilityRole="progressbar" accessibilityLabel="Fotografías procesadas" accessibilityValue={{min:0,max,now:value,text:value+" de "+max+" fotografías"}} style={{width:200,maxWidth:"100%",gap:8}}>
  <View style={{height:6,borderRadius:3,backgroundColor:t.line,overflow:"hidden"}}>
   <View style={{height:6,width:`${percent}%`,borderRadius:3,backgroundColor:t.ink}}/>
  </View>
  <Text style={{color:t.ink2,textAlign:"center",fontSize:12}}>{value} de {max} fotografías</Text>
 </View>;
}
