import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Importação das telas das abas modularizadas
import HomeTab from "@/components/tabs/home-tab";
import MapTab from "@/components/tabs/map-tab";
import ProfileTab from "@/components/tabs/profile-tab";
import ReportsTab from "@/components/tabs/reports-tab";

type TabType = "home" | "map" | "reports" | "profile";

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("home");
  const [hasLocation, setHasLocation] = useState(false);
  const [locationTitle, setLocationTitle] = useState(
    "Bem-vindo ao Macrofauna!",
  );
  const [locationSubtitle, setLocationSubtitle] = useState(
    "Seu monitoramento agroflorestal",
  );

  useEffect(() => {
    async function initializeHome() {
      // 1. Verificar Usuário Autenticado
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert("Erro", "Sessão inválida. Por favor, entre novamente.");
        setLoading(false);
        return;
      }

      setLoading(false);

      // 2. Buscar Localização do Dispositivo de forma assíncrona
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          // Permissão negada, mantém o texto de boas-vindas padrão
          return;
        }

        setLocationSubtitle("Buscando GPS...");

        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        const [address] = await Location.reverseGeocodeAsync({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        });

        if (address) {
          const city =
            address.city || address.subregion || "Cidade Desconhecida";
          const state = address.region || "Estado";
          const country = address.country || "Brasil";
          setLocationTitle(`${city}, ${state} - ${country}`);
          setLocationSubtitle("Localização Atual");
          setHasLocation(true);
        } else {
          setLocationTitle("Bem-vindo ao Macrofauna!");
          setLocationSubtitle("Indicador macrofauna");
          setHasLocation(false);
        }
      } catch (error) {
        setLocationTitle("Bem-vindo ao Macrofauna!");
        setLocationSubtitle("Indicador macrofauna");
        setHasLocation(false);
      }
    }

    initializeHome();
  }, []);

  async function handleLogout() {
    Alert.alert("Sair da Conta", "Deseja realmente sair da sua conta?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: async () => {
          setLoading(true);
          const { error } = await supabase.auth.signOut();
          if (error) {
            Alert.alert("Erro ao sair", error.message);
            setLoading(false);
          } else {
            Alert.alert("Sucesso", "Você saiu da conta.");
          }
        },
      },
    ]);
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#54A676" />
      </View>
    );
  }

  // Renderiza o componente modular correspondente à aba selecionada
  const renderTabContent = () => {
    switch (activeTab) {
      case "home":
        return <HomeTab />;
      case "map":
        return <MapTab />;
      case "reports":
        return <ReportsTab />;
      case "profile":
        return <ProfileTab />;
    }
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#54A676" />

      {/* Top Bar (Header) com Localização Dinâmica e Logout Minimalista */}
      <View style={styles.header}>
        <View style={styles.locationContainer}>
          {hasLocation && (
            <Ionicons
              name="location-sharp"
              size={20}
              color="#ffffff"
              style={styles.locationIcon}
            />
          )}
          <View>
            <Text style={styles.locationTitle}>{locationTitle}</Text>
            <Text style={styles.locationSubtitle}>{locationSubtitle}</Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleLogout}
          style={styles.minimalLogoutButton}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={22} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Conteúdo Dinâmico (Telas das Abas Modulares) */}
      <View style={styles.mainContainer}>{renderTabContent()}</View>

      {/* Bottom Navigation (Apenas Ícones) */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab("home")}
          activeOpacity={0.8}
        >
          <Ionicons
            name={activeTab === "home" ? "home" : "home-outline"}
            size={24}
            color={activeTab === "home" ? "#54A676" : "#9ca3af"}
          />
          {activeTab === "home" && <View style={styles.activeDot} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab("map")}
          activeOpacity={0.8}
        >
          <Ionicons
            name={activeTab === "map" ? "map" : "map-outline"}
            size={24}
            color={activeTab === "map" ? "#54A676" : "#9ca3af"}
          />
          {activeTab === "map" && <View style={styles.activeDot} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab("reports")}
          activeOpacity={0.8}
        >
          <Ionicons
            name={
              activeTab === "reports"
                ? "document-text"
                : "document-text-outline"
            }
            size={24}
            color={activeTab === "reports" ? "#54A676" : "#9ca3af"}
          />
          {activeTab === "reports" && <View style={styles.activeDot} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab("profile")}
          activeOpacity={0.8}
        >
          <Ionicons
            name={activeTab === "profile" ? "person" : "person-outline"}
            size={24}
            color={activeTab === "profile" ? "#54A676" : "#9ca3af"}
          />
          {activeTab === "profile" && <View style={styles.activeDot} />}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: "#54A676",
    boxShadow: "0px 2px 4px rgba(0,0,0,0.08)",
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationIcon: {
    marginRight: 10,
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ffffff",
  },
  locationSubtitle: {
    fontSize: 12,
    color: "#e8f5e9",
    fontWeight: "500",
  },
  minimalLogoutButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  mainContainer: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  bottomNav: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderColor: "#f3f4f6",
    backgroundColor: "#ffffff",
    height: 60,
    alignItems: "center",
    justifyContent: "space-around",
    paddingBottom: Platform.OS === "ios" ? 10 : 0,
  },
  navItem: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    height: "100%",
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#54A676",
    marginTop: 4,
    position: "absolute",
    bottom: 6,
  },
});
