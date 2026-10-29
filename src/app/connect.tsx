import { Text, View } from "react-native";
import { Chips, Screen, s } from "../components/ui";
import { SwipeDeck } from "../components/SwipeDeck";
import type { Intent } from "../lib/data";
import { useApp } from "../state/AppProvider";

const modes: readonly Intent[] = ["Profesionales", "Amistad", "Citas"];
export default function Connect() {
  const { city, intent, setIntent, interests } = useApp();
  const count = interests.filter(item => item.intent === intent).length;
  return <Screen title="Una conexión lo cambia todo." subtitle="Encuentra colaboradores, nuevas amistades y personas con quienes compartir.">
    <Chips values={modes} value={intent} onChange={setIntent} label="Tipo de conexión" />
    <View style={{ maxWidth: 560, width: "100%", alignSelf: "center", gap: 20 }}>
      <SwipeDeck key={city + ":" + intent} city={city} intent={intent} />
      <View style={s.panel}><Text style={s.h2}>Tus conexiones · {intent}</Text>
        <Text style={s.text}>{count} intereses guardados en esta sesión</Text>
        <Text style={s.h3}>Matches</Text>
        <Text style={s.muted}>Aún no tienes matches mutuos. Las cuentas y las conexiones con personas reales estarán disponibles al integrar el servidor.</Text>
      </View>
    </View>
  </Screen>;
}
