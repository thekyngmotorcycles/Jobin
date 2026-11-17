# JShop · Mapbox integration

JShop's existing location selector is preserved. Its implementation now uses:
- Android/iOS: `@rnmapbox/maps` native Mapbox Maps SDK 11.33 via the Expo config plugin.
- Web: Mapbox Light raster tiles rendered in the existing touch map.
- Geocoding: Mapbox Geocoding API v6 globally (supports Argentina, Peru, US, etc.). City suggestions are debounced and only start after three characters.
- Selection confirmation: Mapbox Geocoding **permanent** results before the selected location or recent locations are written to AsyncStorage.
- Existing article filtering: text-matching `location` against the vendor's city. A true geographic radius is **not yet implemented**; that requires listing coordinates and geo-indexed queries.

## Account and EAS credentials (required)

1. Create a public Mapbox token beginning `pk.` at https://console.mapbox.com/account/access-tokens/ .
2. In Expo project `a6befb1a-dc03-45a8-a18c-294643e99434` owned by `proyect-dating`, configure environment **preview** variable `EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN` with the public token. This variable is deliberately exposed in the client bundle; it **must not** be an `sk.` secret.
3. Enable the Mapbox Geocoding API and permanent geocoding billing on the Mapbox account (a valid payment method or enterprise contract may be needed). The app only stores permanent geocoding results. Temporary autocomplete results are never persisted.
4. If your native SDK build setup requests a `MAPBOX_DOWNLOADS_TOKEN`, configure it as a **secret EAS build environment variable**, not in app.json or source control. Only include download credentials when your SDK/build requires them, and never put them in the config plugin's `RNMapboxMapsDownloadToken` option.
5. Build and install a **new Android APK** with the native Mapbox module using `eas build --profile preview --platform android` or the GitHub `expo-development.yml` workflow (commit message containing `[expo-preview]`). Native code is not delivered by OTA updates. Once installed, future JavaScript-only improvements can be OTA updates for that runtime.

Without `EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN`, JShop automatically keeps the existing OpenStreetMap map and Nominatim lookup rather than crashing. The Mapbox SDK still requires the new APK when a public token is configured.

Mapbox documentation: https://rnmapbox.github.io/docs/install and https://docs.mapbox.com/api/search/geocoding/

The location picker does **not** request device GPS access. Moving the map and typing a city are sufficient, so no new precise-location permission is needed.
