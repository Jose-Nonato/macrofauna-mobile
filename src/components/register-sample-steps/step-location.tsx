import React from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";

interface StepLocationProps {
  locationMode: "gps" | "manual";
  setLocationMode: (mode: "gps" | "manual") => void;
  city: string;
  setCity: (city: string) => void;
  state: string;
  setState: (state: string) => void;
  country: string;
  setCountry: (country: string) => void;
  latitude: string;
  setLatitude: (lat: string) => void;
  longitude: string;
  setLongitude: (lon: string) => void;
}

export default function StepLocation({
  locationMode,
  setLocationMode,
  city,
  setCity,
  state,
  setState,
  country,
  setCountry,
  latitude,
  setLatitude,
  longitude,
  setLongitude,
}: StepLocationProps) {
  const [loadingGPS, setLoadingGPS] = React.useState(false);

  const handleGetGPSLocation = async () => {
    setLoadingGPS(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permissão Negada",
          "Por favor, autorize o acesso ao GPS nas configurações do dispositivo."
        );
        setLoadingGPS(false);
        return;
      }

      const coords = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setLatitude(coords.coords.latitude.toString());
      setLongitude(coords.coords.longitude.toString());

      const [address] = await Location.reverseGeocodeAsync({
        latitude: coords.coords.latitude,
        longitude: coords.coords.longitude,
      });

      if (address) {
        setCity(address.city || address.subregion || "");
        setState(address.region || "");
        setCountry(address.country || "Brasil");
        Alert.alert("Sucesso", "Localização GPS obtida com sucesso!");
      }
    } catch (err) {
      Alert.alert("Erro GPS", "Não foi possível ler as coordenadas de GPS.");
    } finally {
      setLoadingGPS(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.stepTitle}>Passo 4: Localização</Text>
      <Text style={styles.stepDesc}>
        Informe onde a amostra foi coletada em campo:
      </Text>

      {/* Seleção do Modo de Localização */}
      <View style={styles.locationSelector}>
        <TouchableOpacity
          style={[
            styles.selectorBtn,
            locationMode === "gps" && styles.selectorBtnActive,
          ]}
          onPress={() => setLocationMode("gps")}
        >
          <Text
            style={[
              styles.selectorBtnText,
              locationMode === "gps" && styles.selectorBtnTextActive,
            ]}
          >
            Via GPS Nativo
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.selectorBtn,
            locationMode === "manual" && styles.selectorBtnActive,
          ]}
          onPress={() => setLocationMode("manual")}
        >
          <Text
            style={[
              styles.selectorBtnText,
              locationMode === "manual" && styles.selectorBtnTextActive,
            ]}
          >
            Preenchimento Manual
          </Text>
        </TouchableOpacity>
      </View>

      {locationMode === "gps" ? (
        <View style={styles.gpsPanel}>
          <TouchableOpacity
            style={styles.gpsButton}
            onPress={handleGetGPSLocation}
            disabled={loadingGPS}
          >
            {loadingGPS ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Ionicons
                  name="locate-outline"
                  size={20}
                  color="#ffffff"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.gpsButtonText}>Pegar Minhas Coordenadas</Text>
              </>
            )}
          </TouchableOpacity>

          {latitude && longitude ? (
            <View style={styles.gpsDetails}>
              <Text style={styles.gpsText}>
                Lat: {parseFloat(latitude).toFixed(5)}
              </Text>
              <Text style={styles.gpsText}>
                Lon: {parseFloat(longitude).toFixed(5)}
              </Text>
              <Text style={styles.gpsText}>Cidade: {city || "Não localizada"}</Text>
            </View>
          ) : (
            <Text style={styles.gpsHelpText}>
              Clique no botão acima para preencher automaticamente via GPS.
            </Text>
          )}
        </View>
      ) : (
        <View style={styles.manualPanel}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Cidade</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Manaus"
              placeholderTextColor="#9ca3af"
              value={city}
              onChangeText={setCity}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Estado</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: AM"
              placeholderTextColor="#9ca3af"
              value={state}
              onChangeText={setState}
              autoCapitalize="characters"
              maxLength={2}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>País</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Brasil"
              placeholderTextColor="#9ca3af"
              value={country}
              onChangeText={setCountry}
            />
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 8,
  },
  stepDesc: {
    fontSize: 13,
    color: "#6b7280",
    lineHeight: 18,
    marginBottom: 16,
  },
  locationSelector: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    borderRadius: 8,
    padding: 4,
    marginBottom: 20,
  },
  selectorBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 6,
  },
  selectorBtnActive: {
    backgroundColor: "#ffffff",
    boxShadow: "0px 1px 3px rgba(0,0,0,0.05)",
  },
  selectorBtnText: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#475569",
  },
  selectorBtnTextActive: {
    color: "#54A676",
  },
  gpsPanel: {
    alignItems: "center",
    paddingVertical: 20,
  },
  gpsButton: {
    backgroundColor: "#54A676",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    width: "100%",
  },
  gpsButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "bold",
  },
  gpsDetails: {
    width: "100%",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    padding: 16,
    marginTop: 20,
  },
  gpsText: {
    fontSize: 13,
    color: "#334155",
    fontWeight: "600",
    marginBottom: 6,
  },
  gpsHelpText: {
    fontSize: 13,
    color: "#64748b",
    textAlign: "center",
    marginTop: 20,
    lineHeight: 18,
  },
  manualPanel: {},
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#475569",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: "#0f172a",
  },
});
