import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import type { Intent } from "../lib/data";
import { professionals } from "../lib/data";
import { useApp } from "../state/AppProvider";
import { Button, useUi } from "./ui";

export function ProfessionalCard({ person, intent, onInterest }: { person: typeof professionals[number]; intent: Intent; onInterest: () => void }) {
  const {s,colors,fs} = useUi();
  const { likes, saved, interests, toggleLike, toggleSaved } = useApp();
  const interested = interests.some(item => item.professionalId === person.id && item.intent === intent);
  return <View style={[styles.card,{backgroundColor:colors.card,borderColor:colors.line}]}>
    <View style={[styles.visual, { backgroundColor: person.color }]}>
      <View style={s.row}><Text style={s.tag}>★ {person.rating.toFixed(1)} · {person.reviews} reseñas de ejemplo</Text></View>
      <Text style={[styles.initials,{fontSize:fs(88)}]} accessibilityElementsHidden importantForAccessibility="no">{person.initials}</Text>
      <Text style={[styles.headline,{fontSize:fs(24)}]}>{person.headline}</Text>
    </View>
    <View style={styles.body}>
      <View style={s.row}><View style={[s.avatar, { backgroundColor: person.color }]}><Text style={s.text}>{person.initials}</Text></View>
        <View style={{ flex: 1 }}><Text style={s.h3}>{person.name}</Text><Text style={s.muted}>{person.role} · {person.city}</Text></View></View>
      <Text style={s.muted}>{person.description}</Text>
      <View style={s.row}>
        <Button secondary title={likes.includes(person.id) ? "♥ Me inspira" : "♡ Me inspira"} selected={likes.includes(person.id)} onPress={() => toggleLike(person.id)} />
        <Button secondary title={saved.includes(person.id) ? "★ Guardado" : "☆ Guardar"} selected={saved.includes(person.id)} onPress={() => toggleSaved(person.id)} />
      </View>
      <View style={s.row}>
        <Button title={interested ? "✓ Interés guardado" : "Me interesa"} selected={interested} onPress={() => { if (!interested) onInterest(); }} />
        <Button secondary title="Ver servicio ↗" onPress={() => router.navigate({ pathname: "/services", params: { professional: person.id } })} />
      </View>
    </View>
  </View>;
}
const styles = StyleSheet.create({
  card: { borderRadius: 18, overflow: "hidden", borderWidth: 1, flex: 1 },
  visual: { aspectRatio: 1.1, padding: 18, justifyContent: "space-between", overflow: "hidden" },
  initials: { position: "absolute", alignSelf: "center", top: "28%", fontWeight: "900", color: "#ffffff40" },
  headline: { fontWeight: "800", letterSpacing: -0.8, color: "#fff" },
  body: { padding: 18, gap: 16 },
});
