import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { professionals } from "../lib/data";
import { useApp } from "../state/AppProvider";
import { Button, s } from "./ui";

export function ProfessionalCard({ person }: { person: typeof professionals[number] }) {
  const { likes, saved, toggleLike, toggleSaved } = useApp();
  return <View style={styles.card}>
    <View style={[styles.visual, { backgroundColor: person.color }]}>
      <Text style={s.tag}>UN DÍA CON {person.name.split(" ")[0].toUpperCase()}</Text>
      <Text style={styles.initials} accessibilityElementsHidden importantForAccessibility="no">{person.initials}</Text>
      <View style={{ gap: 10 }}><Text style={styles.preview}>Portafolio ilustrado · video próximamente</Text>
        <Text style={styles.headline}>{person.headline}</Text></View>
    </View>
    <View style={styles.body}>
      <View style={s.row}><View style={[s.avatar, { backgroundColor: person.color }]}><Text style={s.text}>{person.initials}</Text></View>
        <View style={{ flex: 1 }}><Text style={s.h3}>{person.name}</Text><Text style={s.muted}>{person.role} · {person.city}</Text></View></View>
      <Text style={s.muted}>{person.description}</Text>
      <View style={s.row}>
        <Button secondary title={likes.includes(person.id) ? "♥ Me inspira" : "♡ Me inspira"} selected={likes.includes(person.id)} onPress={() => toggleLike(person.id)} />
        <Button secondary title={saved.includes(person.id) ? "★ Guardado" : "☆ Guardar"} selected={saved.includes(person.id)} onPress={() => toggleSaved(person.id)} />
      </View>
      <Button title="Ver servicio ↗" onPress={() => router.navigate({ pathname: "/services", params: { professional: person.id } })} />
    </View>
  </View>;
}
const styles = StyleSheet.create({
  card: { borderRadius: 18, overflow: "hidden", borderWidth: 1, borderColor: "#dfe6dc", backgroundColor: "#fff", flex: 1 },
  visual: { height: 340, padding: 22, justifyContent: "space-between", overflow: "hidden" },
  initials: { position: "absolute", alignSelf: "center", top: 70, fontSize: 130, fontWeight: "900", color: "#ffffff40" },
  preview: { fontSize: 10, color: "#fff", fontWeight: "600" },
  headline: { fontSize: 30, fontWeight: "800", letterSpacing: -1, color: "#fff" },
  body: { padding: 20, gap: 18 },
});
