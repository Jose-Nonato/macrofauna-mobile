import React from "react";
import { StyleSheet, Text, View, Platform } from "react-native";
import { WebView } from "react-native-webview";

export default function StepVideo() {
  return (
    <View style={styles.container}>
      <Text style={styles.stepTitle}>Passo 1: Vídeo Informativo</Text>
      <Text style={styles.stepDesc}>
        Assista a essa breve explicação antes de coletar e registrar sua amostra de macrofauna de solo:
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
