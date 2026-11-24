import {Stack,router,useLocalSearchParams} from "expo-router";
import {Ionicons} from "@expo/vector-icons";
import {useState} from "react";
import {Alert,Text,View} from "react-native";
import {Button,Chips,Notice,PageFrame,PageState,useUi} from "../components/ui";
import {MyWorkMedia} from "../components/MyWorkMedia";
import {loadWorkspace} from "../lib/professional-api";
import {allowedPanelModule,panelPreview,PANEL_PERIODS,PANEL_PERIOD_LABELS,panelPostsInPeriod,panelPostTotals,type PanelPeriod} from "../lib/panel-workspace";
import {captureMessageScope,assertMessageScope} from "../lib/message-session";
import {loadAllProfilePosts,deleteHomePost,type FeedPost} from "../lib/social-content";
import {useProfessionalData,useScopedProfessionalAction} from "../state/useProfessionalData";

async function loadOwnedPosts(requireEngagement=false){
 const scope=await captureMessageScope();
 const posts=await loadAllProfilePosts(scope.owner,scope.owner,scope,requireEngagement);
 await assertMessageScope(scope);
 if(posts.some(post=>post.authorId!==scope.owner))throw Error("No se pudo verificar la titularidad de las publicaciones.");
 return posts;
}
const loadOwnedStatistics=()=>loadOwnedPosts(true);
const loadOwnedContent=()=>loadOwnedPosts();
function PostManager({statistics,owner,session}:{statistics:boolean;owner:string;session:string}){
 const {s}=useUi();
 const [period,setPeriod]=useState<PanelPeriod>("all");
 const [visible,setVisible]=useState(20);
 const resource=useProfessionalData(statistics?loadOwnedStatistics:loadOwnedContent,false,true);
 const action=useScopedProfessionalAction(resource.reload,resource.scope);
 if(resource.loading&&!resource.data)return <PageState kind="loading"/>;
 if(resource.error)return <PageState kind="error" message={resource.error} actionLabel="Reintentar" onAction={resource.reload}/>;
 if(!resource.data||resource.scope?.owner!==owner||resource.scope.session!==session)return <PageState kind="info" message="No se pudo verificar el contenido de tu cuenta." actionLabel="Reintentar" onAction={resource.reload}/>;
 const posts=resource.data;
 function confirmDelete(post:FeedPost){
  if(!posts.some(item=>item.id===post.id&&item.authorId===owner))return;
  Alert.alert("Eliminar publicación","¿Eliminar esta publicación de tu perfil y de Casa? Esta acción no se puede deshacer.",[
   {text:"Cancelar",style:"cancel"},
   {text:"Eliminar",style:"destructive",onPress:()=>void action.run(async(scope,check)=>{await check();if(scope.owner!==owner||scope.session!==session)throw Error("La sesión cambió.");await deleteHomePost(post.id,scope);},"Publicación eliminada.")}
  ]);
 }
 if(statistics){
  const selected=panelPostsInPeriod(posts,period,Date.now()),total=panelPostTotals(selected);
  return <View style={s.panel}>
   <Text accessibilityRole="header" style={s.h3}>Publicaciones</Text>
   <Chips values={PANEL_PERIODS} value={period} onChange={setPeriod} label="Fecha de publicación" getLabel={value=>PANEL_PERIOD_LABELS[value]}/>
   {([["Publicadas",total.posts],["Me gusta",total.likes],["Comentarios",total.comments],["Compartidos",total.shares]] as const).map(([label,value])=><View key={label} style={{flexDirection:"row",alignItems:"center",justifyContent:"space-between",gap:8}}><Text style={s.text}>{label}</Text><Text style={s.h3}>{value}</Text></View>)}
   <Text style={s.muted}>Interacciones acumuladas de las publicaciones creadas en el período seleccionado. La audiencia de Lives y los ingresos aún no están disponibles.</Text>
   <Button secondary title="Actualizar" onPress={resource.reload}/>
  </View>;
 }
 return <>
  {!!action.notice&&<Notice text={action.notice} onClose={()=>action.setNotice("")}/>}
  <View style={s.panel}>
   <Text accessibilityRole="header" style={s.h3}>Publicaciones</Text>
   {!posts.length?<PageState kind="empty" message="Todavía no tienes publicaciones."/>:posts.slice(0,visible).map(post=><View key={post.id} style={{gap:8,paddingVertical:8}}>
    <Text style={s.text} numberOfLines={3}>{post.body.trim()||({text:"Publicación",photos:"Fotos",video:"Video",live:"Live"}[post.kind])}</Text>
    <Text style={s.muted}>{new Date(post.createdAt).toLocaleDateString()}</Text>
    <View style={s.row}>
     <Button secondary title="Ver" onPress={()=>router.push({pathname:"/post/[id]",params:{id:post.id}})}/>
     <Button variant="danger" title="Eliminar" disabled={action.busy} onPress={()=>confirmDelete(post)}/>
    </View>
   </View>)}
   {posts.length>visible&&<Button secondary title="Ver más" onPress={()=>setVisible(n=>n+20)}/>}
  </View>
 </>;
}
const contentKinds=["posts","video","live"] as const;
const contentLabels={posts:"Publicaciones",video:"Videos y Flashes",live:"Lives"};
function ContentManager({statistics,owner,session}:{statistics:boolean;owner:string;session:string}){
 const [kind,setKind]=useState<(typeof contentKinds)[number]>("posts");
 if(statistics)return <PostManager statistics owner={owner} session={session}/>;
 return <>
  <Chips values={contentKinds} value={kind} onChange={setKind} label="Tipo de contenido" getLabel={value=>contentLabels[value]}/>
  {kind==="posts"?<PostManager statistics={false} owner={owner} session={session}/>:<MyWorkMedia key={kind} kind={kind} managementScope={{owner,session}}/>}
 </>;
}
export default function PanelModule(){
 const {module:id}=useLocalSearchParams<{module?:string}>();
 const {s,colors}=useUi();
 const workspace=useProfessionalData(loadWorkspace,false,true);
 const item=allowedPanelModule(workspace.data,workspace.scope,id);
 if(workspace.loading&&!item)return <PageFrame kind="management"><PageState kind="loading"/></PageFrame>;
 if(workspace.error)return <PageFrame kind="management"><PageState kind="error" message={workspace.error} actionLabel="Reintentar" onAction={workspace.reload}/></PageFrame>;
 if(!item||!workspace.scope)return <PageFrame kind="management"><PageState kind="info" message="Esta herramienta no está disponible para tu cuenta."/></PageFrame>;
 const scope=workspace.scope;
 return <PageFrame kind="management">
  <Stack.Screen options={{title:item.title}}/>
  {item.id==="content"||item.id==="statistics"?<ContentManager key={scope.owner+":"+scope.session+":"+item.id} owner={scope.owner} session={scope.session} statistics={item.id==="statistics"}/>:!item.ready?<View style={s.panel}>
   <Text style={s.muted}>En preparación</Text>
   {item.id==="highlights"&&<Text style={s.text}>Los candidatos serán privados, editables y se podrán publicar como Flash. Los borradores automáticos no guardados caducarán a los 7 días. No se archivarán Lives completos.</Text>}
   {panelPreview[item.id]?.map(label=><View key={label} style={{minHeight:48,flexDirection:"row",alignItems:"center",gap:12}}>
    <Ionicons name="lock-closed-outline" color={colors.muted} size={18}/>
    <Text style={[s.text,{flex:1,color:colors.muted}]}>{label}</Text>
   </View>)}
  </View>:<PageState kind="info" message="Abre esta herramienta desde el Panel."/>}
 </PageFrame>;
}
