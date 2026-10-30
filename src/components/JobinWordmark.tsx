import { Image, View, type StyleProp, type ViewStyle } from "react-native";

type Props = { width?: number; variant?: "plaque" | "white" | "ink"; style?: StyleProp<ViewStyle> };
const sources = {
 plaque: require("../../assets/images/jobin-wordmark-black.png"),
 white: require("../../assets/images/jobin-wordmark-white.png"),
 ink: require("../../assets/images/jobin-wordmark-ink.png"),
};
/** Outlined artwork; no device font substitution or runtime font download. */
export function JobinWordmark({ width = 112, variant = "plaque", style }: Props) {
 return <View style={[{ width, maxWidth: "100%", aspectRatio: 2.14, alignSelf: "center" }, style]}>
  <Image source={sources[variant]} accessibilityLabel="Jobin" accessibilityRole="image"
   resizeMode="contain" style={{ width: "100%", height: "100%" }} />
 </View>;
}
