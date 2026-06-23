import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";

// Importação dos passos modularizados do Wizard
import StepVideo from "./register-sample-steps/step-video";
import StepPhotos from "./register-sample-steps/step-photos";
import StepTaxonomy, {
  TAXON_LABELS,
  TaxonKey,
} from "./register-sample-steps/step-taxonomy";
import StepLocation from "./register-sample-steps/step-location";

interface RegisterSampleModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RegisterSampleModal({
  visible,
  onClose,
  onSuccess,
}: RegisterSampleModalProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [loading, setLoading] = useState(false);

  // Passo 2: Fotos (Suporta múltiplas fotos por direção)
  const [photoNorte, setPhotoNorte] = useState<string[]>([]);
  const [photoSul, setPhotoSul] = useState<string[]>([]);
  const [photoLeste, setPhotoLeste] = useState<string[]>([]);
  const [photoOeste, setPhotoOeste] = useState<string[]>([]);

  // Passo 3: Taxonomia da Macrofauna
  const [taxons, setTaxons] = useState<Record<TaxonKey, number>>({
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
  });

  // Passo 4: Localização
  const [locationMode, setLocationMode] = useState<"gps" | "manual">("gps");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("Brasil");
  const [latitude, setLatitude] = useState<string>("");
  const [longitude, setLongitude] = useState<string>("");

  const handleNext = () => {
    if (step < 4) {
      setStep((step + 1) as any);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((step - 1) as any);
    }
  };

  // Callback de foto adicionada (Passo 2)
  const handlePhotoAdded = (
    direction: "norte" | "sul" | "leste" | "oeste",
    uri: string
  ) => {
    if (direction === "norte") setPhotoNorte((prev) => [...prev, uri]);
    if (direction === "sul") setPhotoSul((prev) => [...prev, uri]);
    if (direction === "leste") setPhotoLeste((prev) => [...prev, uri]);
    if (direction === "oeste") setPhotoOeste((prev) => [...prev, uri]);
  };

  // Callback de foto removida (Passo 2)
  const handlePhotoRemoved = (
    direction: "norte" | "sul" | "leste" | "oeste",
    index: number
  ) => {
    if (direction === "norte")
      setPhotoNorte((prev) => prev.filter((_, i) => i !== index));
    if (direction === "sul")
      setPhotoSul((prev) => prev.filter((_, i) => i !== index));
    if (direction === "leste")
      setPhotoLeste((prev) => prev.filter((_, i) => i !== index));
    if (direction === "oeste")
      setPhotoOeste((prev) => prev.filter((_, i) => i !== index));
  };

  // Callback de alteração de taxons (Passo 3)
  const handleTaxonCountChange = (key: TaxonKey, amount: number) => {
    setTaxons((prev) => ({
      ...prev,
      [key]: Math.max(0, (prev[key] || 0) + amount),
    }));
  };

  // Callback de alteração manual absoluta de taxons (Passo 3)
  const handleTaxonCountSet = (key: TaxonKey, value: number) => {
    setTaxons((prev) => ({
      ...prev,
      [key]: Math.max(0, value),
    }));
  };

  // Submissão Geral para o Supabase
  const handleSaveSample = async () => {
    if (!city.trim() || !state.trim()) {
      Alert.alert(
        "Campos Obrigatórios",
        "Por favor, preencha a Cidade e o Estado."
      );
      return;
    }

    setLoading(true);
    try {
      // 1. Obter Usuário Autenticado
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado.");

      // 2. Calcular Métricas de Campo
      // Quantidade total de animais coletados
      const totalAnimals = Object.keys(TAXON_LABELS).reduce((sum, key) => {
        return sum + (taxons[key as TaxonKey] || 0);
      }, 0);

      // Densidade: Calculada com base no monólito padrão (25x25cm = 0.0625 m² area)
      // Densidade = Animais / Área = Animais * 16 por metro quadrado
      const calculatedDensity = totalAnimals * 16;

      // Diversidade de Classes Taxonômicas Presentes (contagem de chaves > 0)
      const diversityCount = Object.keys(TAXON_LABELS).reduce((count, key) => {
        return count + ((taxons[key as TaxonKey] || 0) > 0 ? 1 : 0);
      }, 0);

      // Score Biológico de Qualidade do Solo: Diversidade / Total de Classes * 10
      const calculatedScore =
        (diversityCount * 10) / Object.keys(TAXON_LABELS).length;

      // 3. Salvar Tabela "samples"
      const { data: sampleData, error: sampleError } = await supabase
        .from("samples")
        .insert({
          user_id: user.id,
          sample_score: parseFloat(calculatedScore.toFixed(2)),
          sample_density: parseFloat(calculatedDensity.toFixed(2)),
          animal_quantity: totalAnimals,
          country: country.trim(),
          state: state.trim().toUpperCase(),
          city: city.trim(),
          latitude: latitude ? parseFloat(latitude) : null,
          longitude: longitude ? parseFloat(longitude) : null,
        })
        .select()
        .single();

      if (sampleError) throw sampleError;
      const sampleId = sampleData.id;

      // 4. Salvar Tabela "insect" (Taxonomia da macrofauna)
      const { error: insectError } = await supabase.from("insect").insert({
        sample_id: sampleId,
        sample_density: parseFloat(calculatedDensity.toFixed(2)),
        iqms: parseFloat(calculatedScore.toFixed(2)), // Índice de Qualidade de Solo
        earthworm: taxons.earthworm,
        ant: taxons.ant,
        isoptera: taxons.isoptera,
        blattaria: taxons.blattaria,
        coleoptera: taxons.coleoptera,
        arachnida: taxons.arachnida,
        diplopoda: taxons.diplopoda,
        chilopoda: taxons.chilopoda,
        hemiptera: taxons.hemiptera,
        lepidoptera: taxons.lepidoptera,
        gasteropoda: taxons.gasteropoda,
        others: taxons.others,
      } as any);

      if (insectError) throw insectError;

      // 5. Salvar Tabela "photos" (Anexa TODAS as fotos cadastradas por direção)
      const directions = [
        { paths: photoNorte, key: "norte" },
        { paths: photoSul, key: "sul" },
        { paths: photoLeste, key: "leste" },
        { paths: photoOeste, key: "oeste" },
      ];

      for (const dir of directions) {
        for (const path of dir.paths) {
          const { error: photoError } = await supabase.from("photos").insert({
            sample_id: sampleId,
            photo: path, // Salva o caminho local da imagem
            direction: dir.key,
          });
          if (photoError) console.error("Erro ao salvar foto:", photoError);
        }
      }

      // 6. Finalização e Alerta
      Alert.alert(
        "Amostra Cadastrada!",
        `Sua amostra foi gravada com sucesso no Supabase.\nScore de Biodiversidade: ${calculatedScore.toFixed(
          1
        )}/10\nDensidade: ${calculatedDensity.toFixed(1)}/m²`,
        [
          {
            text: "Finalizar",
            onPress: () => {
              // Resetar estados
              setStep(1);
              setPhotoNorte([]);
              setPhotoSul([]);
              setPhotoLeste([]);
              setPhotoOeste([]);
              setTaxons({
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
              } as any);
              setCity("");
              setState("");
              setCountry("Brasil");
              setLatitude("");
              setLongitude("");

              onSuccess();
              onClose();
            },
          },
        ]
      );
    } catch (err: any) {
      Alert.alert("Erro ao Salvar", err.message || "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  };

  // Renderiza o componente modular correspondente à aba selecionada
  const renderTabContent = () => {
    switch (step) {
      case 1:
        return <StepVideo />;
      case 2:
        return (
          <StepPhotos
            photoNorte={photoNorte}
            photoSul={photoSul}
            photoLeste={photoLeste}
            photoOeste={photoOeste}
            onPhotoAdded={handlePhotoAdded}
            onPhotoRemoved={handlePhotoRemoved}
          />
        );
      case 3:
        return (
          <StepTaxonomy
            taxons={taxons}
            onTaxonCountChange={handleTaxonCountChange}
            onTaxonCountSet={handleTaxonCountSet}
          />
        );
      case 4:
        return (
          <StepLocation
            locationMode={locationMode}
            setLocationMode={setLocationMode}
            city={city}
            setCity={setCity}
            state={state}
            setState={setState}
            country={country}
            setCountry={setCountry}
            latitude={latitude}
            setLatitude={setLatitude}
            longitude={longitude}
            setLongitude={setLongitude}
          />
        );
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          {/* Header do Wizard */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Nova Amostra</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#4b5563" />
            </TouchableOpacity>
          </View>

          {/* Indicador de Passos */}
          <View style={styles.stepIndicatorContainer}>
            {(["1", "2", "3", "4"] as const).map((stepNum, idx) => (
              <View key={stepNum} style={styles.stepWrapper}>
                <View
                  style={[
                    styles.stepCircle,
                    step === idx + 1
                      ? styles.stepCircleActive
                      : idx + 1 < step
                      ? styles.stepCircleCompleted
                      : null,
                  ]}
                >
                  <Text
                    style={[
                      styles.stepText,
                      step === idx + 1 && styles.stepTextActive,
                    ]}
                  >
                    {stepNum}
                  </Text>
                </View>
                {idx < 3 && <View style={styles.stepConnector} />}
              </View>
            ))}
          </View>

          {/* Conteúdo Modularizado do Passo */}
          <View style={styles.stepContent}>{renderTabContent()}</View>

          {/* Footer do Wizard (Navegação de passos) */}
          <View style={styles.modalFooter}>
            {step > 1 ? (
              <TouchableOpacity
                style={styles.backStepButton}
                onPress={handleBack}
              >
                <Text style={styles.backStepButtonText}>Voltar</Text>
              </TouchableOpacity>
            ) : (
              <View style={{ width: 80 }} />
            )}

            {step < 4 ? (
              <TouchableOpacity
                style={styles.nextStepButton}
                onPress={handleNext}
              >
                <Text style={styles.nextStepButtonText}>Próximo</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.saveStepButton}
                onPress={handleSaveSample}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.saveStepButtonText}>Salvar Amostra</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    height: "90%",
    paddingBottom: Platform.OS === "ios" ? 34 : 24,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderColor: "#f3f4f6",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1f2937",
  },
  closeButton: {
    padding: 4,
  },
  stepIndicatorContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 14,
    backgroundColor: "#f9fafb",
    borderBottomWidth: 1,
    borderColor: "#f3f4f6",
  },
  stepWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
  },
  stepCircleActive: {
    backgroundColor: "#54A676",
  },
  stepCircleCompleted: {
    backgroundColor: "#54A676",
  },
  stepText: {
    color: "#6b7280",
    fontSize: 12,
    fontWeight: "bold",
  },
  stepTextActive: {
    color: "#ffffff",
  },
  stepConnector: {
    width: 32,
    height: 3,
    backgroundColor: "#e5e7eb",
    marginHorizontal: 8,
  },
  stepContent: {
    flex: 1,
    padding: 24,
  },
  modalFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderColor: "#f3f4f6",
  },
  backStepButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  backStepButtonText: {
    color: "#4b5563",
    fontSize: 14,
    fontWeight: "bold",
  },
  nextStepButton: {
    backgroundColor: "#54A676",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  nextStepButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "bold",
  },
  saveStepButton: {
    backgroundColor: "#54A676",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  saveStepButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "bold",
  },
});
