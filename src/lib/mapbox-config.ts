/** Mapbox public browser/mobile token. This must not be a secret (sk.) token. */
export const mapboxAccessToken=process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN?.trim()??"";
export const mapboxConfigured=mapboxAccessToken.startsWith("pk.")&&mapboxAccessToken.length>25;
export const mapboxGeocodingBase="https://api.mapbox.com/search/geocode/v6";
