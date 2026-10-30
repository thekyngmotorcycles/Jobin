import { Pressable, Text, View } from "react-native";
import { IconButton } from "./social-ui";
import { FEED_TABS, type FeedTab } from "../lib/feed";
import { useUi } from "./ui";

export function FeedTopBar({ tab, onTab, onPlus, plusLabel, onSearch, overlay = false }: {
  tab: FeedTab; onTab: (tab: FeedTab) => void; onPlus: () => void; plusLabel: string; onSearch: () => void; overlay?: boolean;
}) {
  const { colors } = useUi();
  const ink = overlay ? "#fff" : colors.ink;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 8, gap: 2, backgroundColor: overlay ? "transparent" : colors.paper }}>
      <IconButton icon="add" label={plusLabel} color={ink} onPress={onPlus} size={30} />
      <View style={{ flex: 1, flexDirection: "row", justifyContent: "center", gap: 18 }}>
        {FEED_TABS.map(item => (
          <Pressable key={item} accessibilityRole="tab" accessibilityState={{ selected: tab === item }} onPress={() => onTab(item)}
            style={{ minHeight: 44, justifyContent: "center", borderBottomWidth: tab === item ? 2 : 0, borderBottomColor: ink }}>
            <Text style={{ color: tab === item ? ink : overlay ? "#ffffffb3" : colors.muted, fontSize: 15, fontWeight: tab === item ? "800" : "500" }}>{item}</Text>
          </Pressable>
        ))}
      </View>
      <IconButton icon="search-outline" label="Buscar" color={ink} onPress={onSearch} />
    </View>
  );
}
