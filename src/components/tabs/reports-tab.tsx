import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  generateReport,
  generateCSV,
  getLocationOptions,
  getSamplesWithInsects,
  ReportData,
  LocationOptions,
} from "@/lib/reportService";
import { Ionicons } from "@expo/vector-icons";

const taxonLabels: Record<string, string> = {
  earthworm: "Minhoca",
  ant: "Formiga",
  isoptera: "Cupim",
  blattaria: "Barata",
  coleoptera: "Besouro",
  arachnida: "Aranha",
  diplopoda: "Milípede",
  chilopoda: "Centípede",
  hemiptera: "Hemíptera",
  lepidoptera: "Borboleta",
  gasteropoda: "Gastrópode",
  dermaptera: "Tesourinha",
  others: "Outros",
};

export default function ReportsTab() {
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [locationOptions, setLocationOptions] = useState<LocationOptions | null>(
    null
  );

  // Filtros
  const [country, setCountry] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Pickers
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  useEffect(() => {
    loadLocationOptions();
  }, []);

  async function loadLocationOptions() {
    try {
      setLoading(true);
      const options = await getLocationOptions();
      setLocationOptions(options);
      if (options.countries.length > 0) {
        setCountry(options.countries[0]);
      }
      generateInitialReport();
    } catch (error: any) {
      Alert.alert("Erro", "Não foi possível carregar as opções de filtro");
    } finally {
      setLoading(false);
    }
  }

  function handleCountryChange(newCountry: string) {
    setCountry(newCountry);
    const stateList = locationOptions?.states[newCountry] || [];
    setState(stateList.length > 0 ? stateList[0] : "");
    setCity("");
  }

  function handleStateChange(newState: string) {
    setState(newState);
    const stateKey = `${country}-${newState}`;
    const cityList = locationOptions?.cities[stateKey] || [];
    setCity(cityList.length > 0 ? cityList[0] : "");
  }

  function handleClearFilters() {
    if (locationOptions?.countries.length) {
      setCountry(locationOptions.countries[0]);
      setState("");
      setCity("");
    }
    setStartDate("");
    setEndDate("");
  }

  async function generateInitialReport() {
    try {
      setLoading(true);
      const data = await generateReport();
      setReportData(data);
    } catch (error: any) {
      Alert.alert("Erro", "Não foi possível gerar o relatório");
    } finally {
      setLoading(false);
    }
  }

  async function handleApplyFilters() {
    try {
      setGenerating(true);
      const data = await generateReport(
        country || undefined,
        state || undefined,
        city || undefined,
        startDate || undefined,
        endDate || undefined
      );
      setReportData(data);
    } catch (error: any) {
      Alert.alert("Erro", "Não foi possível gerar o relatório");
    } finally {
      setGenerating(false);
    }
  }

  function handleStartDateChange(event: any, selectedDate?: Date) {
    if (Platform.OS === "android") {
      setShowStartDatePicker(false);
    }
    if (selectedDate) {
      const dateString = selectedDate.toISOString().split("T")[0];
      setStartDate(dateString);
    }
  }

  function handleEndDateChange(event: any, selectedDate?: Date) {
    if (Platform.OS === "android") {
      setShowEndDatePicker(false);
    }
    if (selectedDate) {
      const dateString = selectedDate.toISOString().split("T")[0];
      setEndDate(dateString);
    }
  }

  async function handleExportCSV() {
    try {
      if (!reportData) {
        Alert.alert("Erro", "Nenhum relatório para exportar");
        return;
      }

      setGenerating(true);

      const samplesData = await getSamplesWithInsects(
        country || undefined,
        state || undefined,
        city || undefined,
        startDate || undefined,
        endDate || undefined
      );

      const csvContent = generateCSV(samplesData);

      // Criar arquivo CSV temporário
      const fileName = `relatorio_macrofauna_${new Date().getTime()}.csv`;
      const filePath = `${FileSystem.documentDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(filePath, csvContent);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(filePath, {
          mimeType: "text/csv",
          dialogTitle: "Exportar Relatório Macrofauna",
        });
      } else {
        Alert.alert("Info", "Compartilhamento não disponível neste dispositivo");
      }
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Não foi possível exportar o relatório");
    } finally {
      setGenerating(false);
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 0.75) return "#10b981";
    if (score >= 0.5) return "#f59e0b";
    if (score >= 0.25) return "#ef4444";
    return "#7f1d1d";
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#54A676" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Relatórios</Text>
          <Text style={styles.subtitle}>Análise de Dados de Macrofauna</Text>
        </View>

        {/* Filtros */}
        {locationOptions && (
          <View style={styles.filtersCard}>
            <View style={styles.filterHeaderRow}>
              <Text style={styles.sectionTitle}>Filtros</Text>
              <TouchableOpacity
                onPress={handleClearFilters}
                style={styles.clearButton}
              >
                <Ionicons name="refresh" size={18} color="#54A676" />
                <Text style={styles.clearButtonText}>Limpar</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>País</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={country}
                onValueChange={handleCountryChange}
              >
                {locationOptions.countries.map((c) => (
                  <Picker.Item key={c} label={c} value={c} />
                ))}
              </Picker>
            </View>

            <Text style={styles.inputLabel}>Estado</Text>
            <View style={styles.pickerContainer}>
              <Picker selectedValue={state} onValueChange={handleStateChange}>
                <Picker.Item label="Todos os estados" value="" />
                {(locationOptions.states[country] || []).map((s) => (
                  <Picker.Item key={s} label={s} value={s} />
                ))}
              </Picker>
            </View>

            <Text style={styles.inputLabel}>Cidade</Text>
            <View style={styles.pickerContainer}>
              <Picker selectedValue={city} onValueChange={setCity}>
                <Picker.Item label="Todas as cidades" value="" />
                {(locationOptions.cities[`${country}-${state}`] || []).map(
                  (c) => (
                    <Picker.Item key={c} label={c} value={c} />
                  )
                )}
              </Picker>
            </View>

          <Text style={styles.inputLabel}>Data Início</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowStartDatePicker(true)}
          >
            <Ionicons name="calendar" size={20} color="#54A676" />
            <Text style={styles.dateButtonText}>
              {startDate || "Selecione uma data"}
            </Text>
          </TouchableOpacity>

          {showStartDatePicker && (
            <DateTimePicker
              value={startDate ? new Date(startDate) : new Date()}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={handleStartDateChange}
            />
          )}

          <Text style={styles.inputLabel}>Data Fim</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowEndDatePicker(true)}
          >
            <Ionicons name="calendar" size={20} color="#54A676" />
            <Text style={styles.dateButtonText}>
              {endDate || "Selecione uma data"}
            </Text>
          </TouchableOpacity>

          {showEndDatePicker && (
            <DateTimePicker
              value={endDate ? new Date(endDate) : new Date()}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={handleEndDateChange}
            />
          )}

            <TouchableOpacity
              style={[styles.applyButton, generating && styles.buttonDisabled]}
              onPress={handleApplyFilters}
              disabled={generating}
            >
              {generating ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="funnel" size={20} color="#ffffff" />
                  <Text style={styles.applyButtonText}>Aplicar Filtros</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {reportData && (
          <>
            {/* Indicador Geral */}
            <View style={styles.scoreCard}>
              <Text style={styles.sectionTitle}>Indicador Geral (IQMS)</Text>
              <View
                style={[
                  styles.scoreCircle,
                  {
                    backgroundColor: getScoreColor(reportData.averageScore),
                  },
                ]}
              >
                <Text style={styles.scoreValue}>
                  {reportData.averageScore.toFixed(2)}
                </Text>
                <Text style={styles.scoreLabel}>/ 1.0</Text>
              </View>
            </View>

            {/* Cards de Categorias */}
            <View style={styles.categoriesContainer}>
              <View style={[styles.categoryCard, styles.goodCard]}>
                <Text style={styles.categoryLabel}>Bom</Text>
                <Text style={styles.categoryValue}>
                  {reportData.goodCount}
                </Text>
                <Text style={styles.categorySubtext}>≥ 0.75</Text>
              </View>

              <View style={[styles.categoryCard, styles.regularCard]}>
                <Text style={styles.categoryLabel}>Regular</Text>
                <Text style={styles.categoryValue}>
                  {reportData.regularCount}
                </Text>
                <Text style={styles.categorySubtext}>0.5 - 0.75</Text>
              </View>

              <View style={[styles.categoryCard, styles.mediocreCard]}>
                <Text style={styles.categoryLabel}>Mediocre</Text>
                <Text style={styles.categoryValue}>
                  {reportData.mediocreCount}
                </Text>
                <Text style={styles.categorySubtext}>0.25 - 0.5</Text>
              </View>

              <View style={[styles.categoryCard, styles.poorCard]}>
                <Text style={styles.categoryLabel}>Ruim</Text>
                <Text style={styles.categoryValue}>
                  {reportData.poorCount}
                </Text>
                <Text style={styles.categorySubtext}>{"< 0.25"}</Text>
              </View>
            </View>

            {/* Tabela de Taxôns */}
            <View style={styles.tableCard}>
              <Text style={styles.sectionTitle}>
                Quantidade por Classe Taxonômica
              </Text>
              <Text style={styles.tableSubtitle}>
                Total de {reportData.totalSamples} amostra
                {reportData.totalSamples !== 1 ? "s" : ""}
              </Text>

              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, styles.nameCell]}>
                  Classe
                </Text>
                <Text style={[styles.tableHeaderCell, styles.quantityCell]}>
                  Qtd.
                </Text>
              </View>

              {Object.entries(reportData.taxonData).map(([taxon, quantity]) => (
                <View key={taxon} style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.nameCell]}>
                    {taxonLabels[taxon] || taxon}
                  </Text>
                  <Text style={[styles.tableCell, styles.quantityCell]}>
                    {quantity}
                  </Text>
                </View>
              ))}
            </View>

            {/* Botão de Exportar */}
            <TouchableOpacity
              style={styles.exportButton}
              onPress={handleExportCSV}
            >
              <Ionicons name="download" size={20} color="#ffffff" />
              <Text style={styles.exportButtonText}>Exportar CSV</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
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
  header: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1f2937",
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 4,
  },
  filtersCard: {
    backgroundColor: "#ffffff",
    marginHorizontal: 16,
    marginVertical: 16,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  filterHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1f2937",
  },
  clearButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#54A676",
  },
  clearButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#54A676",
    marginLeft: 4,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginTop: 12,
    marginBottom: 8,
  },
  pickerContainer: {
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    overflow: "hidden",
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dateButtonText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#1f2937",
  },
  applyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#54A676",
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  applyButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  scoreCard: {
    backgroundColor: "#ffffff",
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  scoreCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 16,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: "900",
    color: "#ffffff",
  },
  scoreLabel: {
    fontSize: 16,
    color: "#ffffff",
    fontWeight: "600",
  },
  categoriesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginHorizontal: 16,
    marginVertical: 8,
    gap: 10,
  },
  categoryCard: {
    width: "23%",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    alignItems: "center",
  },
  goodCard: {
    borderLeftColor: "#10b981",
  },
  regularCard: {
    borderLeftColor: "#f59e0b",
  },
  mediocreCard: {
    borderLeftColor: "#ef4444",
  },
  poorCard: {
    borderLeftColor: "#dc2626",
  },
  categoryLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6b7280",
    marginBottom: 4,
  },
  categoryValue: {
    fontSize: 28,
    fontWeight: "900",
    color: "#1f2937",
  },
  categorySubtext: {
    fontSize: 10,
    color: "#6b7280",
    marginTop: 2,
  },
  tableCard: {
    backgroundColor: "#ffffff",
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  tableSubtitle: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 12,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 2,
    borderBottomColor: "#e5e7eb",
    paddingVertical: 10,
    marginBottom: 8,
  },
  tableHeaderCell: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1f2937",
  },
  nameCell: {
    flex: 1,
  },
  quantityCell: {
    width: 50,
    textAlign: "right",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  tableCell: {
    fontSize: 13,
    color: "#374151",
  },
  exportButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#54A676",
    marginHorizontal: 16,
    marginVertical: 16,
    paddingVertical: 14,
    borderRadius: 8,
  },
  exportButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
});
