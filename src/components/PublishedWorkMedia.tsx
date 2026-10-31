import { router } from "expo-router";
import { Text,View } from "react-native";
import { Button,useUi } from "./ui";
import { loadPublishedMedia } from "../lib/safety-api";
import { useProfessionalData } from "../state/useProfessionalData";
export function PublishedWorkMedia({kind}:{kind:"live"|"video"}){
 const {s}=useUi();const resource=useProfessionalData(loadPublishedMedia);const entries=resource.data?.filter(m=>m.kind===kind)??[];
 if(!entries.length)return null;
 return <View style={[s.panel,{marginHorizontal:16}]}><Text style={s.h2}>{kind==="live"?"Trabajando en vivo":"Trabajo publicado"}</Text>
 {entries.map(m=><Button key={m.id} secondary title={m.title} onPress={()=>router.push({pathname:"/work-media/[id]",params:{id:m.id}})}/>)}
 <Button secondary title="Actualizar publicaciones" onPress={resource.reload}/>
 </View>;
}
