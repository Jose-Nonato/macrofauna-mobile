import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function ReportsTab() {
  return (
    <View style={styles.container}>
      <Text style={styles.tabTitle}>Relatórios</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9fafb",
  },
  tabTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1f2937",
  },
});
