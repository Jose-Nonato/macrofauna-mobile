import React from "react";
import { StyleSheet, Text, View, Platform } from "react-native";
import { WebView } from "react-native-webview";
import { useI18n } from "@/hooks/useI18n";

export default function StepVideo() {
  const { t } = useI18n();

  return (
    <View style={styles.container}>
      <Text style={styles.stepTitle}>{t("samples.stepVideoTitle")}</Text>
      <Text style={styles.stepDesc}>
        {t("samples.stepVideoDesc")}
      </Text>
      <View style={styles.videoContainer}>
        {Platform.OS === "web" ? (
          <iframe
            width="100%"
            height="100%"
            src="https://www.youtube.com/embed/dQw4w9WgXcQ"
            style={{ border: "none", borderRadius: 12 }}
            allowFullScreen
          />
        ) : (
          <WebView
            style={styles.webView}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            source={{ uri: "https://www.youtube.com/embed/dQw4w9WgXcQ" }}
          />
        )}
      </View>
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
    backgroundColor: "#000000",
    borderRadius: 12,
    overflow: "hidden",
    height: 220,
  },
  webView: {
    flex: 1,
  },
});
