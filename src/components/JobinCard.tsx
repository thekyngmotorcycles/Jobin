import { useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { Avatar } from "./social-ui";
import { useUi } from "./ui";
import { jobinCardStatus } from "../lib/rules";

export interface CardData {
  name: string;
  role: string;
  years: number;
  employer: string | null;
  rating: number;
  licensed: boolean;
  student?: string;
  avatar?: string;
  profileUrl: string;
}

export function cardLine(card: CardData) {
  const status = card.student ? "STUDENT" : jobinCardStatus(card.employer, card.rating);
  const base = card.student
    ? `${card.name} - ${status} / ${card.student}`
    : `${card.name} - ${status} / ${card.role} / ${card.years} years EXP`;
  return card.employer && !card.student ? `${base} / Working in @${card.employer}` : base;
}

export function JobinCard({ card }: { card: CardData }) {
  const { s, colors } = useUi();
  const [open, setOpen] = useState(false);
  const body = (size: number) => (
    <View style={{ flex: 1, gap: 6 }}>
      <Text style={[s.h3, { fontSize: size }]}>{cardLine(card)}</Text>
      {card.licensed && <Text style={s.muted}>✓ Técnico licenciado verificado</Text>}
    </View>
  );
  return (
    <>
      <Pressable accessibilityRole="button" accessibilityLabel="Open Jobin Card" onPress={() => setOpen(true)}
        style={[s.panel, { flexDirection: "row", gap: 16, alignItems: "flex-start" }]}>
        <View style={{ alignItems: "center" }}>
          <View style={{ width: 84, height: 84, borderRadius: 42, overflow: "hidden", borderWidth: 1, borderColor: colors.line }}>
            <Avatar uri={card.avatar} name={card.name} size={84} />
          </View>
          <View style={{ position: "absolute", right: -4, bottom: -4, backgroundColor: colors.card, borderRadius: 12, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: colors.line }}>
            <Text style={{ color: colors.ink, fontSize: 11, fontWeight: "800" }}>★ {card.rating.toFixed(1)}</Text>
          </View>
        </View>
        {body(15)}
        <View accessibilityLabel="Jobin Card QR code" accessible={false}>
          <QRCode value={card.profileUrl} size={72} color={colors.ink} backgroundColor={colors.card} />
        </View>
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close Jobin Card" onPress={() => setOpen(false)}
          style={{ flex: 1, backgroundColor: "#000a", justifyContent: "center", padding: 24 }}>
          <Pressable onPress={() => {}} style={[s.panel, { gap: 20, alignItems: "center" }]}>
            <Avatar uri={card.avatar} name={card.name} size={140} />
            <Text style={s.h3}>★ {card.rating.toFixed(1)}</Text>
            <Text style={[s.text, { textAlign: "center" }]}>{cardLine(card)}</Text>
            <QRCode value={card.profileUrl} size={180} color={colors.ink} backgroundColor={colors.card} />
            <Text style={s.muted}>Escanea para ver el perfil público y recibir la Jobin Card por mensaje.</Text>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
