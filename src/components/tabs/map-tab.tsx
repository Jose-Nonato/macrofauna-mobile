import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
} from "react-native";
import { WebView } from "react-native-webview";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";

interface Sample {
  id: string;
  city: string;
  state: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  sample_score: number;
  sample_density: number;
  animal_quantity: number;
}

export default function MapTab() {
  const [samples, setSamples] = useState<Sample[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSample, setSelectedSample] = useState<Sample | null>(null);
  const [mapHtml, setMapHtml] = useState("");

  useEffect(() => {
    loadSamples();
  }, []);

  async function loadSamples() {
    try {
      setLoading(true);

      // Obter usuário autenticado
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error("Usuário não autenticado");
      }

      // Buscar amostras do usuário
      const { data: samplesData, error: samplesError } = await supabase
        .from("samples")
        .select("*")
        .eq("user_id", userData.user.id)
        .not("latitude", "is", null)
        .not("longitude", "is", null)
        .order("id", { ascending: false });

      if (samplesError) {
        throw samplesError;
      }

      setSamples(samplesData || []);
      generateMapHtml(samplesData || []);
    } catch (error: any) {
      Alert.alert("Erro", "Não foi possível carregar o mapa");
    } finally {
      setLoading(false);
    }
  }

  const generateMapHtml = (samplesData: Sample[]) => {
    const markers = samplesData.map((sample, index) => ({
      lat: sample.latitude,
      lng: sample.longitude,
      title: `${sample.city}, ${sample.state}`,
      score: sample.sample_score?.toFixed(2),
      id: sample.id,
    }));

    const centerLat =
      samplesData.length > 0
        ? samplesData.reduce((sum, s) => sum + (s.latitude || 0), 0) /
          samplesData.length
        : -15.8;
    const centerLng =
      samplesData.length > 0
        ? samplesData.reduce((sum, s) => sum + (s.longitude || 0), 0) /
          samplesData.length
        : -52.26;

    const markersJson = JSON.stringify(markers);

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css" />
        <script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"></script>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { height: 100vh; }
          #map { width: 100%; height: 100%; }
          .custom-marker {
            background-color: #54A676;
            color: white;
            border-radius: 50%;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 3px solid white;
            font-weight: bold;
            font-size: 14px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.3);
          }
          .popup-content {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            font-size: 14px;
            color: #1f2937;
          }
          .popup-title {
            font-weight: 600;
            margin-bottom: 8px;
            color: #1f2937;
          }
          .popup-info {
            margin: 4px 0;
            color: #6b7280;
            font-size: 13px;
          }
          .popup-score {
            margin-top: 8px;
            padding-top: 8px;
            border-top: 1px solid #e5e7eb;
            color: #54A676;
            font-weight: 600;
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          const markers = ${markersJson};
          const map = L.map('map').setView([${centerLat}, ${centerLng}], ${samplesData.length > 0 ? 8 : 4});

          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
          }).addTo(map);

          markers.forEach(marker => {
            const html = \`
              <div class="popup-content">
                <div class="popup-title">\${marker.title}</div>
                <div class="popup-info">Score IQMS: \${marker.score}</div>
                <div class="popup-info">Lat: \${marker.lat.toFixed(4)}, Lng: \${marker.lng.toFixed(4)}</div>
                <div class="popup-score">ID: \${marker.id}</div>
              </div>
            \`;

            const markerDiv = L.divIcon({
              html: '<div class="custom-marker">📍</div>',
              className: '',
              iconSize: [30, 30],
              iconAnchor: [15, 15]
            });

            L.marker([marker.lat, marker.lng], { icon: markerDiv })
              .bindPopup(html)
              .addTo(map);
          });
        </script>
      </body>
      </html>
    `;

    setMapHtml(html);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#54A676" />
        <Text style={styles.loadingText}>Carregando mapa...</Text>
      </View>
    );
  }

  if (samples.length === 0) {
    return (
      <View style={styles.emptyStateContainer}>
        <Ionicons name="map-outline" size={48} color="#d1d5db" />
        <Text style={styles.emptyStateText}>Nenhuma amostra com localização</Text>
        <Text style={styles.emptyStateSubText}>
          Registre uma amostra com GPS para vê-la no mapa
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        source={{ html: mapHtml }}
        style={styles.webview}
        scrollEnabled={true}
      />

      {/* Botão de recarregar */}
      <TouchableOpacity style={styles.refreshButton} onPress={loadSamples}>
        <Ionicons name="refresh" size={24} color="#ffffff" />
      </TouchableOpacity>

      {/* Indicador de amostras */}
      <View style={styles.samplesCountBadge}>
        <Text style={styles.samplesCountText}>
          {samples.length} Amostra{samples.length !== 1 ? "s" : ""}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9fafb",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6b7280",
    fontWeight: "500",
  },
  refreshButton: {
    position: "absolute",
    bottom: 24,
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#54A676",
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
  samplesCountBadge: {
    position: "absolute",
    top: 16,
    left: 16,
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  samplesCountText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f2937",
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9fafb",
  },
  emptyStateText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
  },
  emptyStateSubText: {
    marginTop: 4,
    fontSize: 14,
    color: "#6b7280",
  },
});
