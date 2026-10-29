import { useMemo, type ReactNode } from "react";
import { Platform } from "react-native";
import { useTheme } from "../state/ThemeProvider";
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApp } from "../state/AppProvider";

export function useUi() { const { colors } = useTheme(); const s = useMemo(() => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  content: { padding: 20, gap: 20, width: "100%", maxWidth: 1180, alignSelf: "center" },
  header: { gap: 16, marginBottom: 4 },
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 16 },
  brand: { fontSize: 28, fontWeight: "900", color: colors.ink, letterSpacing: -1.5 },
  eyebrow: { fontSize: 10, letterSpacing: 2, fontWeight: "700", color: colors.muted },
  h1: { fontSize: 34, fontFamily: Platform.OS === "android" ? "serif" : "Georgia", fontStyle: "italic", fontWeight: "500", letterSpacing: -1, color: colors.ink },
  h2: { fontSize: 25, fontFamily: Platform.OS === "android" ? "serif" : "Georgia", fontStyle: "italic", fontWeight: "500", color: colors.ink },
  h3: { fontSize: 16, fontWeight: "700", color: colors.ink },
  text: { fontSize: 14, lineHeight: 22, color: colors.ink },
  muted: { fontSize: 12, lineHeight: 20, color: colors.muted },
  row: { flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" },
  panel: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, borderRadius: 18, padding: 22, gap: 16 },
  button: { minHeight: 44, borderRadius: 10, paddingHorizontal: 18, paddingVertical: 12, backgroundColor: colors.ink, alignItems: "center", justifyContent: "center" },
  buttonText: { color: colors.inverse, fontWeight: "600", fontSize: 13 },
  secondary: { backgroundColor: colors.accent },
  secondaryText: { color: colors.ink },
  chip: { borderRadius: 24, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 14, minHeight: 44, justifyContent: "center", backgroundColor: colors.card },
  chipSelected: { backgroundColor: colors.ink, borderColor: colors.ink },
  chipText: { fontSize: 12, color: colors.ink },
  tag: { fontSize: 10, fontWeight: "600", color: colors.ink, backgroundColor: colors.accent, alignSelf: "flex-start", paddingVertical: 7, paddingHorizontal: 12, borderRadius: 18, overflow: "hidden" },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  notice: { padding: 16, borderRadius: 12, backgroundColor: colors.accent, gap: 10 },
  footer: { paddingVertical: 20, borderTopWidth: 1, borderTopColor: colors.line, gap: 6 },
  pressed: { opacity: 0.65 },
}), [colors]); return { s, colors }; }
export function Button({ title, onPress, secondary = false, selected, label }: {
  title: string; onPress: () => void; secondary?: boolean; selected?: boolean; label?: string;
}) {
  const {s} = useUi();
  return <Pressable accessibilityRole="button" accessibilityLabel={label ?? title}
    accessibilityState={selected === undefined ? undefined : { selected }}
    onPress={onPress} style={({ pressed }) => [s.button, secondary && s.secondary, pressed && s.pressed]}>
    <Text style={[s.buttonText, secondary && s.secondaryText]}>{title}</Text>
  </Pressable>;
}
export function Chips<T extends string>({ values, value, onChange, label }: {
  values: readonly T[]; value: T; onChange: (value: T) => void; label: string;
}) {
  const {s,colors} = useUi();
  return <View style={s.row} accessibilityLabel={label}>{values.map(item =>
    <Pressable key={item} accessibilityRole="button" accessibilityLabel={item}
      accessibilityState={{ selected: value === item }} onPress={() => onChange(item)}
      style={({ pressed }) => [s.chip, value === item && s.chipSelected, pressed && s.pressed]}>
      <Text style={[s.chipText, value === item && { color: colors.inverse }]}>{item}</Text>
    </Pressable>)}</View>;
}
export function Header({ title, subtitle }: { title: string; subtitle: string }) {
  const {s} = useUi();
  const { city, setCity } = useApp();
  return <View style={s.header}>
    <View style={s.top}><Text style={s.brand}>jobin.</Text><Text style={s.tag}>DEMO</Text></View>
    <Text style={s.eyebrow}>PERSONAS REALES. TRABAJO REAL.</Text>
    <Text accessibilityRole="header" style={s.h1}>{title}</Text>
    <Text style={s.muted}>{subtitle}</Text>
    <Chips values={["Todas", "Miami", "Orlando"]} value={city} onChange={setCity} label="Filtrar por ciudad" />
  </View>;
}
export function Footer() {
  const {s} = useUi();
  return <View style={s.footer}><Text style={s.eyebrow}>PROFESSIONAL WORK</Text>
    <Text style={s.muted}>Haz lo que amas. Conecta con quienes lo valoran.</Text>
    <Text style={s.muted}>Datos de ejemplo. Los cambios se reinician al cerrar o recargar la app.</Text></View>;
}
export function Screen({ children, title, subtitle }: { children: ReactNode; title: string; subtitle: string }) {
  const {s} = useUi();
  return <SafeAreaView edges={["top", "left", "right"]} style={s.screen}>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.content}>
      <Header title={title} subtitle={subtitle} />{children}<Footer />
    </ScrollView>
  </SafeAreaView>;
}
export function Grid({ children }: { children: ReactNode }) {
  return <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 18 }}>{children}</View>;
}
export function GridItem({ children }: { children: ReactNode }) {
  const { width } = useWindowDimensions();
  return <View style={{ width: width >= 1000 ? "31.5%" : width >= 700 ? "48%" : "100%" }}>{children}</View>;
}
export function Notice({ text, onClose }: { text: string; onClose: () => void }) {
  const {s} = useUi();
  return <View style={s.notice} accessibilityLiveRegion="polite"><Text style={s.text}>{text}</Text>
    <Button title="Cerrar aviso" secondary onPress={onClose} /></View>;
}
