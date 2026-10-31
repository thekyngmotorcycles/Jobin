import { useId, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import QRCode from "react-native-qrcode-svg";
import { Avatar } from "./social-ui";
import { Button, useUi } from "./ui";
import { useTheme, type ThemeName } from "../state/ThemeProvider";
import { displayedRating, jcardTier, sealRows, type CardData } from "../lib/jcard";
import { jcardCommon, jcardLayout, jcardTokens } from "../theme/jcard";

export type { CardData } from "../lib/jcard";

function CardFace({ card, theme, expanded = false }: { card: CardData; theme: ThemeName; expanded?: boolean }) {
  const { s, fs } = useUi();
  const { fontScale } = useWindowDimensions();
  const [contentWidth, setContentWidth] = useState(0);
  const gradientId = "jcard" + useId().replace(/[^a-zA-Z0-9]/g, "");
  const finish = jcardTokens(theme, jcardTier(card.rating, card.reviewCount));
  const rating = displayedRating(card.rating, card.reviewCount);
  const rows = sealRows(card.seals);
  const columns = Math.max(1, ...rows.map(row => row.length));
  const sealWidth = Math.max(Math.max(jcardLayout.minimumSealWidth, ...card.seals.map(seal => seal.label.length * 6 + 8)) * fontScale, (contentWidth - (columns - 1) * jcardLayout.gap) / columns);
  const bodySize = Math.max(12, fs(expanded ? 14 : 13));
  const lineStyle = { color:finish.text, fontSize:bodySize, lineHeight:bodySize * 1.5 };
  return <View style={[s.panel, { padding:0, gap:0, borderRadius:jcardLayout.radius, borderColor:finish.line, backgroundColor:finish.start, overflow:"hidden" }]}>
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" accessible={false} pointerEvents="none">
      <Defs><LinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor={finish.start}/><Stop offset="100%" stopColor={finish.end}/>
      </LinearGradient></Defs>
      <Rect width="100%" height="100%" fill={"url(#" + gradientId + ")"}/>
    </Svg>
    <View style={{ padding:jcardLayout.padding, gap:14 }}>
      <View style={{ paddingTop:Math.max(22, 20 * fontScale), flexDirection:"row", alignItems:"flex-start", justifyContent:"space-between" }}>
        <Text accessibilityRole="header" style={[s.h3, { position:"absolute", top:0, left:0, right:0, textAlign:"center", fontSize:Math.max(13,fs(14)), letterSpacing:1.5, color:finish.text }]}>JCard</Text>
        <View style={{ width:jcardLayout.avatar + 8, height:jcardLayout.qr + 8 }}>
          <Avatar uri={card.avatar} name={card.name} size={jcardLayout.avatar}/>
          <View style={{ position:"absolute", right:0, top:jcardLayout.avatar - 16, borderRadius:12, paddingHorizontal:6, paddingVertical:3, backgroundColor:finish.sealFill, borderWidth:1, borderColor:finish.line }}>
            <Text accessibilityLabel={rating === null ? "Sin reseñas" : rating.toFixed(1) + " de 5 estrellas"} style={{ color:finish.sealText, fontSize:11, fontWeight:"700" }}>
              {rating === null ? "NEW" : "★ " + rating.toFixed(1)}
            </Text>
          </View>
        </View>
        <View accessible accessibilityRole="image" accessibilityLabel="QR del perfil" style={{ backgroundColor:jcardCommon.qrPaper, padding:jcardLayout.qrQuietZone, borderRadius:6 }}>
          <QRCode value={card.profileUrl} size={jcardLayout.qr} color={jcardCommon.qrInk} backgroundColor={jcardCommon.qrPaper}/>
        </View>
      </View>

      <View style={{ gap:5 }}>
        <Text textBreakStrategy="simple" android_hyphenationFrequency="none" style={[s.h3, { color:finish.text, fontSize:Math.max(13,fs(expanded ? 16 : 14)), lineHeight:Math.max(21,fs(expanded ? 24 : 22)) }]}>
          {card.name} - @{card.handle}
        </Text>
        <Text style={{ color:finish.text, fontWeight:"700", fontSize:11, letterSpacing:1.2 }}>{card.status}</Text>
        <Text textBreakStrategy="simple" android_hyphenationFrequency="none" style={lineStyle}>{card.role}{card.inAcademy ? " - In academy" : ""}{card.inAcademy && card.trainingVerified ? " ✓" : ""}</Text>
        {!card.inAcademy && <Text style={lineStyle}>{card.years} años de experiencia</Text>}
        {card.status === "ACTIVE" && card.employer && <Text textBreakStrategy="simple" android_hyphenationFrequency="none" style={lineStyle}>Working in @{card.employer}</Text>}
        <Text textBreakStrategy="simple" android_hyphenationFrequency="none" style={[lineStyle, { color:finish.secondary }]}>
          {card.languages.map(language => language.name + " " + language.fluency + "%").join(" · ")}
        </Text>
      </View>

      <View onLayout={event => setContentWidth(event.nativeEvent.layout.width)} style={{ paddingTop:12, borderTopWidth:1, borderTopColor:finish.line }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} accessibilityLabel="Sellos de ejemplo; desliza horizontalmente si necesitas más espacio" contentContainerStyle={{ minWidth:"100%" }}>
          <View style={{ gap:jcardLayout.gap }}>
            {rows.map((row, index) => <View key={index} style={{ flexDirection:"row", gap:jcardLayout.gap }}>
              {row.map(seal => <View key={seal.id} accessible accessibilityLabel={seal.profession + (seal.verified ? ", verificado" : ", sin verificar")}
                style={{ width:sealWidth, minHeight:43, paddingVertical:5, paddingHorizontal:2, gap:3, alignItems:"center", justifyContent:"center", borderRadius:7, borderWidth:1, borderStyle:seal.verified ? "solid" : "dashed", borderColor:seal.verified ? finish.sealFill : finish.pendingLine, backgroundColor:seal.verified ? finish.sealFill : finish.pendingFill }}>
                <View style={{ flexDirection:"row", alignItems:"center", gap:2 }}>
                  <Ionicons name={seal.icon} size={12} color={seal.verified ? finish.sealText : finish.pendingText}/>
                  {seal.verified && <Ionicons name="checkmark" size={9} color={finish.sealText}/>}
                </View>
                <Text textBreakStrategy="simple" android_hyphenationFrequency="none" style={{ fontSize:9, lineHeight:13, fontWeight:"600", color:seal.verified ? finish.sealText : finish.pendingText }}>{seal.label}</Text>
              </View>)}
            </View>)}
          </View>
        </ScrollView>
      </View>
    </View>
  </View>;
}

export function JobinCard({ card, previewTheme }: { card: CardData; previewTheme?: ThemeName }) {
  const { theme } = useTheme();
  const { s } = useUi();
  const [open, setOpen] = useState(false);
  const cardTheme = previewTheme ?? theme;
  return <>
    <Pressable accessibilityRole="button" accessibilityLabel={"Ampliar JCard de " + card.name}
      accessibilityHint="Muestra los mismos datos y el código QR en una vista ampliada"
      onPress={() => setOpen(true)} style={({pressed}) => ({ width:"100%", maxWidth:520, alignSelf:"center", opacity:pressed ? 0.9 : 1 })}>
      <CardFace card={card} theme={cardTheme}/>
    </Pressable>
    <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
      <SafeAreaView style={{ flex:1, backgroundColor:jcardCommon.scrim }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Cerrar JCard" onPress={() => setOpen(false)} style={StyleSheet.absoluteFill}/>
        <ScrollView contentContainerStyle={{ flexGrow:1, justifyContent:"center", alignItems:"center", padding:12 }} showsVerticalScrollIndicator={false}>
          <View accessibilityViewIsModal style={{ width:"100%", maxWidth:680, gap:16 }}>
            <CardFace card={card} theme={cardTheme} expanded/>
            <View style={{ padding:12, borderRadius:12, backgroundColor:jcardCommon.qrPaper, gap:12 }}>
              <Text style={[s.muted, { color:jcardCommon.qrInk, textAlign:"center" }]}>Escanea el QR para ver la JCard profesional.</Text>
              <Button title="Cerrar JCard" secondary onPress={() => setOpen(false)}/>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  </>;
}
