import { Text, View } from "react-native";
import { Button, Grid, GridItem, Screen, useUi } from "../components/ui";
import { guilds } from "../lib/data";
import { filterByCity } from "../lib/domain";
import { useApp } from "../state/AppProvider";

export default function Communities() {
  const {s,colors} = useUi();
  const { city, joined, toggleJoined } = useApp();
  return <Screen showCity title="Encuentra a tu gente." subtitle="Conocimiento, colaboración y oportunidades en tu ciudad.">
    <Grid>{filterByCity(guilds, city).map(guild => <GridItem key={guild.name}>
      <View style={s.panel}><Text style={{ fontSize: 44, color: colors.ink }}>◎</Text>
        <Text style={s.h2}>{guild.name}</Text><Text style={s.tag}>{guild.city} · {guild.members} miembros demo</Text>
        <Text style={s.muted}>{guild.description}</Text>
        <Button secondary selected={joined.includes(guild.name)} title={joined.includes(guild.name) ? "Salir de la comunidad demo" : "Unirme en demo"}
          onPress={() => toggleJoined(guild.name)} />
      </View>
    </GridItem>)}</Grid>
  </Screen>;
}
