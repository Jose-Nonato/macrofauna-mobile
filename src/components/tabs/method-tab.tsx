import React from "react";
import { StyleSheet, Text, View, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useI18n } from "@/hooks/useI18n";
import YouTubePlayer from "@/components/youtube-player";

const OBJECTIVE_CARDS = [
  { key: "soilQuality", icon: "leaf-outline" },
  { key: "biologicalIndicators", icon: "bug-outline" },
  { key: "environmentalMonitoring", icon: "analytics-outline" },
] as const;

const STEPS = ["step1", "step2", "step3", "step4", "step5", "step6"] as const;

const MAIN_GROUPS = ["earthworms", "ants", "termites", "beetles"] as const;

// Faixas iguais às usadas nas categorias do relatório (reports-tab)
const SCORE_RANGES = [
  { range: "0.75 - 1.00", key: "excellent", color: "#10b981" },
  { range: "0.50 - 0.74", key: "good", color: "#f59e0b" },
  { range: "0.25 - 0.49", key: "intermediate", color: "#ef4444" },
  { range: "0.00 - 0.24", key: "low", color: "#7f1d1d" },
] as const;

export default function MethodTab() {
  const { t } = useI18n();

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Apresentação */}
        <View style={styles.hero}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{t("method.badge")}</Text>
          </View>
          <Text style={styles.heroTitle}>{t("method.title")}</Text>
          <Text style={styles.heroDesc}>{t("method.description")}</Text>
        </View>

        {/* Objetivo */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("method.objective.title")}</Text>
          <Text style={styles.sectionDesc}>{t("method.objective.description")}</Text>
          {OBJECTIVE_CARDS.map(({ key, icon }) => (
            <View key={key} style={styles.card}>
              <Ionicons name={icon} size={22} color="#54A676" style={styles.cardIcon} />
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{t(`method.objective.${key}`)}</Text>
                <Text style={styles.cardDesc}>{t(`method.objective.${key}Desc`)}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Como realizar a coleta */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("method.howTo.title")}</Text>
          {STEPS.map((step, index) => (
            <View key={step} style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{index + 1}</Text>
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{t(`method.howTo.${step}`)}</Text>
                <Text style={styles.cardDesc}>{t(`method.howTo.${step}Desc`)}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Principais grupos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("method.mainGroups.title")}</Text>
          {MAIN_GROUPS.map((group) => (
            <View key={group} style={styles.card}>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{t(`method.mainGroups.${group}`)}</Text>
                <Text style={styles.cardDesc}>{t(`method.mainGroups.${group}Desc`)}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Interpretação do score */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("method.interpretation.title")}</Text>
          {SCORE_RANGES.map(({ range, key, color }) => (
            <View key={key} style={[styles.card, { borderLeftWidth: 4, borderLeftColor: color }]}>
              <View style={styles.cardContent}>
                <Text style={[styles.cardTitle, { color }]}>{range}</Text>
                <Text style={styles.cardDesc}>{t(`method.interpretation.${key}`)}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Vídeo */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("method.video")}</Text>
          <YouTubePlayer videoId="BZHbNLMpLRs" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  content: {
    paddingBottom: 24,
  },
  hero: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "#e8f5ee",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 10,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#54A676",
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1f2937",
  },
  heroDesc: {
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 20,
    marginTop: 8,
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 8,
  },
  sectionDesc: {
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 20,
    marginBottom: 12,
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 13,
    color: "#6b7280",
    lineHeight: 18,
  },
  step: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#54A676",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  stepNumberText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 14,
  },
});
