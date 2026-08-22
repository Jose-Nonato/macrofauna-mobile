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
import { createSample, insertInsects, updateSample, getInsectsBySample, getPhotosBySample } from "@/lib/services";
import { uploadPhotoToStorage } from "@/lib/uploadService";
import { Ionicons } from "@expo/vector-icons";
import { useI18n } from "@/hooks/useI18n";

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
  const { t } = useI18n();
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
      diptera_larvae: 0,
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
            diptera_larvae: 0,
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
          diptera_larvae: insect.diptera_larvae || 0,
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
        t("samples.requiredFields"),
        t("samples.fillCityState")
      );
      return;
    }

    setLoading(true);
    let sampleId = "";

    try {

      // 1. Obter Usuário Autenticado
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error(t("auth.notAuthenticated"));

      // 2. Cálculos de acordo com a fórmula do indicador global de macrofauna
      // (Hurtado Lugo, Velasquez & Lavelle, 2023 — Applied Soil Ecology 193, Eq. 1-4;
      // pesos DN/TR e a normalização final vêm dessa mesma referência).
      // "Níveis" representam as camadas de profundidade da amostragem ISO/TSBF
      // (serrapilheira, 0-10, 10-20, 20-30 cm) e por isso são SOMADAS, não
      // promediadas, para reconstituir a contagem total do ponto amostral.
      const getTotalTaxon = (key: TaxonKey) => {
        return taxonLevels.reduce((acc, lvl) => acc + (lvl[key] || 0), 0);
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
        DL: getTotalTaxon("diptera_larvae"),
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
        "DL",
        "OT",
      ] as const;

      // Pesos (Vi) da Eq. 3 do artigo (fórmula global, 3.694 sites)
      const WEIGHTS = {
        EW: 18.3,
        AN: 16.83,
        TER: 9.2,
        BLA: 7.69,
        COL: 19.62,
        ARA: 15.09,
        DIPLO: 18.78,
        CHI: 20.12,
        HEMI: 11.29,
        DER: 7.58,
        LEP: 9.15,
        GAS: 15.08,
        DL: 16.31,
        OT: 19.82,
      };
      const WEIGHT_DN = 24.74; // peso da densidade total (DN)
      const WEIGHT_TR = 27.88; // peso da riqueza taxonômica (TR)

      // 2.1 Quantidade total de animais coletados (animal_quantity)
      const totalAnimals = keys.reduce((sum, k) => sum + (taxTotals[k] || 0), 0);

      // 2.2 Densidade (sample_density): amostra ISO/TSBF de 25x25 cm = 0,0625 m²,
      // logo 1/0,0625 = 16 converte a contagem do monólito para indivíduos/m².
      // DN = log10(densidade_m2 + 1), como no artigo.
      const densityPerM2 = totalAnimals * 16;
      const densityValue = Number(Math.log10(densityPerM2 + 1).toFixed(2));

      // 2.3 Riqueza de Grupos (rt): número de táxons com contagem total > 0
      const rt = keys.filter((k) => (taxTotals[k] || 0) > 0).length;

      // 2.4 RawI (Eq. 3): soma ponderada de log10(contagem + 1) por táxon,
      // mais os termos de densidade (DN) e riqueza (TR)
      let rawI = 0;
      keys.forEach((k) => {
        rawI += WEIGHTS[k] * Math.log10((taxTotals[k] || 0) + 1);
      });
      rawI += WEIGHT_DN * densityValue;
      rawI += WEIGHT_TR * Math.log10(rt + 1);

      // 2.5 Normalização final (Eq. 4): I = 0,9*RawI/Max + 0,1 = 0,0014*RawI + 0,1
      // limitado a [0.1, 1.0] pois o Max=643 do artigo é específico do dataset global
      const rawScore = rawI * 0.0014 + 0.1;
      const calculatedScore = Number(Math.min(1, Math.max(0.1, rawScore)).toFixed(2));

      // 3. Preparar dados dos insetos antes de qualquer operação no banco
      const insectsToInsert = taxonLevels.map((level) => ({
        sample_id: sampleToEdit ? sampleToEdit.id : "", // será preenchido após criar amostra
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
        dermaptera: level.dermaptera || 0,
        diptera_larvae: level.diptera_larvae || 0,
        others: level.others || 0,
      }));

      const sampleData = {
        sample_score: calculatedScore,
        sample_density: densityValue,
        animal_quantity: totalAnimals,
        country: country.trim(),
        state: state.trim().toUpperCase(),
        city: city.trim(),
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
      };

      // 4. Se modo criação, criar amostra primeiro
      let sampleCreatedForRollback = false;

      try {
        if (!sampleToEdit) {
          const result = await createSample(sampleData);
          sampleId = result.id;
          sampleCreatedForRollback = true;
          // Atualizar insectsToInsert com o novo sampleId
          insectsToInsert.forEach((insect) => {
            insect.sample_id = sampleId;
          });
        } else {
          sampleId = sampleToEdit.id;
          // Atualizar amostra existente
          await updateSample(sampleId, sampleData);
          // Deletar insetos e fotos anteriores
          await supabase.from("insect").delete().eq("sample_id", sampleId);
          await supabase.from("photos").delete().eq("sample_id", sampleId);
        }

        // 5. Inserir insetos
        await insertInsects(insectsToInsert);

        // 6. Fazer upload e salvar fotos
        const directions = [
          { paths: photoNorte, key: "norte" },
          { paths: photoSul, key: "sul" },
          { paths: photoLeste, key: "leste" },
          { paths: photoOeste, key: "oeste" },
        ];

        for (const dir of directions) {
          for (const path of dir.paths) {
            if (!path.startsWith("http")) {
              // Se for URI local, faz upload pro Storage com novo serviço
              await uploadPhotoToStorage(path, dir.key, sampleId);
            } else if (sampleToEdit) {
              // Se for imagem remota em modo edição, apenas reinsere na tabela
              await supabase.from("photos").insert({
                sample_id: sampleId,
                direction: dir.key,
                photo: path,
              });
            }
          }
        }
      } catch (photoError: any) {

        // Rollback: deletar amostra criada se algo der erro
        if (sampleCreatedForRollback && sampleId) {
          try {
            await supabase.from("samples").delete().eq("id", sampleId);
          } catch (rollbackError) {
          }
        }

        // Relançar o erro original
        throw photoError;
      }

      // 7. Finalização e Alerta de Sucesso
      const alertTitle = sampleToEdit ? t("samples.sampleUpdated") : t("samples.sampleCreated");
      const alertMessage = sampleToEdit
        ? `${t("samples.editedSuccess")}\nScore IQMS: ${calculatedScore.toFixed(
            2
          )}/1.0\n${t("home.density")}: ${densityValue.toFixed(2)}`
        : `${t("samples.savedSuccess")}\nScore IQMS: ${calculatedScore.toFixed(
            2
          )}/1.0\n${t("home.density")}: ${densityValue.toFixed(2)}`;

      Alert.alert(
        alertTitle,
        alertMessage,
        [
          {
            text: t("common.finish"),
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
                  diptera_larvae: 0,
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
      Alert.alert(t("samples.errorSaving"), err.message || t("samples.unexpectedError"));
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
              {sampleToEdit ? t("home.editSample") : t("home.newSample")}
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
                <Text style={styles.backStepButtonText}>{t("common.back")}</Text>
              </TouchableOpacity>
            ) : (
              <View style={{ width: 80 }} />
            )}

            {step < 4 ? (
              <TouchableOpacity
                style={styles.nextStepButton}
                onPress={handleNext}
              >
                <Text style={styles.nextStepButtonText}>{t("common.next")}</Text>
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
                  <Text style={styles.saveStepButtonText}>{t("common.save")}</Text>
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
