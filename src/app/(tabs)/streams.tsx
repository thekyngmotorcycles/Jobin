import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { BottomSheet } from "../../components/social-ui";
import { StreamGrid } from "../../components/StreamGrid";
import { FeedTopBar } from "../../components/FeedTopBar";
import { Button, Notice, useUi } from "../../components/ui";
import { browseStreams } from "../../lib/streams";
import { type FeedTab } from "../../lib/feed";
import { canGoLive, LIVE_CONSENT, type Strikes } from "../../lib/rules";
import { useApp } from "../../state/AppProvider";

const DEMO_STRIKES: Strikes = { count: 0, bannedUntil: null };

export default function Live() {
  const { s } = useUi();
  const { city } = useApp();
  const [tab, setTab] = useState<FeedTab>("Local");
  const [consent, setConsent] = useState(false);
  const [notice, setNotice] = useState("");
  const rooms = browseStreams(tab === "Local" ? "Nearby" : "Popular", city);

  function startLive() {
    setConsent(false);
    if (!canGoLive(DEMO_STRIKES, Date.now(), null)) {
      setNotice("Tu cuenta no puede transmitir en este momento.");
      return;
    }
    router.push("/live");
  }

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={s.screen}>
      <FeedTopBar tab={tab} onTab={setTab} plusLabel="Iniciar live" onPlus={() => setConsent(true)} onSearch={() => router.push({ pathname: "/search", params: { mode: "live" } })} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        {!!notice && <Notice text={notice} onClose={() => setNotice("")} />}
        <StreamGrid rooms={rooms} />
        {rooms.length === 0 && <Text style={s.muted}>No hay lives en tu zona ahora mismo.</Text>}
      </ScrollView>
      <BottomSheet visible={consent} onClose={() => setConsent(false)} title="Antes de transmitir">
        <View style={{ gap: 18, paddingVertical: 16 }}>
          <Text style={s.text}>{LIVE_CONSENT}</Text>
          <Text style={s.muted}>Si trabajas para una empresa, debe tenerte aprobado como empleado en Jobin. Si una empresa denuncia que te haces pasar por su empleado, se aplicará un strike grave; con dos strikes la cuenta se bloquea un año.</Text>
          <Button title="Entiendo y acepto" onPress={startLive} />
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
}
