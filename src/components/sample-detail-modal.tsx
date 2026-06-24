import React from "react";
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  Dimensions,
  Platform,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getInsectsBySample, getPhotosBySample, deleteSample } from "@/lib/services";
import { TAXON_LIST } from "./register-sample-steps/step-taxonomy";

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
  const [loading, setLoading] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [insects, setInsects] = React.useState<any>(null);
  const [photos, setPhotos] = React.useState<any[]>([]);

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
      setInsects(insectsData && insectsData.length > 0 ? insectsData[0] : null);
      setPhotos(photosData || []);
    } catch (error) {
      console.warn("Erro ao buscar detalhes da amostra:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Excluir Amostra",
      "Tem certeza que deseja excluir esta amostra de macrofauna? Esta ação não pode ser desfeita.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteSample(sample.id);
              Alert.alert("Sucesso", "Amostra excluída com sucesso.");
              onSuccess(); // atualiza a listagem de amostras
              onClose(); // fecha o modal de detalhes
            } catch (error: any) {
              Alert.alert("Erro ao excluir", error.message || "Erro inesperado.");
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
    return date.toLocaleDateString("pt-BR", {
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
              <Text style={styles.headerSubtitle}>Detalhes da Amostra</Text>
              <Text style={styles.headerTitle}>Cód: #{sample.id.toString().slice(-6)}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton} disabled={deleting}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#54A676" />
              <Text style={styles.loadingText}>Carregando dados da amostra...</Text>
            </View>
          ) : (
            <>
              <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                {/* Seção 1: Score IQMS */}
                <View style={styles.scoreCard}>
                  <View style={styles.scoreInfo}>
                    <Text style={styles.scoreTitle}>Score IQMS</Text>
                    <Text style={styles.scoreDesc}>Índice de Qualidade de Solo</Text>
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
                  <Text style={styles.sectionTitle}>Localização e Data</Text>
                  <View style={styles.infoRow}>
                    <Ionicons name="location-outline" size={18} color="#54A676" />
                    <View style={styles.infoTextContainer}>
                      <Text style={styles.infoLabel}>Endereço</Text>
                      <Text style={styles.infoValue}>
                        {sample.city}, {sample.state} - {sample.country}
                      </Text>
                    </View>
                  </View>

                  {sample.latitude && sample.longitude && (
                    <View style={styles.infoRow}>
                      <Ionicons name="locate-outline" size={18} color="#54A676" />
                      <View style={styles.infoTextContainer}>
                        <Text style={styles.infoLabel}>Coordenadas GPS</Text>
                        <Text style={styles.infoValue}>
                          Lat: {parseFloat(sample.latitude).toFixed(5)}, Lon: {parseFloat(sample.longitude).toFixed(5)}
                        </Text>
                      </View>
                    </View>
                  )}

                  <View style={styles.infoRow}>
                    <Ionicons name="calendar-outline" size={18} color="#54A676" />
                    <View style={styles.infoTextContainer}>
                      <Text style={styles.infoLabel}>Data da Coleta</Text>
                      <Text style={styles.infoValue}>{formatDate(sample.created_at)}</Text>
                    </View>
                  </View>
                </View>

                {/* Seção 3: Métricas Ecológicas */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Métricas Ecológicas</Text>
                  <View style={styles.metricsGrid}>
                    <View style={styles.metricItem}>
                      <Text style={styles.metricLabel}>Densidade</Text>
                      <Text style={styles.metricValue}>
                        {sample.sample_density !== null ? `${sample.sample_density.toFixed(2)}` : "N/A"}
                      </Text>
                      <Text style={styles.metricUnit}>indivíduos / m²</Text>
                    </View>
                    <View style={styles.metricItem}>
                      <Text style={styles.metricLabel}>Total Animais</Text>
                      <Text style={styles.metricValue}>
                        {sample.animal_quantity !== null ? sample.animal_quantity : "0"}
                      </Text>
                      <Text style={styles.metricUnit}>unidades</Text>
                    </View>
                  </View>
                </View>

                {/* Seção 4: Insetos / Taxonomia (Total) */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Composição Taxonômica (Total)</Text>
                  {insects ? (
                    <View style={styles.taxonomyList}>
                      {TAXON_LIST.map((t) => {
                        const value = insects[t.key] || 0;
                        if (value === 0) return null; // Oculta taxons que não foram encontrados na amostra
                        return (
                          <View key={t.key} style={styles.taxonRow}>
                            <View>
                              <Text style={styles.taxonName}>{t.label}</Text>
                              <Text style={styles.taxonSub}>{t.subtitle}</Text>
                            </View>
                            <Text style={styles.taxonValue}>{value}</Text>
                          </View>
                        );
                      })}
                      {/* Se nenhum taxon for exibido */}
                      {TAXON_LIST.every((t) => (insects[t.key] || 0) === 0) && (
                        <Text style={styles.emptyText}>Nenhum invertebrado encontrado nesta amostra.</Text>
                      )}
                    </View>
                  ) : (
                    <Text style={styles.emptyText}>Ficha taxonômica indisponível.</Text>
                  )}
                </View>

                {/* Seção 5: Fotos do Monólito */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Fotos do Monólito</Text>
                  {photos.length > 0 ? (
                    <View style={styles.photosContainer}>
                      {(Object.keys(photosByDirection) as Array<keyof typeof photosByDirection>).map((dir) => {
                        const dirPhotos = photosByDirection[dir];
                        if (dirPhotos.length === 0) return null;
                        return (
                          <View key={dir} style={styles.directionSection}>
                            <Text style={styles.directionTitle}>Direção {dir.toUpperCase()}</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.directionPhotosScroll}>
                              {dirPhotos.map((p) => (
                                <Image key={p.id} source={{ uri: p.photo }} style={styles.photoThumbnail} />
                              ))}
                            </ScrollView>
                          </View>
                        );
                      })}
                    </View>
                  ) : (
                    <Text style={styles.emptyText}>Nenhuma imagem anexada para esta amostra.</Text>
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
                      <Text style={styles.deleteActionText}>Excluir Amostra</Text>
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
                  <Text style={styles.editActionText}>Editar Amostra</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
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
});
