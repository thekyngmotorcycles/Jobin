import {menuChrome} from "../theme/menu-chrome";
import {JOBEEN_CONTROL,royalHiveLayout} from "../theme/control-metrics";
import {JOBEEN_TYPE,JOBEEN_LINE_HEIGHT,jobeenTypeWidthScale} from "../theme/typography";
import {jobeenTokens} from "../theme/jobeen";
import {jobeenModalTokens} from "../theme/modals";
import { JobinWordmark } from "./JobinWordmark";
import { useCallback, useMemo, type ReactNode, type RefObject } from "react";
import { useTheme } from "../state/ThemeProvider";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions, type NativeScrollEvent, type NativeSyntheticEvent, type StyleProp, type ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApp } from "../state/AppProvider";

// Preserve semantic text sizes; adapt margins and layout to available width.
export function useUi() { const { colors,theme } = useTheme(); const chrome=menuChrome(theme,colors); const jt=jobeenTokens(theme);const modal=jobeenModalTokens(theme);const danger=jobeenModalTokens(theme,"danger"); const { width } = useWindowDimensions();
 const k=jobeenTypeWidthScale(width);const layout=royalHiveLayout(width);
 const fs = useCallback((size: number) => Math.round(size * k), [k]);
 const s = useMemo(() => StyleSheet.create({
  screen: { flex: 1, backgroundColor: jt.bg },
  content: { padding: layout.margin, gap: 16, width: "100%", maxWidth: 1180, alignSelf: "center" },
  header: { gap: 16, marginBottom: 4 },
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 16 },
  brand: { fontSize: fs(28), fontWeight: "900", color: colors.ink, letterSpacing: -1.5 },
  eyebrow: { fontSize: fs(10), letterSpacing: 2, fontWeight: "700", color: colors.muted },
  h1: { fontSize: fs(JOBEEN_TYPE.display), fontFamily: Platform.OS === "android" ? "serif" : "Georgia", fontStyle: "italic", fontWeight: "500", letterSpacing: -1, color: colors.ink },
  h2: { fontSize: fs(JOBEEN_TYPE.headline), fontFamily: Platform.OS === "android" ? "serif" : "Georgia", fontStyle: "italic", fontWeight: "500", color: colors.ink },
  h3: { fontSize: fs(JOBEEN_TYPE.sectionTitle), fontWeight: "700", color: colors.ink },
  text: { fontSize: fs(JOBEEN_TYPE.body), lineHeight: fs(JOBEEN_LINE_HEIGHT.body), color: colors.ink },
  muted: { fontSize: fs(JOBEEN_TYPE.secondary), lineHeight: fs(JOBEEN_LINE_HEIGHT.secondary), color: colors.muted },
  formInput: { color: colors.ink, fontSize: JOBEEN_TYPE.input, lineHeight: JOBEEN_LINE_HEIGHT.input, borderColor: colors.outline, borderWidth: 1, borderRadius: JOBEEN_CONTROL.inputRadius, padding: 12, minHeight: JOBEEN_CONTROL.inputHeight },
  formLabel: { color: colors.ink, fontSize: JOBEEN_TYPE.body, lineHeight: JOBEEN_LINE_HEIGHT.body, fontWeight: "600" },
  row: { flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" },
  panel: { backgroundColor: jt.surface, borderWidth: 1, borderColor: jt.line, borderRadius: JOBEEN_CONTROL.cardRadius, padding: JOBEEN_CONTROL.panelPadding, gap: JOBEEN_CONTROL.panelGap },
  button: { minHeight: JOBEEN_CONTROL.touchTarget, borderRadius: JOBEEN_CONTROL.buttonRadius, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", maxWidth: "100%" },
  buttonText: { color: colors.onPrimary, fontWeight: "700", fontSize: fs(JOBEEN_TYPE.action), lineHeight: fs(JOBEEN_LINE_HEIGHT.action), textAlign: "center", flexShrink: 1 },
  secondary: { backgroundColor: jt.surface, borderWidth: 1, borderColor: colors.outline },
  secondaryText: { color: colors.ink },
  tertiary: { backgroundColor: colors.transparent },
  dangerButton: { backgroundColor: danger.background },
  dangerButtonText: { color: danger.foreground },
  disabledButton: { backgroundColor: colors.disabled, borderColor: colors.disabled },
  disabledButtonText: { color: colors.onDisabled },
  chip: { borderRadius: 24, borderWidth: 1, borderColor: colors.outline, paddingHorizontal: 14, minHeight: JOBEEN_CONTROL.touchTarget, justifyContent: "center", backgroundColor: jt.surface },
  chipSelected: { backgroundColor: colors.ink, borderColor: colors.ink },
  chipText: { fontSize: fs(JOBEEN_TYPE.secondary), color: colors.ink },
  tag: { fontSize: fs(10), fontWeight: "600", color: colors.ink, backgroundColor: colors.accent, alignSelf: "flex-start", paddingVertical: 7, paddingHorizontal: 12, borderRadius: 18, overflow: "hidden" },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  notice: { padding: 16, borderRadius: modal.radius.popover, backgroundColor:modal.surface, gap: 10, borderWidth:1, borderColor:modal.border },
  footer: { paddingVertical: 20, borderTopWidth: 1, borderTopColor: jt.line, gap: 6 },
  pressed: { opacity: 0.82 },
}), [colors, fs, chrome.surface, chrome.border, theme, layout.margin]); return { s, colors, fs, k }; }
export type JobeenButtonVariant="primary"|"secondary"|"tertiary"|"danger";
export function Button({title,onPress,secondary=false,variant,selected,label,disabled=false,busy=false,busyLabel="Procesando…",style}:{
 title:string;onPress:()=>void;secondary?:boolean;variant?:JobeenButtonVariant;selected?:boolean;label?:string;
 disabled?:boolean;busy?:boolean;busyLabel?:string;style?:StyleProp<ViewStyle>;
}){
 const {s}=useUi();const kind=variant??(secondary?"secondary":"primary");const locked=disabled||busy;
 return <Pressable accessibilityRole="button" accessibilityLabel={label??title}
  accessibilityState={{selected,disabled:locked,busy}} disabled={locked} onPress={onPress}
  style={({pressed})=>[s.button,kind==="secondary"&&s.secondary,kind==="tertiary"&&s.tertiary,kind==="danger"&&s.dangerButton,
   style,locked&&s.disabledButton,pressed&&!locked&&s.pressed]}>
  <Text style={[s.buttonText,(kind==="secondary"||kind==="tertiary")&&s.secondaryText,kind==="danger"&&s.dangerButtonText,locked&&s.disabledButtonText]}>{busy?busyLabel:title}</Text>
 </Pressable>;
}
export function Chips<T extends string>({ values, value, onChange, label, getLabel = (item:T) => String(item) }: {
  values: readonly T[]; value: T; onChange: (value: T) => void; label: string; getLabel?: (item:T) => string;
}) {
  const {s,colors} = useUi();
  return <View style={s.row} accessibilityLabel={label}>{values.map(item =>
    <Pressable key={item} accessibilityRole="button" accessibilityLabel={getLabel(item)}
      accessibilityState={{ selected: value === item }} onPress={() => onChange(item)}
      style={({ pressed }) => [s.chip, value === item && s.chipSelected, pressed && s.pressed]}>
      <Text style={[s.chipText, value === item && { color: colors.inverse }]}>{getLabel(item)}</Text>
    </Pressable>)}</View>;
}
export function Header({ title, subtitle, showCity = false, demo = true, plainHeading = false, showBadge = true }: { title: string; subtitle: string; showCity?: boolean; demo?: boolean; plainHeading?:boolean; showBadge?:boolean }) {
  const {s,fs} = useUi();
  const { city, setCity } = useApp();
  return <View style={s.header}>
    <View style={s.top}><JobinWordmark width={120}/>{showBadge&&<Text style={s.tag}>{demo ? "DEMO" : "JOBIN"}</Text>}</View>
    <Text style={s.eyebrow}>PERSONAS REALES. TRABAJO REAL.</Text>
    <Text accessibilityRole="header" style={plainHeading?[s.h3,{fontSize:fs(34),letterSpacing:-1}]:s.h1}>{title}</Text>
    <Text style={s.muted}>{subtitle}</Text>
    {showCity && <Chips values={["Todas", "Miami", "Orlando"]} value={city} onChange={setCity} label="Filtrar por ciudad" />}
  </View>;
}
export function Footer({ demo = true }: { demo?: boolean } = {}) {
  const {s} = useUi();
  return <View style={s.footer}><Text style={s.eyebrow}>PROFESSIONAL WORK</Text>
    <Text style={s.muted}>Haz lo que amas. Conecta con quienes lo valoran.</Text>
    {demo && <Text style={s.muted}>Datos de ejemplo. Los cambios se reinician al cerrar o recargar la app.</Text>}</View>;
}
export function Screen({ children, title, subtitle, showCity = false, demo = true, plainHeading = false, showBadge = true, bottomPadding,hideHeader=false,hideFooter=false,scrollRef,stickyHeaderIndices,onScroll }: { children: ReactNode; title: string; subtitle: string; showCity?: boolean; demo?: boolean; plainHeading?:boolean; showBadge?:boolean; bottomPadding?:number;hideHeader?:boolean;hideFooter?:boolean;scrollRef?:RefObject<ScrollView|null>;stickyHeaderIndices?:number[];onScroll?:(event:NativeSyntheticEvent<NativeScrollEvent>)=>void }) {
  const {s} = useUi();
  return <SafeAreaView edges={["top", "left", "right"]} style={s.screen}>
    <ScrollView ref={scrollRef} keyboardShouldPersistTaps="handled" stickyHeaderIndices={stickyHeaderIndices} onScroll={onScroll} scrollEventThrottle={16} contentContainerStyle={[s.content,bottomPadding!==undefined&&{paddingBottom:bottomPadding}]}>
      {!hideHeader&&<Header title={title} subtitle={subtitle} showCity={showCity} demo={demo} plainHeading={plainHeading} showBadge={showBadge} />}{children}{!hideFooter&&<Footer demo={demo} />}
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
  const {s,colors} = useUi();const {theme}=useTheme();const colorsNotice=menuChrome(theme,colors);
  return <View style={s.notice} accessibilityLiveRegion="polite"><Text style={[s.text,{color:colorsNotice.text}]}>{text}</Text>
    <Button title="Cerrar aviso" secondary onPress={onClose} /></View>;
}
