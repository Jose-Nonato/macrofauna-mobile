import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useI18n } from "@/hooks/useI18n";
import YouTubePlayer from "@/components/youtube-player";

export default function StepVideo() {
  const { t } = useI18n();

  return (
    <View style={styles.container}>
      <Text style={styles.stepTitle}>{t("samples.stepVideoTitle")}</Text>
      <Text style={styles.stepDesc}>
        {t("samples.stepVideoDesc")}
      </Text>
      <YouTubePlayer videoId="BZHbNLMpLRs" style={styles.videoContainer} />
    </View>
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
  videoContainer: {
    flex: 1,
  },
});
