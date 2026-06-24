import React from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export const TAXON_LIST = [
  { key: "earthworm", label: "Earthworm (EW)", subtitle: "Minhoca" },
  { key: "ant", label: "Ant (AN)", subtitle: "Formiga" },
  { key: "isoptera", label: "Isoptera (TER)", subtitle: "Cupins" },
  { key: "blattaria", label: "Blattaria (BLA)", subtitle: "Barata" },
  { key: "coleoptera", label: "Coleoptera (COL)", subtitle: "Besouro" },
  { key: "arachnida", label: "Arachnida (ARA)", subtitle: "Aranha" },
  { key: "diplopoda", label: "Diplopoda (DIPLO)", subtitle: "Diplópode" },
  { key: "chilopoda", label: "Chilopoda (CHI)", subtitle: "Quilópode" },
  { key: "hemiptera", label: "Hemiptera (HEMI)", subtitle: "Percevejo" },
  { key: "dermaptera", label: "Dermaptera (DER)", subtitle: "Tesourinha" },
  { key: "lepidoptera", label: "Lepidoptera (LEP)", subtitle: "Lagarta" },
  { key: "gasteropoda", label: "Gasteropoda (GAS)", subtitle: "Caracóis e Lesmas" },
  { key: "others", label: "Outros (OT)", subtitle: "Outros" },
] as const;

export type TaxonKey = typeof TAXON_LIST[number]["key"];

interface StepTaxonomyProps {
  levels: Record<TaxonKey, number>[];
  setLevels: React.Dispatch<React.SetStateAction<Record<TaxonKey, number>[]>>;
}

export default function StepTaxonomy({
  levels,
  setLevels,
}: StepTaxonomyProps) {
  const [activeLevelIdx, setActiveLevelIdx] = React.useState(0);

  const handleAddLevel = () => {
    const emptyLevel: Record<TaxonKey, number> = {
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
    setLevels((prev) => [...prev, emptyLevel]);
    setActiveLevelIdx(levels.length); // muda para o nível recém-criado
  };

  const handleRemoveLevel = (indexToRemove: number) => {
    if (levels.length <= 1) return;
    setLevels((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    setActiveLevelIdx((prev) => Math.max(0, prev - 1));
  };

  const handleTaxonCountChange = (key: TaxonKey, amount: number) => {
    setLevels((prev) => {
      const updated = [...prev];
      updated[activeLevelIdx] = {
        ...updated[activeLevelIdx],
        [key]: Math.max(0, (updated[activeLevelIdx][key] || 0) + amount),
      };
      return updated;
    });
  };

  const handleTaxonCountSet = (key: TaxonKey, value: number) => {
    setLevels((prev) => {
      const updated = [...prev];
      updated[activeLevelIdx] = {
        ...updated[activeLevelIdx],
        [key]: Math.max(0, value),
      };
      return updated;
    });
  };

  const currentTaxons = levels[activeLevelIdx] || {};

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.stepTitle}>Passo 3: Taxonomia</Text>
      <Text style={styles.stepDesc}>
        Adicione múltiplos níveis de amostra e indique a quantidade de invertebrados para cada nível:
      </Text>

      {/* Cabeçalho dos Níveis */}
      <View style={styles.levelsHeader}>
        <Text style={styles.levelsTitle}>Níveis de Amostragem</Text>
        <View style={styles.levelsActions}>
          {levels.length > 1 && (
            <TouchableOpacity
              style={[styles.levelActionBtn, styles.levelRemoveBtn]}
              onPress={() => handleRemoveLevel(activeLevelIdx)}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={14} color="#ef4444" />
              <Text style={styles.levelRemoveText}>Excluir</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.levelActionBtn}
            onPress={handleAddLevel}
            activeOpacity={0.7}
          >
            <Ionicons name="add-circle" size={14} color="#54A676" />
            <Text style={styles.levelAddText}>Novo Nível</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs Horizontais para seleção de nível */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.levelsTabsScroll}
      >
        {levels.map((_, idx) => (
          <TouchableOpacity
            key={idx}
            style={[
              styles.levelTab,
              activeLevelIdx === idx && styles.levelTabActive,
            ]}
            onPress={() => setActiveLevelIdx(idx)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.levelTabText,
                activeLevelIdx === idx && styles.levelTabTextActive,
              ]}
            >
              Nível {idx + 1}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Lista de Invertebrados para o Nível Ativo */}
      <View style={styles.taxonList}>
        {TAXON_LIST.map((item) => {
          return (
            <View key={item.key} style={styles.taxonItem}>
              <View style={styles.taxonInfo}>
                <Text style={styles.taxonLabel}>{item.label}</Text>
                <Text style={styles.taxonSubtitle}>{item.subtitle}</Text>
              </View>

              <View style={styles.taxonCounter}>
                {/* Decrementar */}
                <TouchableOpacity
                  style={styles.counterBtn}
                  onPress={() => handleTaxonCountChange(item.key, -1)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.counterBtnText}>-</Text>
                </TouchableOpacity>

                {/* Input de Quantidade Manual */}
                <TextInput
                  style={styles.counterInput}
                  keyboardType="numeric"
                  value={currentTaxons[item.key]?.toString() || "0"}
                  onChangeText={(text) => {
                    const sanitized = text.replace(/[^0-9]/g, "");
                    const parsed = parseInt(sanitized, 10);
                    handleTaxonCountSet(item.key, isNaN(parsed) ? 0 : parsed);
                  }}
                  selectTextOnFocus={true}
                />

                {/* Incrementar */}
                <TouchableOpacity
                  style={styles.counterBtn}
                  onPress={() => handleTaxonCountChange(item.key, 1)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.counterBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </View>
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
  levelsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    marginTop: 8,
  },
  levelsTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#374151",
  },
  levelsActions: {
    flexDirection: "row",
  },
  levelActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginLeft: 8,
  },
  levelRemoveBtn: {
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
  },
  levelAddText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#54A676",
    marginLeft: 4,
  },
  levelRemoveText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#ef4444",
    marginLeft: 4,
  },
  levelsTabsScroll: {
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    marginBottom: 16,
  },
  levelTab: {
    backgroundColor: "#f1f5f9",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  levelTabActive: {
    backgroundColor: "#54A676",
    borderColor: "#54A676",
  },
  levelTabText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#475569",
  },
  levelTabTextActive: {
    color: "#ffffff",
  },
  taxonList: {
    marginTop: 8,
  },
  taxonItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  taxonInfo: {
    flex: 1,
  },
  taxonLabel: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 2,
  },
  taxonSubtitle: {
    fontSize: 12,
    color: "#54A676",
    fontWeight: "600",
  },
  taxonCounter: {
    flexDirection: "row",
    alignItems: "center",
  },
  counterBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    alignItems: "center",
    justifyContent: "center",
  },
  counterBtnText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#475569",
  },
  counterInput: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#0f172a",
    width: 52,
    height: 32,
    textAlign: "center",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 6,
    padding: 0,
    marginHorizontal: 8,
  },
});
