import React from "react";
import { StyleSheet, View, Platform, StyleProp, ViewStyle } from "react-native";
import { WebView } from "react-native-webview";

// O YouTube exige um Referer identificando o app (senão mostra "Erro 153"),
// por isso no nativo o player é carregado dentro de um HTML com baseUrl do app
const APP_REFERER = "https://com.josenonato.macrofaunamobile";

interface YouTubePlayerProps {
  videoId: string;
  style?: StyleProp<ViewStyle>;
}

export default function YouTubePlayer({ videoId, style }: YouTubePlayerProps) {
  const embedUrl = `https://www.youtube.com/embed/${videoId}`;

  return (
    <View style={[styles.container, style]}>
      {Platform.OS === "web" ? (
        <iframe
          width="100%"
          height="100%"
          src={embedUrl}
          referrerPolicy="strict-origin-when-cross-origin"
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          style={{ border: "none", borderRadius: 12 }}
          allowFullScreen
        />
      ) : (
        <WebView
          style={styles.webView}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          allowsFullscreenVideo={true}
          allowsInlineMediaPlayback={true}
          source={{
            html: `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>html,body{margin:0;height:100%;background:#000}iframe{border:0;width:100%;height:100%}</style></head><body><iframe src="${embedUrl}?playsinline=1" referrerpolicy="strict-origin-when-cross-origin" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe></body></html>`,
            baseUrl: APP_REFERER,
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 220,
    backgroundColor: "#000000",
    borderRadius: 12,
    overflow: "hidden",
  },
  webView: {
    flex: 1,
  },
});
