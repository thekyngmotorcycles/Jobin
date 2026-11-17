import {useCallback,useRef,useState} from "react";
import {useFocusEffect,router} from "expo-router";
import {View} from "react-native";
import {IconButton} from "./social-ui";
import {HomeSideMenu} from "./HomeSideMenu";
import {JobinWordmark} from "./JobinWordmark";
import {JobeenCreateMenu} from "./JobeenCreateMenu";
import {PostQuickComposer} from "./PostQuickComposer";
import {StoryStrip} from "./StoryStrip";

/** Shared Jobeen header, with the quick publisher enabled only for Home. */
export function SocialHeader({showComposer=false}:{showComposer?:boolean}){
 const [menu,setMenu]=useState(false);
 const reopenMenuOnReturn=useRef(false);
 useFocusEffect(useCallback(()=>{
  if(reopenMenuOnReturn.current){reopenMenuOnReturn.current=false;setMenu(true);}
 },[]));
 return <View style={{gap:14,paddingTop:8}}>
  <View style={{flexDirection:"row",alignItems:"center",justifyContent:"space-between",paddingHorizontal:8}}>
   <IconButton icon="menu" label="Opciones" onPress={()=>setMenu(true)}/>
   <JobinWordmark width={96}/>
   <View style={{flexDirection:"row",alignItems:"center",gap:2}}>
    <JobeenCreateMenu/>
    <IconButton icon="search-outline" label="Buscar" onPress={()=>router.push("/search")}/>
   </View>
  </View>
  {showComposer&&<PostQuickComposer/>}
  <StoryStrip/>
  <HomeSideMenu visible={menu} onClose={()=>setMenu(false)} onNavigate={()=>{reopenMenuOnReturn.current=true;}}/>
 </View>;
}
