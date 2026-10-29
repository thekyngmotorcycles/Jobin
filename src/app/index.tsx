import { FlatList, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ProfessionalCard } from "../components/ProfessionalCard";
import { Footer, Header, s } from "../components/ui";
import { professionals } from "../lib/data";
import { filterByCity } from "../lib/domain";
import { useApp } from "../state/AppProvider";

export default function Discover() {
  const { city } = useApp();
  const { width } = useWindowDimensions();
  const columns = width >= 1000 ? 3 : width >= 700 ? 2 : 1;
  return <SafeAreaView edges={["top", "left", "right"]} style={s.screen}>
    <FlatList key={columns} numColumns={columns} data={filterByCity(professionals, city)}
      keyExtractor={item => item.id} contentContainerStyle={s.content}
      columnWrapperStyle={columns > 1 ? { gap: 18 } : undefined}
      ListHeaderComponent={<Header title="Tu trabajo habla por ti." subtitle="Descubre lo que hacen. Conoce a quienes lo hacen posible." />}
      ListFooterComponent={<Footer />}
      renderItem={({ item }) => <View style={{ width: columns === 1 ? "100%" : columns === 2 ? "48%" : "31.5%" }}><ProfessionalCard person={item} /></View>}
    />
  </SafeAreaView>;
}
