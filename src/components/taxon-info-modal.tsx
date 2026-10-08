import React from "react";
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useI18n } from "@/hooks/useI18n";
import { TAXON_IMAGES } from "@/lib/taxonInfo";

interface TaxonInfoModalProps {
  taxonKey: string | null;
  onClose: () => void;
}

export default function TaxonInfoModal({
  taxonKey,
  onClose,
}: TaxonInfoModalProps) {
  const { t } = useI18n();
  const [index, setIndex] = React.useState(0);

  React.useEffect(() => {
    setIndex(0);
  }, [taxonKey]);

  const images = taxonKey ? (TAXON_IMAGES[taxonKey] ?? []) : [];

  return (
    <Modal
      visible={!!taxonKey}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {taxonKey ? t(`taxon.${taxonKey}`) : ""}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color="#475569" />
            </TouchableOpacity>
          </View>

          <ScrollView>
            {images.length > 0 && (
              <View>
                <Image
                  source={{ uri: images[index] }}
                  style={styles.image}
                  resizeMode="cover"
                />
                {images.length > 1 && (
                  <View style={styles.nav}>
                    <TouchableOpacity
                      style={styles.navBtn}
                      onPress={() =>
                        setIndex((i) => (i === 0 ? images.length - 1 : i - 1))
                      }
                    >
                      <Ionicons name="chevron-back" size={20} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.navCount}>
                      {index + 1} / {images.length}
                    </Text>
                    <TouchableOpacity
                      style={styles.navBtn}
                      onPress={() => setIndex((i) => (i + 1) % images.length)}
                    >
                      <Ionicons name="chevron-forward" size={20} color="#fff" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            <Text style={styles.description}>
              {taxonKey ? t(`taxonInfo.${taxonKey}`) : ""}
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    padding: 16,
  },
  content: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 20,
    maxHeight: "85%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: "100%",
    height: 220,
    borderRadius: 14,
    backgroundColor: "#f1f5f9",
  },
  nav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 12,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#14663b",
    alignItems: "center",
    justifyContent: "center",
  },
  navCount: {
    fontSize: 13,
    fontWeight: "600",
    color: "#475569",
    marginHorizontal: 16,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    color: "#4b5563",
    marginTop: 8,
  },
});
