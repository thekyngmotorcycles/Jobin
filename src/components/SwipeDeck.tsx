import { useRef, useState } from "react";
import { Animated, PanResponder, Text, View } from "react-native";
import type { Intent } from "../lib/data";
import { professionals } from "../lib/data";
import { filterByCity } from "../lib/domain";
import { useApp } from "../state/AppProvider";
import { Button, Notice, s } from "./ui";

export function SwipeDeck({ city, intent }: { city: string; intent: Intent }) {
  const { expressInterest } = useApp();
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [notice, setNotice] = useState("");
  const position = useRef(new Animated.ValueXY()).current;
  const person = filterByCity(professionals, city).find(p => !dismissed.includes(p.id));
  function decide(like: boolean) {
    if (!person) return;
    if (like) {
      expressInterest(person.id, intent);
      setNotice("Interés guardado en esta sesión. Un match requiere interés mutuo.");
    }
    setDismissed(items => [...items, person.id]);
    position.setValue({ x: 0, y: 0 });
  }
  const responder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 15 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.5,
    onPanResponderMove: (_, gesture) => position.setValue({ x: gesture.dx, y: 0 }),
    onPanResponderRelease: (_, gesture) => {
      if (gesture.dx > 100) decide(true);
      else if (gesture.dx < -100) decide(false);
      else Animated.spring(position, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
    },
    onPanResponderTerminate: () => position.setValue({ x: 0, y: 0 }),
  });
  return <View style={{ gap: 18 }}>
    {!!notice && <Notice text={notice} onClose={() => setNotice("")} />}
    {person ? <View style={{ gap: 18 }}>
      <Animated.View {...responder.panHandlers} style={[s.panel, {
        transform: [{ translateX: position.x }, { rotate: position.x.interpolate({
          inputRange: [-200, 0, 200], outputRange: ["-8deg", "0deg", "8deg"], extrapolate: "clamp",
        }) }],
      }]}>
        <View style={{ height: 220, borderRadius: 12, backgroundColor: person.color, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ fontSize: 90, fontWeight: "900", color: "#ffffff99" }}>{person.initials}</Text>
        </View>
        <Text style={s.tag}>{person.city}</Text><Text style={s.h2}>{person.name}</Text>
        <Text style={s.text}>{person.role}</Text><Text style={s.muted}>{person.description}</Text>
      </Animated.View>
      <Text style={[s.muted, { textAlign: "center" }]}>Desliza a la izquierda para saltar o a la derecha si te interesa.</Text>
      <View style={[s.row, { justifyContent: "center" }]}>
        <Button secondary title="Saltar" onPress={() => decide(false)} />
        <Button title="Me interesa ♡" onPress={() => decide(true)} />
      </View>
    </View> : <View style={s.panel}><Text style={s.h2}>Ya estás al día</Text>
      <Text style={s.muted}>Has visto todas las tarjetas de esta ciudad para {intent.toLowerCase()}.</Text>
      <Button secondary title="Volver a explorar" onPress={() => { setDismissed([]); setNotice(""); }} /></View>}
  </View>;
}
