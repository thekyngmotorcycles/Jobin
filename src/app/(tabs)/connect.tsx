import { useState } from "react";
import { Text, View } from "react-native";
import { Chips, Grid, GridItem, Notice, Screen, useUi } from "../../components/ui";
import { ProfessionalCard } from "../../components/ProfessionalCard";
import type { Intent } from "../../lib/data";
import { professionals } from "../../lib/data";
import { filterByCity, rankByRating } from "../../lib/domain";
import { useApp } from "../../state/AppProvider";

const modes: readonly Intent[] = ["Profesionales", "Amistad", "Citas"];
export default function Connect() {
  const {s} = useUi();
  const { city, intent, setIntent, interests, expressInterest } = useApp();
  const [notice, setNotice] = useState("");
  const count = interests.filter(item => item.intent === intent).length;
  const ranked = rankByRating(filterByCity(professionals, city));
  function interest(professionalId: string) {
    expressInterest(professionalId, intent);
    setNotice("Interés guardado en esta sesión. Un match requiere interés mutuo.");
  }
  return <Screen showCity title="Una conexión lo cambia todo." subtitle="Encuentra colaboradores, nuevas amistades y personas con quienes compartir.">
    <Chips values={modes} value={intent} onChange={setIntent} label="Tipo de conexión" />
    {!!notice && <Notice text={notice} onClose={() => setNotice("")} />}
    <Grid>{ranked.map(person => <GridItem key={person.id}>
      <ProfessionalCard person={person} intent={intent} onInterest={() => interest(person.id)} />
    </GridItem>)}</Grid>
    <View style={s.panel}><Text style={s.h2}>Tus conexiones · {intent}</Text>
      <Text style={s.text}>{count} intereses guardados en esta sesión</Text>
      <Text style={s.h3}>Matches</Text>
      <Text style={s.muted}>Aún no tienes matches mutuos. Las cuentas y las conexiones con personas reales estarán disponibles al integrar el servidor.</Text>
    </View>
  </Screen>;
}
