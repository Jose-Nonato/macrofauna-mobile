import React from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from "react-native";

export const TAXON_LABELS = {
  earthworm: { pt: "Minhoca", science: "Oligochaeta" },
  ant: { pt: "Formiga", science: "Formicidae" },
  isoptera: { pt: "Cupim", science: "Isoptera" },
  blattaria: { pt: "Barata", science: "Blattaria" },
  coleoptera: { pt: "Besouro", science: "Coleoptera" },
  arachnida: { pt: "Aranha/Escorpião", science: "Arachnida" },
  diplopoda: { pt: "Piolho-de-cobra", science: "Diplopoda" },
  chilopoda: { pt: "Lacraia/Centopéia", science: "Chilopoda" },
  hemiptera: { pt: "Percevejo/Cigarra", science: "Hemiptera" },
  lepidoptera: { pt: "Borboleta/Lagarta", science: "Lepidoptera" },
  gasteropoda: { pt: "Caracol/Lesma", science: "Gasteropoda" },
  dermaptera: { pt: "Tesourinha", science: "Dermaptera" },
  others: { pt: "Outros Invertebrados", science: "Vários" },
};

export type TaxonKey = keyof typeof TAXON_LABELS;

interface StepTaxonomyProps {
  taxons: Record<TaxonKey, number>;
  onTaxonCountChange: (key: TaxonKey, amount: number) => void;
  onTaxonCountSet: (key: TaxonKey, value: number) => void;
}

export default function StepTaxonomy({
  taxons,
  onTaxonCountChange,
  onTaxonCountSet,
}: StepTaxonomyProps) {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.stepTitle}>Passo 3: Taxonomia</Text>
      <Text style={styles.stepDesc}>
        Indique a quantidade encontrada para cada classe taxonômica de invertebrados:
      </Text>

      <View style={styles.taxonList}>
        {(Object.keys(TAXON_LABELS) as TaxonKey[]).map((key) => {
          const label = TAXON_LABELS[key];
          return (
            <View key={key} style={styles.taxonItem}>
              <View style={styles.taxonInfo}>
                <Text style={styles.taxonPT}>{label.pt}</Text>
                <Text style={styles.taxonScience}>{label.science}</Text>
              </View>

              <View style={styles.taxonCounter}>
                {/* Decrementar */}
                <TouchableOpacity
                  style={styles.counterBtn}
                  onPress={() => onTaxonCountChange(key, -1)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.counterBtnText}>-</Text>
                </TouchableOpacity>

                {/* Input de Quantidade Manual */}
                <TextInput
                  style={styles.counterInput}
                  keyboardType="numeric"
                  value={taxons[key]?.toString() || "0"}
                  onChangeText={(text) => {
                    const sanitized = text.replace(/[^0-9]/g, "");
                    const parsed = parseInt(sanitized, 10);
                    onTaxonCountSet(key, isNaN(parsed) ? 0 : parsed);
                  }}
                  selectTextOnFocus={true}
                />

                {/* Incrementar */}
                <TouchableOpacity
                  style={styles.counterBtn}
                  onPress={() => onTaxonCountChange(key, 1)}
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
  taxonPT: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 2,
  },
  taxonScience: {
    fontSize: 11,
    color: "#54A676",
    fontWeight: "600",
    fontStyle: "italic",
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
