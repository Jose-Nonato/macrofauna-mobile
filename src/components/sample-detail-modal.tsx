import { deleteSample, getInsectsBySample, getPhotosBySample } from "@/lib/services";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { TAXON_LIST } from "./register-sample-steps/step-taxonomy";
import { useI18n } from "@/hooks/useI18n";
import { useLanguage } from "@/contexts/LanguageContext";

interface SampleDetailModalProps {
  visible: boolean;
  sample: any;
  onClose: () => void;
  onEdit: (sample: any) => void;
  onSuccess: () => void;
}

const { width } = Dimensions.get("window");

export default function SampleDetailModal({
  visible,
  sample,
  onClose,
  onEdit,
  onSuccess,
}: SampleDetailModalProps) {
  const { t } = useI18n();
  const { language } = useLanguage();
  const [loading, setLoading] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [insects, setInsects] = React.useState<any>(null);
  const [photos, setPhotos] = React.useState<any[]>([]);
  const [viewerVisible, setViewerVisible] = React.useState(false);
  const [viewerPhotos, setViewerPhotos] = React.useState<any[]>([]);
  const [viewerIndex, setViewerIndex] = React.useState(0);

  const handleOpenPhoto = (dirPhotos: any[], index: number) => {
    setViewerPhotos(dirPhotos);
    setViewerIndex(index);
    setViewerVisible(true);
  };

  React.useEffect(() => {
    if (visible && sample?.id) {
      fetchDetails();
    } else {
      setInsects(null);
      setPhotos([]);
    }
  }, [visible, sample]);

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const [insectsData, photosData] = await Promise.all([
        getInsectsBySample(sample.id),
        getPhotosBySample(sample.id),
      ]);

      // Consolidar todos os níveis de insetos
      let consolidatedInsects: any = null;
      if (insectsData && insectsData.length > 0) {
        consolidatedInsects = {
          earthworm: 0,
          ant: 0,
          isoptera: 0,
          blattaria: 0,
          coleoptera: 0,
          arachnida: 0,
          diplopoda: 0,
          chilopoda: 0,
          hemiptera: 0,
          lepidoptera: 0,
          gasteropoda: 0,
          dermaptera: 0,
          others: 0,
        };

        // Somar todos os níveis
        insectsData.forEach((insect: any) => {
          consolidatedInsects.earthworm += insect.earthworm || 0;
          consolidatedInsects.ant += insect.ant || 0;
          consolidatedInsects.isoptera += insect.isoptera || 0;
          consolidatedInsects.blattaria += insect.blattaria || 0;
          consolidatedInsects.coleoptera += insect.coleoptera || 0;
          consolidatedInsects.arachnida += insect.arachnida || 0;
          consolidatedInsects.diplopoda += insect.diplopoda || 0;
          consolidatedInsects.chilopoda += insect.chilopoda || 0;
          consolidatedInsects.hemiptera += insect.hemiptera || 0;
          consolidatedInsects.lepidoptera += insect.lepidoptera || 0;
          consolidatedInsects.gasteropoda += insect.gasteropoda || 0;
          consolidatedInsects.dermaptera += insect.dermaptera || 0;
          consolidatedInsects.others += insect.others || 0;
        });
      }

      setInsects(consolidatedInsects);
      setPhotos(photosData || []);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      t("samples.deleteSampleTitle"),
      t("samples.deleteSampleConfirm"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteSample(sample.id);
              Alert.alert(t("common.success"), t("samples.deleteSampleSuccess"));
              onSuccess(); // atualiza a listagem de amostras
              onClose(); // fecha o modal de detalhes
            } catch (error: any) {
              Alert.alert(t("samples.errorDeleting"), error.message || t("samples.unexpectedError"));
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  if (!sample) return null;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    const locale = language === "pt" ? "pt-BR" : language === "es" ? "es-ES" : "en-US";
    return date.toLocaleDateString(locale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Agrupar fotos por direção
  const photosByDirection = {
    norte: photos.filter((p) => p.direction === "norte"),
    sul: photos.filter((p) => p.direction === "sul"),
    leste: photos.filter((p) => p.direction === "leste"),
    oeste: photos.filter((p) => p.direction === "oeste"),
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerSubtitle}>{t("samples.sampleDetails")}</Text>
              <Text style={styles.headerTitle}>{t("samples.code")}: #{sample.id.toString().slice(-6)}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton} disabled={deleting}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#54A676" />
              <Text style={styles.loadingText}>{t("samples.loadingSampleData")}</Text>
            </View>
          ) : (
            <>
              <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                {/* Seção 1: Score IQMS */}
                <View style={styles.scoreCard}>
                  <View style={styles.scoreInfo}>
                    <Text style={styles.scoreTitle}>Score IQMS</Text>
                    <Text style={styles.scoreDesc}>{t("samples.soilQualityIndex")}</Text>
                  </View>
                  <View style={styles.scoreValueContainer}>
                    <Text style={styles.scoreValue}>
                      {sample.sample_score !== null ? sample.sample_score.toFixed(2) : "N/A"}
                    </Text>
                    <Text style={styles.scoreMax}>/1.0</Text>
                  </View>
                </View>

                {/* Seção 2: Informações de Campo */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>{t("samples.locationAndDate")}</Text>
                  <View style={styles.infoRow}>
                    <Ionicons name="location-outline" size={18} color="#54A676" />
                    <View style={styles.infoTextContainer}>
                      <Text style={styles.infoLabel}>{t("samples.address")}</Text>
                      <Text style={styles.infoValue}>
                        {sample.city}, {sample.state} - {sample.country}
                      </Text>
                    </View>
                  </View>

                  {sample.latitude && sample.longitude && (
                    <View style={styles.infoRow}>
                      <Ionicons name="locate-outline" size={18} color="#54A676" />
                      <View style={styles.infoTextContainer}>
                        <Text style={styles.infoLabel}>{t("samples.gpsCoordinates")}</Text>
                        <Text style={styles.infoValue}>
                          Lat: {parseFloat(sample.latitude).toFixed(5)}, Lon: {parseFloat(sample.longitude).toFixed(5)}
                        </Text>
                      </View>
                    </View>
                  )}

                  <View style={styles.infoRow}>
                    <Ionicons name="calendar-outline" size={18} color="#54A676" />
                    <View style={styles.infoTextContainer}>
                      <Text style={styles.infoLabel}>{t("samples.collectionDate")}</Text>
                      <Text style={styles.infoValue}>{formatDate(sample.created_at)}</Text>
                    </View>
                  </View>
                </View>

                {/* Seção 3: Métricas Ecológicas */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>{t("samples.ecologicalMetrics")}</Text>
                  <View style={styles.metricsGrid}>
                    <View style={styles.metricItem}>
                      <Text style={styles.metricLabel}>{t("home.density")}</Text>
                      <Text style={styles.metricValue}>
                        {sample.sample_density !== null ? `${sample.sample_density.toFixed(2)}` : "N/A"}
                      </Text>
                      <Text style={styles.metricUnit}>{t("samples.individualsPerM2")}</Text>
                    </View>
                    <View style={styles.metricItem}>
                      <Text style={styles.metricLabel}>{t("samples.totalAnimals")}</Text>
                      <Text style={styles.metricValue}>
                        {sample.animal_quantity !== null ? sample.animal_quantity : "0"}
                      </Text>
                      <Text style={styles.metricUnit}>{t("samples.units")}</Text>
                    </View>
                  </View>
                </View>

                {/* Seção 4: Insetos / Taxonomia (Total) */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>{t("samples.taxonomicComposition")}</Text>
                  {insects ? (
                    <View style={styles.taxonomyList}>
                      {TAXON_LIST.map((taxon) => {
                        const value = insects[taxon.key] || 0;
                        if (value === 0) return null; // Oculta taxons que não foram encontrados na amostra
                        return (
                          <View key={taxon.key} style={styles.taxonRow}>
                            <View>
                              <Text style={styles.taxonName}>{t(`taxon.${taxon.key}`)}</Text>
                              <Text style={styles.taxonSub}>{taxon.code}</Text>
                            </View>
                            <Text style={styles.taxonValue}>{value}</Text>
                          </View>
                        );
                      })}
                      {/* Se nenhum taxon for exibido */}
                      {TAXON_LIST.every((taxon) => (insects[taxon.key] || 0) === 0) && (
                        <Text style={styles.emptyText}>{t("samples.noInvertebratesFound")}</Text>
                      )}
                    </View>
                  ) : (
                    <Text style={styles.emptyText}>{t("samples.taxonomicDataUnavailable")}</Text>
                  )}
                </View>

                {/* Seção 5: Fotos do Monólito */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>{t("samples.monolithPhotos")}</Text>
                  {photos.length > 0 ? (
                    <View style={styles.photosContainer}>
                      {(Object.keys(photosByDirection) as Array<keyof typeof photosByDirection>).map((dir) => {
                        const dirPhotos = photosByDirection[dir];
                        if (dirPhotos.length === 0) return null;
                        const directionLabel = dir === "norte" ? t("samples.north") : dir === "sul" ? t("samples.south") : dir === "leste" ? t("samples.east") : t("samples.west");
                        return (
                          <View key={dir} style={styles.directionSection}>
                            <Text style={styles.directionTitle}>{t("samples.direction")} {directionLabel}</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.directionPhotosScroll}>
                              {dirPhotos.map((p, index) => (
                                <TouchableOpacity
                                  key={p.id}
                                  activeOpacity={0.8}
                                  onPress={() => handleOpenPhoto(dirPhotos, index)}
                                >
                                  <Image source={{ uri: p.photo }} style={styles.photoThumbnail} />
                                </TouchableOpacity>
                              ))}
                            </ScrollView>
                          </View>
                        );
                      })}
                    </View>
                  ) : (
                    <Text style={styles.emptyText}>{t("samples.noImagesAttached")}</Text>
                  )}
                </View>
              </ScrollView>

              {/* Botões Stick do Rodapé para Editar e Deletar */}
              <View style={styles.footerActions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteActionButton]}
                  onPress={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? (
                    <ActivityIndicator size="small" color="#ef4444" />
                  ) : (
                    <>
                      <Ionicons name="trash-outline" size={18} color="#ef4444" />
                      <Text style={styles.deleteActionText}>{t("samples.deleteSample")}</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.editActionButton]}
                  onPress={() => {
                    onClose();
                    onEdit(sample); // Abre o formulário de cadastro em modo de edição
                  }}
                  disabled={deleting}
                >
                  <Ionicons name="create-outline" size={18} color="#ffffff" />
                  <Text style={styles.editActionText}>{t("home.editSample")}</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>

      {/* Visualizador de imagem em tela cheia */}
      <Modal
        visible={viewerVisible}
        animationType="fade"
        transparent={false}
        onRequestClose={() => setViewerVisible(false)}
      >
        <View style={styles.viewerContainer}>
          <StatusBar barStyle="light-content" backgroundColor="#000000" />
          <TouchableOpacity
            style={styles.viewerCloseButton}
            onPress={() => setViewerVisible(false)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="close" size={28} color="#ffffff" />
          </TouchableOpacity>

          {viewerPhotos.length > 1 && (
            <View style={styles.viewerCounter}>
              <Text style={styles.viewerCounterText}>
                {viewerIndex + 1} / {viewerPhotos.length}
              </Text>
            </View>
          )}

          <FlatList
            data={viewerPhotos}
            keyExtractor={(item) => item.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={viewerIndex}
            getItemLayout={(_, index) => ({
              length: width,
              offset: width * index,
              index,
            })}
            onMomentumScrollEnd={(e) => {
              const newIndex = Math.round(e.nativeEvent.contentOffset.x / width);
              setViewerIndex(newIndex);
            }}
            renderItem={({ item }) => (
              <View style={styles.viewerImageWrapper}>
                <Image
                  source={{ uri: item.photo }}
                  style={styles.viewerImage}
                  resizeMode="contain"
                />
              </View>
            )}
          />
        </View>
      </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "flex-end",
  },
  content: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: "92%",
    paddingTop: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0f172a",
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  closeButton: {
    padding: 6,
    backgroundColor: "#f1f5f9",
    borderRadius: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: Platform.OS === "ios" ? 40 : 20,
  },
  scoreCard: {
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  scoreInfo: {
    flex: 1,
  },
  scoreTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#166534",
    marginBottom: 2,
  },
  scoreDesc: {
    fontSize: 11,
    color: "#15803d",
    fontWeight: "500",
  },
  scoreValueContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#86efac",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#15803d",
  },
  scoreMax: {
    fontSize: 12,
    color: "#166534",
    fontWeight: "bold",
  },
  section: {
    marginBottom: 24,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#cbd5e1",
    paddingBottom: 6,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  infoTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: "600",
  },
  infoValue: {
    fontSize: 14,
    color: "#1e293b",
    fontWeight: "bold",
  },
  metricsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  metricItem: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    width: "48%",
  },
  metricLabel: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: "bold",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0f172a",
  },
  metricUnit: {
    fontSize: 9,
    color: "#94a3b8",
    fontWeight: "bold",
    marginTop: 2,
  },
  taxonomyList: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 8,
  },
  taxonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  taxonName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1e293b",
  },
  taxonSub: {
    fontSize: 11,
    color: "#54A676",
    fontWeight: "600",
  },
  taxonValue: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#0f172a",
  },
  emptyText: {
    fontSize: 13,
    color: "#94a3b8",
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 8,
  },
  photosContainer: {
    marginTop: 4,
  },
  directionSection: {
    marginBottom: 14,
  },
  directionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#64748b",
    marginBottom: 6,
  },
  directionPhotosScroll: {
    paddingVertical: 4,
  },
  photoThumbnail: {
    width: 100,
    height: 100,
    borderRadius: 10,
    marginRight: 10,
    backgroundColor: "#cbd5e1",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  footerActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    padding: 16,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    backgroundColor: "#ffffff",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flex: 1,
  },
  editActionButton: {
    backgroundColor: "#54A676",
    marginLeft: 8,
  },
  deleteActionButton: {
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fca5a5",
    marginRight: 8,
  },
  editActionText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 14,
    marginLeft: 6,
  },
  deleteActionText: {
    color: "#ef4444",
    fontWeight: "bold",
    fontSize: 14,
    marginLeft: 6,
  },
  viewerContainer: {
    flex: 1,
    backgroundColor: "#000000",
  },
  viewerCloseButton: {
    position: "absolute",
    top: Platform.OS === "ios" ? 56 : 24,
    right: 16,
    zIndex: 10,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 20,
    padding: 8,
  },
  viewerCounter: {
    position: "absolute",
    top: Platform.OS === "ios" ? 60 : 28,
    alignSelf: "center",
    zIndex: 10,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  viewerCounterText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "bold",
  },
  viewerImageWrapper: {
    width,
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  viewerImage: {
    width: width,
    height: "100%",
  },
});
