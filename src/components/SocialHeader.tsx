import {useCallback,useRef,useState} from "react";
import {useFocusEffect,router} from "expo-router";
import {Alert,Pressable,View} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {IconButton} from "./social-ui";
import {HomeSideMenu} from "./HomeSideMenu";
import {JobinWordmark} from "./JobinWordmark";
import {JobeenCreateMenu} from "./JobeenCreateMenu";
import {PostQuickComposer} from "./PostQuickComposer";
import {StoryStrip} from "./StoryStrip";
import {loadQuickComposerPreference,saveQuickComposerPreference} from "../lib/home-preferences";
import {currentSocialUser} from "../lib/social-content";
import {useTheme} from "../state/ThemeProvider";
import {jobeenTokens} from "../theme/jobeen";

/** Home composer is off by default and can be shown or hidden per account. */
export function SocialHeader({showComposer=false}:{showComposer?:boolean}){
 const {theme}=useTheme(),t=jobeenTokens(theme);
 const [menu,setMenu]=useState(false);
 const [owner,setOwner]=useState("");
 const [composerVisible,setComposerVisible]=useState(false);
 const [saving,setSaving]=useState(false);
 const reopenMenuOnReturn=useRef(false);
 useFocusEffect(useCallback(()=>{
  if(reopenMenuOnReturn.current){reopenMenuOnReturn.current=false;setMenu(true);}
  if(!showComposer)return;
  let active=true;
  void(async()=>{
   try{
    const id=await currentSocialUser().catch(()=>"");
    const enabled=await loadQuickComposerPreference(id).catch(()=>false);
    if(active){setOwner(id);setComposerVisible(enabled);}
   }catch{if(active){setOwner("");setComposerVisible(false);}}
  })();
  return()=>{active=false;};
 },[showComposer]));
 async function toggleComposer(){
  if(saving)return;
  const next=!composerVisible;
  setComposerVisible(next);setSaving(true);
  try{await saveQuickComposerPreference(owner,next);}
  catch(e){setComposerVisible(!next);Alert.alert("Personalizar inicio",e instanceof Error?e.message:"No se pudo guardar la preferencia.");}
  finally{setSaving(false);}
 }
 return <View style={{gap:10,paddingTop:8}}>
  <View style={{flexDirection:"row",alignItems:"center",justifyContent:"space-between",paddingHorizontal:8}}>
   <IconButton icon="menu" label="Opciones" onPress={()=>setMenu(true)}/>
   <JobinWordmark width={96}/>
   <View style={{flexDirection:"row",alignItems:"center",gap:2}}>
    <JobeenCreateMenu/>
    <IconButton icon="search-outline" label="Buscar" onPress={()=>router.push("/search")}/>
   </View>
  </View>
  {showComposer&&composerVisible&&<PostQuickComposer/>}
  {showComposer?<View style={{flexDirection:"row",alignItems:"center",paddingRight:9,minHeight:94}}>
   <View style={{flex:1,minWidth:0}}><StoryStrip/></View>
   <Pressable accessibilityRole="button" accessibilityLabel={composerVisible?"Ocultar publicación rápida":"Mostrar publicación rápida"}
    accessibilityState={{selected:composerVisible,disabled:saving||!owner}} disabled={saving||!owner} onPress={()=>void toggleComposer()}
    style={{width:44,height:44,borderRadius:14,backgroundColor:composerVisible?t.cream:t.surface,
     borderWidth:1,borderColor:t.line,alignItems:"center",justifyContent:"center",opacity:owner?1:0.5}}>
    <Ionicons name={composerVisible?"chevron-up-outline":"create-outline"} size={20} color={t.ink}/>
   </Pressable>
  </View>:<StoryStrip/>}
  <HomeSideMenu visible={menu} onClose={()=>setMenu(false)} onNavigate={()=>{reopenMenuOnReturn.current=true;}}/>
 </View>;
}
