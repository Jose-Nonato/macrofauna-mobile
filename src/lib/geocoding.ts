import { Platform } from "react-native";
import * as Location from "expo-location";

export interface ReverseGeocodeResult {
  city: string;
  state: string;
  country: string;
}

export interface GeocodeResult {
  latitude: number;
  longitude: number;
}

// expo-location não implementa geocodeAsync/reverseGeocodeAsync na web
// (lança "Geocoder service is not available for this device"), pois depende
// do geocoder nativo do SO. Na web usamos a API pública do Nominatim
// (OpenStreetMap) como alternativa. Uso leve/esporádico (1 req por ação do
// usuário) é compatível com a política de uso do Nominatim; para uso em
// produção com volume maior, considere um provedor com chave de API.
const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";

export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<ReverseGeocodeResult | null> {
  if (Platform.OS === "web") {
    const url = `${NOMINATIM_BASE}/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&accept-language=pt-BR`;
    const response = await fetch(url);
    const json = await response.json();
    const addr = json?.address;
    if (!addr) return null;
    return {
      city: addr.city || addr.town || addr.village || addr.municipality || addr.county || "",
      state: addr.state || "",
      country: addr.country || "",
    };
  }

  const [address] = await Location.reverseGeocodeAsync({ latitude, longitude });
  if (!address) return null;
  return {
    city: address.city || address.subregion || "",
    state: address.region || "",
    country: address.country || "",
  };
}

export async function geocode(addressQuery: string): Promise<GeocodeResult | null> {
  if (Platform.OS === "web") {
    const url = `${NOMINATIM_BASE}/search?format=json&limit=1&q=${encodeURIComponent(addressQuery)}`;
    const response = await fetch(url);
    const json = await response.json();
    if (json && json.length > 0) {
      return { latitude: parseFloat(json[0].lat), longitude: parseFloat(json[0].lon) };
    }
    return null;
  }

  const result = await Location.geocodeAsync(addressQuery);
  if (result && result.length > 0) {
    return { latitude: result[0].latitude, longitude: result[0].longitude };
  }
  return null;
}
