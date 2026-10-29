import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { Button, Grid, GridItem, Notice, Screen, useUi } from "../components/ui";
import { professionals } from "../lib/data";
import { filterByCity } from "../lib/domain";
import { useApp } from "../state/AppProvider";

export default function Services() {
  const {s} = useUi();
  const { city } = useApp();
  const { professional } = useLocalSearchParams<{ professional?: string }>();
  const [notice, setNotice] = useState("");
  const visible = filterByCity(professionals, city);
  return <Screen title="Talento cerca de ti." subtitle="Servicios locales, con las personas detrás de cada trabajo.">
    {!!notice && <Notice text={notice} onClose={() => setNotice("")} />}
    {professional && !visible.some(p => p.id === professional) &&
      <Text style={s.muted}>El servicio seleccionado está en otra ciudad. Selecciona Todas para verlo.</Text>}
    <Grid>{visible.map(person => <GridItem key={person.id}>
      <View style={[s.panel, professional === person.id && { borderColor: "#173a32", borderWidth: 2 }]}>
        <Text style={s.tag}>{person.tags[0]}{professional === person.id ? " · Seleccionado" : ""}</Text>
        <Text style={s.h2}>{person.service}</Text>
        <Text style={s.muted}>{person.name} · {person.city}</Text>
        <Text style={[s.h1, { marginVertical: 12 }]}>${person.price}<Text style={s.muted}> USD / sesión</Text></Text>
        <Text style={s.text}>Conoce al profesional antes de dar el siguiente paso.</Text>
        <Button title="Consultar disponibilidad" onPress={() => setNotice(person.service + ": $" + person.price + " USD. Vista previa: todavía no se crean reservas ni se realizan cobros.")} />
      </View>
    </GridItem>)}</Grid>
  </Screen>;
}
