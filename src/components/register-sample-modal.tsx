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
import { createSample, insertInsects, uploadPhoto, updateSample, getInsectsBySample, getPhotosBySample } from "@/lib/services";
import { Ionicons } from "@expo/vector-icons";

// Importação dos passos modularizados do Wizard
import StepVideo from "./register-sample-steps/step-video";
import StepPhotos from "./register-sample-steps/step-photos";
import StepTaxonomy, {
  TAXON_LIST,
  TaxonKey,
} from "./register-sample-steps/step-taxonomy";
import StepLocation from "./register-sample-steps/step-location";

interface RegisterSampleModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  sampleToEdit?: any;
}

export default function RegisterSampleModal({
  visible,
  onClose,
  onSuccess,
  sampleToEdit,
}: RegisterSampleModalProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [loading, setLoading] = useState(false);

  // Passo 2: Fotos (Suporta múltiplas fotos por direção)
  const [photoNorte, setPhotoNorte] = useState<string[]>([]);
  const [photoSul, setPhotoSul] = useState<string[]>([]);
  const [photoLeste, setPhotoLeste] = useState<string[]>([]);
  const [photoOeste, setPhotoOeste] = useState<string[]>([]);

  // Passo 3: Taxonomia da Macrofauna (Suporta múltiplos níveis)
  const [taxonLevels, setTaxonLevels] = useState<Record<TaxonKey, number>[]>([
    {
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
    },
  ]);

  // Passo 4: Localização
  const [locationMode, setLocationMode] = useState<"gps" | "manual">("gps");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("Brasil");
  const [latitude, setLatitude] = useState<string>("");
  const [longitude, setLongitude] = useState<string>("");

  const isLocationFilled = !!(city.trim() && state.trim() && country.trim() && latitude && longitude);

  React.useEffect(() => {
    if (visible) {
      if (sampleToEdit) {
        // Pre-encher estados de localização
        setCity(sampleToEdit.city || "");
        setState(sampleToEdit.state || "");
        setCountry(sampleToEdit.country || "Brasil");
        setLatitude(sampleToEdit.latitude?.toString() || "");
        setLongitude(sampleToEdit.longitude?.toString() || "");
        setLocationMode(sampleToEdit.latitude && sampleToEdit.longitude ? "manual" : "gps");

        // Carregar taxons e fotos da amostra de forma assíncrona
        loadSampleDetails(sampleToEdit.id);
      } else {
        // Modo de criação: resetar tudo
        setStep(1);
        setPhotoNorte([]);
        setPhotoSul([]);
        setPhotoLeste([]);
        setPhotoOeste([]);
        setTaxonLevels([
          {
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
          },
        ]);
        setCity("");
        setState("");
        setCountry("Brasil");
        setLatitude("");
        setLongitude("");
      }
    }
  }, [visible]);

  const loadSampleDetails = async (sampleId: any) => {
    setLoading(true);
    try {
      const [insectsData, photosData] = await Promise.all([
        getInsectsBySample(sampleId),
        getPhotosBySample(sampleId),
      ]);

      if (insectsData && insectsData.length > 0) {
        // Mapear cada linha de inseto retornada para o seu nível correspondente
        const levels = insectsData.map((insect: any) => ({
          earthworm: insect.earthworm || 0,
          ant: insect.ant || 0,
          isoptera: insect.isoptera || 0,
          blattaria: insect.blattaria || 0,
          coleoptera: insect.coleoptera || 0,
          arachnida: insect.arachnida || 0,
          diplopoda: insect.diplopoda || 0,
          chilopoda: insect.chilopoda || 0,
          hemiptera: insect.hemiptera || 0,
          lepidoptera: insect.lepidoptera || 0,
          gasteropoda: insect.gasteropoda || 0,
          others: insect.others || 0,
          dermaptera: insect.dermaptera || 0,
        }));
        setTaxonLevels(levels);
      }

      if (photosData) {
        setPhotoNorte(photosData.filter((p) => p.direction === "norte").map((p) => p.photo));
        setPhotoSul(photosData.filter((p) => p.direction === "sul").map((p) => p.photo));
        setPhotoLeste(photosData.filter((p) => p.direction === "leste").map((p) => p.photo));
        setPhotoOeste(photosData.filter((p) => p.direction === "oeste").map((p) => p.photo));
      }
    } catch (error) {
      console.warn("Erro ao carregar detalhes da amostra para edição:", error);
    } finally {
      setLoading(false);
    }
  };

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

      // 2. Mapeamento e Cálculos de Acordo com a Fórmula Oficial de IQMS e Densidade
      const numLevels = taxonLevels.length;
      const getAverageTaxon = (key: TaxonKey) => {
        const sum = taxonLevels.reduce((acc, lvl) => acc + (lvl[key] || 0), 0);
        return Number((sum / numLevels).toFixed(2));
      };

      const getTotalTaxon = (key: TaxonKey) => {
        return taxonLevels.reduce((acc, lvl) => acc + (lvl[key] || 0), 0);
      };

      const taxValues = {
        EW: getAverageTaxon("earthworm"),
        AN: getAverageTaxon("ant"),
        TER: getAverageTaxon("isoptera"),
        BLA: getAverageTaxon("blattaria"),
        COL: getAverageTaxon("coleoptera"),
        ARA: getAverageTaxon("arachnida"),
        DIPLO: getAverageTaxon("diplopoda"),
        CHI: getAverageTaxon("chilopoda"),
        HEMI: getAverageTaxon("hemiptera"),
        DER: getAverageTaxon("dermaptera"),
        LEP: getAverageTaxon("lepidoptera"),
        GAS: getAverageTaxon("gasteropoda"),
        OT: getAverageTaxon("others"),
      };

      const taxTotals = {
        EW: getTotalTaxon("earthworm"),
        AN: getTotalTaxon("ant"),
        TER: getTotalTaxon("isoptera"),
        BLA: getTotalTaxon("blattaria"),
        COL: getTotalTaxon("coleoptera"),
        ARA: getTotalTaxon("arachnida"),
        DIPLO: getTotalTaxon("diplopoda"),
        CHI: getTotalTaxon("chilopoda"),
        HEMI: getTotalTaxon("hemiptera"),
        DER: getTotalTaxon("dermaptera"),
        LEP: getTotalTaxon("lepidoptera"),
        GAS: getTotalTaxon("gasteropoda"),
        OT: getTotalTaxon("others"),
      };

      const keys = [
        "EW",
        "AN",
        "TER",
        "BLA",
        "COL",
        "ARA",
        "DIPLO",
        "CHI",
        "HEMI",
        "DER",
        "LEP",
        "GAS",
        "OT",
      ] as const;

      const WEIGHTS = {
        EW: 19.2,
        AN: 17.5,
        TER: 20.9,
        BLA: 9.8,
        COL: 20.4,
        ARA: 17.5,
        DIPLO: 20.1,
        CHI: 21.8,
        HEMI: 13.5,
        DER: 8.9,
        LEP: 15.5,
        GAS: 16.7,
        OT: 21.9,
      };

      // 2.1 Quantidade total de animais coletados (animal_quantity) como o somatório
      const totalAnimals = keys.reduce((sum, k) => sum + (taxTotals[k] || 0), 0);

      // 2.2 Log-Densidade (sample_density): log10(Média_Total * 16 + 1)
      const totalAnimalsAverage = keys.reduce((sum, k) => sum + (taxValues[k] || 0), 0);
      const logDensity = Math.log10(totalAnimalsAverage * 16 + 1);
      const densityValue = Number(logDensity.toFixed(2));

      // 2.3 Riqueza de Grupos (rt): Número de classes taxonômicas com quantidade média > 0
      const rt = keys.filter((k) => (taxValues[k] || 0) > 0).length;

      // 2.4 Cálculo do IQMS (sample_score)
      let iqmsSum = 0;
      keys.forEach((k) => {
        const val = taxValues[k] || 0;
        if (val > 0) {
          iqmsSum += Math.log10(WEIGHTS[k] * val);
        }
      });
      if (densityValue > 0) {
        iqmsSum += Math.log10(31.8 * densityValue);
      }
      if (rt > 0) {
        iqmsSum += Math.log10(31.8 * rt);
      }
      const calculatedScore = Number((iqmsSum * 0.0014 + 0.1).toFixed(2));

      // 3. Salvar no Supabase (Diferencia Modo de Edição e Criação)
      let sampleId = "";
      if (sampleToEdit) {
        sampleId = sampleToEdit.id;
        await updateSample(sampleId, {
          sample_score: calculatedScore,
          sample_density: densityValue,
          animal_quantity: totalAnimals,
          country: country.trim(),
          state: state.trim().toUpperCase(),
          city: city.trim(),
          latitude: latitude ? parseFloat(latitude) : null,
          longitude: longitude ? parseFloat(longitude) : null,
        });

        // 4. Salvar Tabela "insect" em Modo de Edição (Deleta anterior e reinsere todos os níveis)
        await supabase.from("insect").delete().eq("sample_id", sampleId);
        const insectsToInsertEdit = taxonLevels.map((level) => ({
          sample_id: sampleId,
          sample_density: densityValue,
          iqms: calculatedScore,
          earthworm: level.earthworm || 0,
          ant: level.ant || 0,
          isoptera: level.isoptera || 0,
          blattaria: level.blattaria || 0,
          coleoptera: level.coleoptera || 0,
          arachnida: level.arachnida || 0,
          diplopoda: level.diplopoda || 0,
          chilopoda: level.chilopoda || 0,
          hemiptera: level.hemiptera || 0,
          lepidoptera: level.lepidoptera || 0,
          gasteropoda: level.gasteropoda || 0,
          others: level.others || 0,
        }));
        await insertInsects(insectsToInsertEdit);

        // 5. Salvar Tabela "photos" em Modo de Edição (Deleta relações anteriores e reinsere)
        await supabase.from("photos").delete().eq("sample_id", sampleId);

        const directions = [
          { paths: photoNorte, key: "norte" },
          { paths: photoSul, key: "sul" },
          { paths: photoLeste, key: "leste" },
          { paths: photoOeste, key: "oeste" },
        ];

        for (const dir of directions) {
          for (const path of dir.paths) {
            if (path.startsWith("http")) {
              // Se já for imagem remota no Storage, apenas reinsere na tabela
              await supabase.from("photos").insert({
                sample_id: sampleId,
                direction: dir.key,
                photo: path,
              });
            } else {
              // Se for URI local nova, faz upload pro Storage
              await uploadPhoto(path, dir.key, sampleId);
            }
          }
        }
      } else {
        // MODO CRIAÇÃO: Criar novo registro
        const sampleData = await createSample({
          sample_score: calculatedScore,
          sample_density: densityValue,
          animal_quantity: totalAnimals,
          country: country.trim(),
          state: state.trim().toUpperCase(),
          city: city.trim(),
          latitude: latitude ? parseFloat(latitude) : null,
          longitude: longitude ? parseFloat(longitude) : null,
        });

        sampleId = sampleData.id;

        // 4. Salvar Tabela "insect" (Insere todos os níveis)
        const insectsToInsert = taxonLevels.map((level) => ({
          sample_id: sampleId,
          sample_density: densityValue,
          iqms: calculatedScore,
          earthworm: level.earthworm || 0,
          ant: level.ant || 0,
          isoptera: level.isoptera || 0,
          blattaria: level.blattaria || 0,
          coleoptera: level.coleoptera || 0,
          arachnida: level.arachnida || 0,
          diplopoda: level.diplopoda || 0,
          chilopoda: level.chilopoda || 0,
          hemiptera: level.hemiptera || 0,
          lepidoptera: level.lepidoptera || 0,
          gasteropoda: level.gasteropoda || 0,
          others: level.others || 0,
        }));
        await insertInsects(insectsToInsert);

        // 5. Enviar e Salvar Fotos
        const directions = [
          { paths: photoNorte, key: "norte" },
          { paths: photoSul, key: "sul" },
          { paths: photoLeste, key: "leste" },
          { paths: photoOeste, key: "oeste" },
        ];

        for (const dir of directions) {
          for (const path of dir.paths) {
            await uploadPhoto(path, dir.key, sampleId);
          }
        }
      }

      // 6. Finalização e Alerta de Sucesso
      const alertTitle = sampleToEdit ? "Amostra Atualizada!" : "Amostra Cadastrada!";
      const alertMessage = sampleToEdit
        ? `Sua amostra foi editada e salva com sucesso no Supabase.\nScore IQMS: ${calculatedScore.toFixed(
            2
          )}/1.0\nDensidade: ${densityValue.toFixed(2)}`
        : `Sua amostra foi gravada com sucesso no Supabase.\nScore IQMS: ${calculatedScore.toFixed(
            2
          )}/1.0\nDensidade: ${densityValue.toFixed(2)}`;

      Alert.alert(
        alertTitle,
        alertMessage,
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
              setTaxonLevels([
                {
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
                },
              ]);
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
            levels={taxonLevels}
            setLevels={setTaxonLevels}
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
            <Text style={styles.modalTitle}>
              {sampleToEdit ? "Editar Amostra" : "Nova Amostra"}
            </Text>
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
                style={[styles.saveStepButton, !isLocationFilled && styles.saveStepButtonDisabled]}
                onPress={handleSaveSample}
                disabled={loading || !isLocationFilled}
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
  saveStepButtonDisabled: {
    backgroundColor: "#94a3b8",
  },
  saveStepButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "bold",
  },
});
