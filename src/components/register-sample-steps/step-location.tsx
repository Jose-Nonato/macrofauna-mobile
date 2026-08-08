import React from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useI18n } from "@/hooks/useI18n";

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

interface SelectionItem {
  label: string;
  value: string;
}

interface SelectionModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  data: SelectionItem[];
  onSelect: (item: SelectionItem) => void;
  searchPlaceholder?: string;
  loading?: boolean;
}

const COUNTRY_TRANSLATIONS: Record<string, string> = {
  "Brazil": "Brasil",
  "Brasil": "Brasil",
  "Argentina": "Argentina",
  "Bolivia": "Bolívia",
  "Chile": "Chile",
  "Colombia": "Colômbia",
  "Ecuador": "Equador",
  "Paraguay": "Paraguai",
  "Peru": "Peru",
  "Uruguay": "Uruguai",
  "Venezuela": "Venezuela",
  "United States": "Estados Unidos",
  "Canada": "Canadá",
  "Spain": "Espanha",
  "Portugal": "Portugal",
  "France": "França",
  "Italy": "Itália",
  "Germany": "Alemanha",
  "United Kingdom": "Reino Unido",
};

function SelectionModal({
  visible,
  onClose,
  title,
  data,
  onSelect,
  searchPlaceholder,
  loading = false,
}: SelectionModalProps) {
  const { t } = useI18n();
  const [search, setSearch] = React.useState("");

  React.useEffect(() => {
    if (!visible) {
      setSearch("");
    }
  }, [visible]);

  const filteredData = React.useMemo(() => {
    if (!search.trim()) return data;
    const lowerSearch = search.toLowerCase();
    return data.filter((item) =>
      item.label.toLowerCase().includes(lowerSearch)
    );
  }, [data, search]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={modalStyles.overlay}>
        <View style={modalStyles.content}>
          <View style={modalStyles.header}>
            <Text style={modalStyles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={modalStyles.closeButton}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={modalStyles.loadingContainer}>
              <ActivityIndicator size="large" color="#54A676" />
              <Text style={modalStyles.loadingText}>{t("common.loading")}</Text>
            </View>
          ) : (
            <>
              <View style={modalStyles.searchContainer}>
                <Ionicons
                  name="search-outline"
                  size={18}
                  color="#64748b"
                  style={modalStyles.searchIcon}
                />
                <TextInput
                  style={modalStyles.searchInput}
                  placeholder={searchPlaceholder}
                  placeholderTextColor="#94a3b8"
                  value={search}
                  onChangeText={setSearch}
                  autoCorrect={false}
                />
              </View>

              <FlatList
                data={filteredData}
                keyExtractor={(item) => item.value}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={modalStyles.itemRow}
                    onPress={() => {
                      onSelect(item);
                      onClose();
                    }}
                  >
                    <Text style={modalStyles.itemText}>{item.label}</Text>
                    <Ionicons
                      name="chevron-forward-outline"
                      size={16}
                      color="#cbd5e1"
                    />
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <View style={modalStyles.emptyContainer}>
                    <Text style={modalStyles.emptyText}>
                      {t("samples.noOptionsFound")}
                    </Text>
                  </View>
                }
              />
            </>
          )}
        </View>
      </View>
    </Modal>
  );
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
  const { t } = useI18n();
  const [loadingGPS, setLoadingGPS] = React.useState(false);

  // Listas obtidas via API
  const [countries, setCountries] = React.useState<SelectionItem[]>([]);
  const [loadingCountries, setLoadingCountries] = React.useState(false);

  const [states, setStates] = React.useState<{ name: string; state_code: string }[]>([]);
  const [loadingStates, setLoadingStates] = React.useState(false);

  const [cities, setCities] = React.useState<string[]>([]);
  const [loadingCities, setLoadingCities] = React.useState(false);

  // Controladores de modais
  const [countriesModalVisible, setCountriesModalVisible] = React.useState(false);
  const [statesModalVisible, setStatesModalVisible] = React.useState(false);
  const [citiesModalVisible, setCitiesModalVisible] = React.useState(false);

  // Carregador de coordenadas
  const [loadingCoords, setLoadingCoords] = React.useState(false);

  // Tradutor auxiliar para o nome da API de países
  const getApiCountryName = (cName: string) => {
    if (cName === "Brasil" || cName === "brasil") return "Brazil";
    return cName;
  };

  // 1. Busca inicial de países na API do CountriesNow
  React.useEffect(() => {
    fetchCountries();
  }, []);

  const fetchCountries = async () => {
    setLoadingCountries(true);
    try {
      const response = await fetch("https://countriesnow.space/api/v0.1/countries/iso");
      const json = await response.json();
      if (json.error) throw new Error(json.msg || "Erro na resposta da API");
      
      const mapped = json.data.map((item: any) => ({
        label: COUNTRY_TRANSLATIONS[item.name] || item.name,
        value: item.name,
      }));
      setCountries(mapped);
    } catch (error) {
      Alert.alert(t("samples.connectionError"), t("samples.couldNotLoadCountries"));
    } finally {
      setLoadingCountries(false);
    }
  };

  // 2. Busca de estados sempre que o país selecionado mudar
  React.useEffect(() => {
    if (country) {
      fetchStatesForCountry(getApiCountryName(country));
    } else {
      setStates([]);
      setCities([]);
    }
  }, [country]);

  const fetchStatesForCountry = async (apiCountryName: string) => {
    setLoadingStates(true);
    setStates([]);
    setCities([]);
    try {
      const response = await fetch("https://countriesnow.space/api/v0.1/countries/states", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country: apiCountryName }),
      });
      const json = await response.json();
      if (json.error) throw new Error(json.msg || "Erro na resposta da API");
      setStates(json.data.states || []);
    } catch (error) {
      Alert.alert(t("common.error"), t("samples.couldNotLoadStates"));
    } finally {
      setLoadingStates(false);
    }
  };

  // 3. Busca de cidades sempre que o estado mudar
  React.useEffect(() => {
    if (country && state && states.length > 0) {
      const selectedStateObj = states.find(
        (s) =>
          s.state_code.toUpperCase() === state.toUpperCase() ||
          s.name.toUpperCase() === state.toUpperCase()
      );
      if (selectedStateObj) {
        fetchCitiesForState(getApiCountryName(country), selectedStateObj.name);
      }
    } else {
      setCities([]);
    }
  }, [state, states, country]);

  const fetchCitiesForState = async (apiCountryName: string, stateName: string) => {
    setLoadingCities(true);
    setCities([]);
    try {
      const response = await fetch("https://countriesnow.space/api/v0.1/countries/state/cities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country: apiCountryName, state: stateName }),
      });
      const json = await response.json();
      if (json.error) throw new Error(json.msg || "Erro na resposta da API");
      setCities(json.data || []);
    } catch (error) {
      Alert.alert(t("common.error"), t("samples.couldNotLoadCities"));
    } finally {
      setLoadingCities(false);
    }
  };

  // 4. Geocodificação automática de latitude e longitude ao selecionar o local completo
  React.useEffect(() => {
    if (locationMode === "manual" && city.trim() && state.trim() && country.trim()) {
      resolveGeocode(city, state, country);
    }
  }, [city, state, country, locationMode]);

  const resolveGeocode = async (
    cityName: string,
    stateName: string,
    countryName: string
  ) => {
    setLoadingCoords(true);
    try {
      const cleanCountry = getApiCountryName(countryName);
      const address = `${cityName}, ${stateName}, ${cleanCountry}`;
      const result = await Location.geocodeAsync(address);
      if (result && result.length > 0) {
        const { latitude: lat, longitude: lon } = result[0];
        setLatitude(lat.toString());
        setLongitude(lon.toString());
      } else {
        const fallbackAddress = `${cityName}, ${cleanCountry}`;
        const resultFallback = await Location.geocodeAsync(fallbackAddress);
        if (resultFallback && resultFallback.length > 0) {
          const { latitude: lat, longitude: lon } = resultFallback[0];
          setLatitude(lat.toString());
          setLongitude(lon.toString());
        }
      }
    } catch (error) {
    } finally {
      setLoadingCoords(false);
    }
  };

  const handleGetGPSLocation = async () => {
    setLoadingGPS(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          t("samples.gpsPermissionDenied"),
          t("samples.gpsPermissionMsg")
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
        Alert.alert(t("common.success"), t("samples.gpsSuccessMsg"));
      }
    } catch (err) {
      Alert.alert(t("samples.gpsError"), t("samples.couldNotReadGPS"));
    } finally {
      setLoadingGPS(false);
    }
  };

  const handleSelectCountry = (item: SelectionItem) => {
    setCountry(item.value);
    // Reseta estado, cidade e coordenadas ao mudar o país
    setState("");
    setCity("");
    setLatitude("");
    setLongitude("");
  };

  const handleSelectState = (item: SelectionItem) => {
    setState(item.value);
    // Reseta cidade e coordenadas ao mudar o estado
    setCity("");
    setLatitude("");
    setLongitude("");
  };

  const handleSelectCity = (item: SelectionItem) => {
    setCity(item.value);
    // Reseta coordenadas antigas para forçar a nova geocodificação
    setLatitude("");
    setLongitude("");
  };

  const stateOptions = states.map((s) => ({
    label: s.state_code ? `${s.state_code} - ${s.name}` : s.name,
    value: s.state_code || s.name,
  }));

  const cityOptions = cities.map((c) => ({
    label: c,
    value: c,
  }));

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.stepTitle}>{t("samples.stepLocationTitle")}</Text>
      <Text style={styles.stepDesc}>
        {t("samples.stepLocationDesc")}
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
            {t("samples.gpsMode")}
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
            {t("samples.manualMode")}
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
                <Text style={styles.gpsButtonText}>{t("samples.getMyCoordinates")}</Text>
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
              <Text style={styles.gpsText}>
                {t("samples.cityLabel")}: {COUNTRY_TRANSLATIONS[city] || city || t("samples.cityNotFound")}
              </Text>
            </View>
          ) : (
            <Text style={styles.gpsHelpText}>
              {t("samples.clickToFillGPS")}
            </Text>
          )}
        </View>
      ) : (
        <View style={styles.manualPanel}>
          {/* Country Select */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t("common.country")}</Text>
            {loadingCountries ? (
              <View style={styles.selectButtonDisabled}>
                <ActivityIndicator size="small" color="#54A676" style={{ marginRight: 8 }} />
                <Text style={styles.placeholderText}>{t("samples.loadingCountries")}</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => setCountriesModalVisible(true)}
              >
                <Text
                  style={[
                    styles.selectButtonText,
                    !country && styles.placeholderText,
                  ]}
                >
                  {COUNTRY_TRANSLATIONS[country] || country || t("samples.selectCountry")}
                </Text>
                <Ionicons
                  name="chevron-down-outline"
                  size={16}
                  color="#64748b"
                />
              </TouchableOpacity>
            )}
          </View>

          {/* State Select */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t("common.state")}</Text>
            {!country ? (
              <TouchableOpacity
                style={[styles.selectButton, styles.selectButtonDisabled]}
                onPress={() =>
                  Alert.alert(t("common.attention"), t("samples.selectCountryFirstAlert"))
                }
              >
                <Text style={[styles.selectButtonText, styles.placeholderText]}>
                  {t("samples.selectCountryFirst")}
                </Text>
                <Ionicons
                  name="chevron-down-outline"
                  size={16}
                  color="#cbd5e1"
                />
              </TouchableOpacity>
            ) : loadingStates ? (
              <View style={styles.selectButtonDisabled}>
                <ActivityIndicator size="small" color="#54A676" style={{ marginRight: 8 }} />
                <Text style={styles.placeholderText}>{t("samples.loadingStates")}</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => setStatesModalVisible(true)}
              >
                <Text
                  style={[
                    styles.selectButtonText,
                    !state && styles.placeholderText,
                  ]}
                >
                  {state
                    ? `${state} - ${
                        states.find(
                          (s) =>
                            s.state_code.toUpperCase() === state.toUpperCase() ||
                            s.name.toUpperCase() === state.toUpperCase()
                        )?.name || state
                      }`
                    : t("samples.selectState")}
                </Text>
                <Ionicons
                  name="chevron-down-outline"
                  size={16}
                  color="#64748b"
                />
              </TouchableOpacity>
            )}
          </View>

          {/* Cidade Select */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t("common.city")}</Text>
            {!country || !state ? (
              <TouchableOpacity
                style={[styles.selectButton, styles.selectButtonDisabled]}
                onPress={() =>
                  Alert.alert(
                    t("common.attention"),
                    t("samples.selectCountryStateFirstAlert")
                  )
                }
              >
                <Text style={[styles.selectButtonText, styles.placeholderText]}>
                  {t("samples.selectCountryStateFirst")}
                </Text>
                <Ionicons
                  name="chevron-down-outline"
                  size={16}
                  color="#cbd5e1"
                />
              </TouchableOpacity>
            ) : loadingCities ? (
              <View style={styles.selectButtonDisabled}>
                <ActivityIndicator size="small" color="#54A676" style={{ marginRight: 8 }} />
                <Text style={styles.placeholderText}>{t("samples.loadingCities")}</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => setCitiesModalVisible(true)}
              >
                <Text
                  style={[
                    styles.selectButtonText,
                    !city && styles.placeholderText,
                  ]}
                >
                  {city || t("samples.selectCity")}
                </Text>
                <Ionicons
                  name="chevron-down-outline"
                  size={16}
                  color="#64748b"
                />
              </TouchableOpacity>
            )}
          </View>

          {/* Painel Informativo de Coordenadas Obtidas */}
          {loadingCoords ? (
            <View style={styles.coordsPanel}>
              <ActivityIndicator
                color="#54A676"
                size="small"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.coordsHelpText}>
                {t("samples.fetchingCoordinates")}
              </Text>
            </View>
          ) : latitude && longitude ? (
            <View style={styles.coordsPanel}>
              <Ionicons
                name="checkmark-circle"
                size={18}
                color="#166534"
                style={{ marginRight: 6 }}
              />
              <Text style={styles.coordsText}>
                {t("samples.coordinatesObtained")}: Lat {parseFloat(latitude).toFixed(5)}, Lon{" "}
                {parseFloat(longitude).toFixed(5)}
              </Text>
            </View>
          ) : (
            city.trim() &&
            state.trim() &&
            country.trim() && (
              <View style={[styles.coordsPanel, styles.coordsPanelWarning]}>
                <Ionicons
                  name="warning-outline"
                  size={18}
                  color="#854d0e"
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.coordsWarningText}>
                  {t("samples.couldNotGetCoordinatesAuto")}
                </Text>
              </View>
            )
          )}
        </View>
      )}

      {/* Modals de Seleção */}
      <SelectionModal
        visible={countriesModalVisible}
        onClose={() => setCountriesModalVisible(false)}
        title={t("samples.selectCountry")}
        data={countries}
        onSelect={handleSelectCountry}
        searchPlaceholder={t("samples.searchCountry")}
        loading={loadingCountries}
      />

      <SelectionModal
        visible={statesModalVisible}
        onClose={() => setStatesModalVisible(false)}
        title={t("samples.selectState")}
        data={stateOptions}
        onSelect={handleSelectState}
        searchPlaceholder={t("samples.searchState")}
        loading={loadingStates}
      />

      <SelectionModal
        visible={citiesModalVisible}
        onClose={() => setCitiesModalVisible(false)}
        title={t("samples.selectCity")}
        data={cityOptions}
        onSelect={handleSelectCity}
        searchPlaceholder={t("samples.searchCity")}
        loading={loadingCities}
      />
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
  selectButton: {
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  selectButtonDisabled: {
    backgroundColor: "#f1f5f9",
    borderColor: "#cbd5e1",
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  selectButtonText: {
    fontSize: 15,
    color: "#0f172a",
  },
  placeholderText: {
    color: "#94a3b8",
  },
  coordsPanel: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    marginBottom: 16,
  },
  coordsPanelWarning: {
    backgroundColor: "#fef9c3",
    borderColor: "#fef08a",
  },
  coordsText: {
    fontSize: 13,
    color: "#166534",
    fontWeight: "600",
  },
  coordsHelpText: {
    fontSize: 13,
    color: "#166534",
    fontWeight: "500",
    flex: 1,
  },
  coordsWarningText: {
    fontSize: 13,
    color: "#854d0e",
    fontWeight: "500",
    flex: 1,
  },
});

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    justifyContent: "flex-end",
  },
  content: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: "75%",
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0f172a",
  },
  closeButton: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#64748b",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 14,
    color: "#0f172a",
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  itemText: {
    fontSize: 15,
    color: "#334155",
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#94a3b8",
  },
});
