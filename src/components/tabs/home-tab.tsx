import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import RegisterSampleModal from "../register-sample-modal";

interface Sample {
  id: string;
  user_id: string;
  sample_score: number | null;
  sample_density: number | null;
  animal_quantity: number | null;
  country: string | null;
  state: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  deleted: boolean;
}

export default function HomeTab() {
  const [samples, setSamples] = useState<Sample[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  // Estados dos Filtros
  const [filterCity, setFilterCity] = useState("");
  const [filterState, setFilterState] = useState("");
  const [filterCountry, setFilterCountry] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");

  const parseLocalDate = (dateStr: string) => {
    const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const match = dateStr.match(regex);
    if (match) {
      const day = match[1];
      const month = match[2];
      const year = match[3];
      return `${year}-${month}-${day}`;
    }
    return null;
  };

  async function fetchSamples() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase
        .from("samples")
        .select("*")
        .eq("user_id", user.id)
        .eq("deleted", false);

      // Aplicar filtros dinâmicos se preenchidos
      if (filterCity.trim()) {
        query = query.ilike("city", `%${filterCity.trim()}%`);
      }
      if (filterState.trim()) {
        query = query.ilike("state", `%${filterState.trim()}%`);
      }
      if (filterCountry.trim()) {
        query = query.ilike("country", `%${filterCountry.trim()}%`);
      }

      if (filterStartDate.trim()) {
        const parsedStart = parseLocalDate(filterStartDate.trim());
        if (parsedStart) {
          query = query.gte("created_at", `${parsedStart}T00:00:00.000Z`);
        } else {
          Alert.alert(
            "Data Inválida",
            "Por favor, digite a data inicial no formato DD/MM/AAAA."
          );
          setLoading(false);
          setRefreshing(false);
          return;
        }
      }

      if (filterEndDate.trim()) {
        const parsedEnd = parseLocalDate(filterEndDate.trim());
        if (parsedEnd) {
          query = query.lte("created_at", `${parsedEnd}T23:59:59.999Z`);
        } else {
          Alert.alert(
            "Data Inválida",
            "Por favor, digite a data final no formato DD/MM/AAAA."
          );
          setLoading(false);
          setRefreshing(false);
          return;
        }
      }

      const { data, error } = await query.order("created_at", {
        ascending: false,
      });

      if (error) {
        console.error("Erro ao buscar samples:", error.message);
      } else {
        setSamples(data || []);
      }
    } catch (err) {
      console.error("Erro inesperado:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchSamples();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchSamples();
  };

  const handleClearFilters = async () => {
    setFilterCity("");
    setFilterState("");
    setFilterCountry("");
    setFilterStartDate("");
    setFilterEndDate("");

    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("samples")
        .select("*")
        .eq("user_id", user.id)
        .eq("deleted", false)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Erro ao limpar filtros:", error.message);
      } else {
        setSamples(data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch (error) {
      return dateString;
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#54A676" />
        <Text style={styles.loadingText}>Carregando amostras...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Cabeçalho de Ações e Título */}
      <View style={styles.headerSection}>
        <Text style={styles.headerTitle}>Últimas amostras registradas</Text>
        <Text style={styles.headerSubtitle}>
          Acompanhe e filtre os dados de macrofauna coletados em campo
        </Text>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.registerButton}
            onPress={() => setModalVisible(true)}
            activeOpacity={0.8}
          >
            <Ionicons
              name="add-circle"
              size={20}
              color="#ffffff"
              style={styles.buttonIcon}
            />
            <Text style={styles.registerButtonText}>Registrar Amostra</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              showFilters && styles.filterButtonActive,
            ]}
            onPress={() => setShowFilters(!showFilters)}
            activeOpacity={0.8}
          >
            <Ionicons
              name={showFilters ? "funnel" : "funnel-outline"}
              size={18}
              color={showFilters ? "#ffffff" : "#4b5563"}
              style={styles.buttonIcon}
            />
            <Text
              style={[
                styles.filterButtonText,
                showFilters && styles.filterButtonTextActive,
              ]}
            >
              Filtrar
            </Text>
          </TouchableOpacity>
        </View>

        {showFilters && (
          <View style={styles.filterPanel}>
            <Text style={styles.filterPanelTitle}>Filtros Avançados</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Cidade</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Santarém"
                placeholderTextColor="#9ca3af"
                value={filterCity}
                onChangeText={setFilterCity}
              />
            </View>

            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 12 }]}>
                <Text style={styles.inputLabel}>Estado</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: PA"
                  placeholderTextColor="#9ca3af"
                  value={filterState}
                  onChangeText={setFilterState}
                  autoCapitalize="characters"
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>País</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Brasil"
                  placeholderTextColor="#9ca3af"
                  value={filterCountry}
                  onChangeText={setFilterCountry}
                />
              </View>
            </View>

            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 12 }]}>
                <Text style={styles.inputLabel}>Data Inicial</Text>
                <TextInput
                  style={styles.input}
                  placeholder="DD/MM/AAAA"
                  placeholderTextColor="#9ca3af"
                  value={filterStartDate}
                  onChangeText={setFilterStartDate}
                  keyboardType="numeric"
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Data Final</Text>
                <TextInput
                  style={styles.input}
                  placeholder="DD/MM/AAAA"
                  placeholderTextColor="#9ca3af"
                  value={filterEndDate}
                  onChangeText={setFilterEndDate}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.filterActions}>
              <TouchableOpacity
                style={styles.clearButton}
                onPress={handleClearFilters}
                activeOpacity={0.8}
              >
                <Text style={styles.clearButtonText}>Limpar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.applyButton}
                onPress={() => {
                  setLoading(true);
                  fetchSamples();
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.applyButtonText}>Aplicar Filtros</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      <FlatList
        data={samples}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={["#54A676"]}
          />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="documents-outline" size={64} color="#9ca3af" />
            <Text style={styles.emptyTitle}>Nenhuma amostra encontrada</Text>
            <Text style={styles.emptyDesc}>
              Não foram encontradas amostras com os filtros selecionados.
            </Text>
            <TouchableOpacity
              style={styles.reloadButton}
              onPress={handleClearFilters}
            >
              <Text style={styles.reloadButtonText}>Limpar Filtros</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            {/* Linha principal: Score no topo esquerdo, Data de criação no topo direito */}
            <View style={styles.cardHeader}>
              <View style={styles.scoreContainer}>
                <Text style={styles.scoreLabel}>Score</Text>
                <Text style={styles.scoreValue}>
                  {item.sample_score !== null
                    ? item.sample_score.toFixed(1)
                    : "N/A"}
                </Text>
              </View>

              <View style={styles.dateContainer}>
                <Ionicons
                  name="calendar-outline"
                  size={14}
                  color="#6b7280"
                  style={{ marginRight: 4 }}
                />
                <Text style={styles.cardDate}>
                  {formatDate(item.created_at)}
                </Text>
              </View>
            </View>

            {/* Localização abaixo do Score, no formato: Cidade, Estado - País */}
            <View style={styles.locationContainer}>
              <Ionicons
                name="location-outline"
                size={15}
                color="#54A676"
                style={styles.locationIcon}
              />
              <Text style={styles.cardLocation} numberOfLines={1}>
                {item.city && item.state && item.country
                  ? `${item.city}, ${item.state} - ${item.country}`
                  : item.city && item.state
                  ? `${item.city}, ${item.state}`
                  : "Local não informado"}
              </Text>
            </View>

            <View style={styles.divider} />

            {/* Densidade de Amostras e Quantidade de Animais abaixo da localização */}
            <View style={styles.cardBody}>
              <View style={styles.bodyItem}>
                <Ionicons name="analytics" size={16} color="#54A676" />
                <Text style={styles.itemLabel}>Densidade:</Text>
                <Text style={styles.itemValue}>
                  {item.sample_density !== null
                    ? `${item.sample_density.toFixed(1)}/m²`
                    : "N/A"}
                </Text>
              </View>

              <View style={styles.bodyItem}>
                <Ionicons name="bug" size={16} color="#54A676" />
                <Text style={styles.itemLabel}>Animais:</Text>
                <Text style={styles.itemValue}>
                  {item.animal_quantity !== null
                    ? `${item.animal_quantity} un`
                    : "0 un"}
                </Text>
              </View>
            </View>
          </View>
        )}
      />

      <RegisterSampleModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSuccess={fetchSamples}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9fafb",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#4b5563",
    fontWeight: "500",
  },
  headerSection: {
    backgroundColor: "#ffffff",
    padding: 16,
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 16,
    lineHeight: 18,
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  registerButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#54A676",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    marginRight: 12,
    justifyContent: "center",
  },
  buttonIcon: {
    marginRight: 6,
  },
  registerButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "bold",
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d1d5db",
    backgroundColor: "#ffffff",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: "center",
  },
  filterButtonActive: {
    backgroundColor: "#54A676",
    borderColor: "#54A676",
  },
  filterButtonText: {
    color: "#374151",
    fontSize: 14,
    fontWeight: "bold",
  },
  filterButtonTextActive: {
    color: "#ffffff",
  },
  filterPanel: {
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  filterPanelTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#374151",
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4b5563",
    marginBottom: 4,
  },
  input: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: "#1f2937",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  rowInputs: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  filterActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 16,
  },
  clearButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: 12,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  clearButtonText: {
    color: "#4b5563",
    fontSize: 13,
    fontWeight: "bold",
  },
  applyButton: {
    backgroundColor: "#54A676",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: "center",
  },
  applyButtonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "bold",
  },
  listContent: {
    padding: 16,
    paddingBottom: 24,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#4b5563",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 13,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 20,
  },
  reloadButton: {
    backgroundColor: "#54A676",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  reloadButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "bold",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    boxShadow: "0px 2px 4px rgba(0,0,0,0.02)",
    borderWidth: 1,
    borderColor: "#f3f4f6",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  scoreContainer: {
    backgroundColor: "#e8f5e9",
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#c8e6c9",
  },
  scoreLabel: {
    fontSize: 9,
    color: "#2e7d32",
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  scoreValue: {
    fontSize: 16,
    fontWeight: "900",
    color: "#2e7d32",
    marginTop: 1,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardDate: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#4b5563",
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },
  locationIcon: {
    marginRight: 6,
  },
  cardLocation: {
    fontSize: 14,
    color: "#1f2937",
    fontWeight: "600",
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: "#f3f4f6",
    marginVertical: 12,
  },
  cardBody: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  bodyItem: {
    flexDirection: "row",
    alignItems: "center",
    width: "48%",
  },
  itemLabel: {
    fontSize: 13,
    color: "#4b5563",
    marginLeft: 6,
    fontWeight: "500",
  },
  itemValue: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#1f2937",
    marginLeft: 4,
  },
});
