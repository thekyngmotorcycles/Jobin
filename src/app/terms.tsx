import { Text,View } from "react-native";
import { Screen,useUi } from "../components/ui";
import { TERMS_DRAFT_CLAUSES,TERMS_PROFESSIONS,TERMS_DRAFT_VERSION } from "../lib/terms-draft";
export default function Terms(){
 const {s}=useUi();
 return <Screen demo={false} title="Términos y Condiciones." subtitle="BORRADOR PENDIENTE DE REVISIÓN LEGAL">
  <Text style={s.tag}>{TERMS_DRAFT_VERSION}</Text>
  {TERMS_DRAFT_CLAUSES.map(c=><View key={c.title} style={s.panel}><Text style={s.h2}>{c.title}</Text><Text style={s.text}>{c.text}</Text></View>)}
  {TERMS_PROFESSIONS.map(g=><View key={g.title} style={s.panel}><Text style={s.h3}>{g.title}</Text>{g.professions.map(p=><Text key={p} style={s.text}>· {p}</Text>)}</View>)}
 </Screen>;
}
