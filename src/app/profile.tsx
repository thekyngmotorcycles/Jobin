import { useState } from "react";
import { KeyboardAvoidingView, Platform, Text, TextInput, View } from "react-native";
import { Button, Chips, Notice, Screen, colors, s } from "../components/ui";
import type { Relationship } from "../lib/data";
import { useApp } from "../state/AppProvider";

const statuses: readonly Relationship[] = ["Prefiero no decirlo", "Soltero/a", "Casado/a", "En una relación"];
export default function Profile() {
  const { name, setName, relationship, setRelationship, saved } = useApp();
  const [draftName, setDraftName] = useState(name);
  const [draftRelationship, setDraftRelationship] = useState(relationship);
  const [notice, setNotice] = useState("");
  function save() {
    if (!draftName.trim()) { setNotice("Escribe tu nombre para guardar el perfil."); return; }
    setName(draftName.trim()); setRelationship(draftRelationship);
    setNotice("Perfil actualizado en esta sesión de demostración.");
  }
  return <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
    <Screen title="Tu historia empieza aquí." subtitle="Haz espacio para tu talento y tus próximas conexiones.">
      {!!notice && <Notice text={notice} onClose={() => setNotice("")} />}
      <View style={[s.panel, { maxWidth: 650, width: "100%", alignSelf: "center" }]}>
        <Text style={s.h2}>{name ? "Hola, " + name : "Tu perfil profesional"}</Text>
        <Text style={s.text}>Nombre público</Text>
        <TextInput accessibilityLabel="Nombre público" placeholder="¿Cómo te llamas?" placeholderTextColor={colors.muted}
          value={draftName} onChangeText={setDraftName} maxLength={80} autoComplete="name" autoCapitalize="words" returnKeyType="done" onSubmitEditing={save}
          style={{ minHeight: 48, padding: 14, borderWidth: 1, borderColor: colors.line, borderRadius: 10, color: colors.ink, backgroundColor: colors.paper }} />
        <Text style={s.text}>Estado sentimental (opcional)</Text>
        <Chips values={statuses} value={draftRelationship} onChange={setDraftRelationship} label="Estado sentimental" />
        <Text style={s.muted}>Este dato no determina si puedes hacer amistades o conexiones profesionales.</Text>
        <Button title="Guardar perfil demo" onPress={save} />
        <Text style={s.muted}>{saved.length} profesionales guardados en esta sesión.</Text>
      </View>
    </Screen>
  </KeyboardAvoidingView>;
}
