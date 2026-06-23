import React from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

interface StepPhotosProps {
  photoNorte: string[];
  photoSul: string[];
  photoLeste: string[];
  photoOeste: string[];
  onPhotoAdded: (
    direction: "norte" | "sul" | "leste" | "oeste",
    uri: string
  ) => void;
  onPhotoRemoved: (
    direction: "norte" | "sul" | "leste" | "oeste",
    index: number
  ) => void;
}

export default function StepPhotos({
  photoNorte,
  photoSul,
  photoLeste,
  photoOeste,
  onPhotoAdded,
  onPhotoRemoved,
}: StepPhotosProps) {
  // Apresentar as opções de Câmera ou Galeria de forma amigável
  const handleAddImage = async (
    direction: "norte" | "sul" | "leste" | "oeste"
  ) => {
    Alert.alert(
      "Anexar Foto",
      "Escolha como deseja adicionar a imagem do monólito:",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Tirar Foto (Câmera)",
          onPress: () => openPicker(direction, "camera"),
        },
        {
          text: "Escolher da Galeria",
          onPress: () => openPicker(direction, "gallery"),
        },
      ]
    );
  };

  const openPicker = async (
    direction: "norte" | "sul" | "leste" | "oeste",
    source: "camera" | "gallery"
  ) => {
    try {
      if (source === "camera") {
        // Solicitar permissão de câmera
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            "Permissão de Câmera Negada",
            "Precisamos de acesso à câmera do seu celular para tirar fotos em campo."
          );
          return;
        }

        const result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          quality: 0.7,
        });

        if (!result.canceled && result.assets && result.assets[0].uri) {
          onPhotoAdded(direction, result.assets[0].uri);
        }
      } else {
        // Solicitar permissão de galeria
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            "Permissão de Galeria Negada",
            "Precisamos de acesso às fotos para selecionar imagens salvas."
          );
          return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          quality: 0.7,
        });

        if (!result.canceled && result.assets && result.assets[0].uri) {
          onPhotoAdded(direction, result.assets[0].uri);
        }
      }
    } catch (error) {
      Alert.alert("Erro", "Não foi possível carregar a imagem.");
    }
  };

  const renderDirectionSection = (
    dir: "norte" | "sul" | "leste" | "oeste",
    title: string,
    photos: string[]
  ) => {
    return (
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <Text style={styles.sectionCount}>
            {photos.length} {photos.length === 1 ? "foto" : "fotos"}
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.photosScroll}
        >
          {photos.map((uri, index) => (
            <View key={uri + index} style={styles.imageWrapper}>
              <Image source={{ uri }} style={styles.thumbnail} />
              <TouchableOpacity
                style={styles.deleteBadge}
                onPress={() => onPhotoRemoved(dir, index)}
                activeOpacity={0.7}
              >
                <Ionicons name="close-circle" size={20} color="#ef4444" />
              </TouchableOpacity>
            </View>
          ))}

          {/* Botão de adicionar foto */}
          <TouchableOpacity
            style={styles.addPhotoBtn}
            onPress={() => handleAddImage(dir)}
            activeOpacity={0.8}
          >
            <Ionicons name="camera" size={24} color="#54A676" />
            <Text style={styles.addPhotoText}>Anexar</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.stepTitle}>Passo 2: Anexar Fotos</Text>
      <Text style={styles.stepDesc}>
        Adicione uma ou mais fotos do monólito de solo em cada uma das quatro direções cardeais:
      </Text>

      {renderDirectionSection("norte", "Norte (N)", photoNorte)}
      {renderDirectionSection("sul", "Sul (S)", photoSul)}
      {renderDirectionSection("leste", "Leste (L)", photoLeste)}
      {renderDirectionSection("oeste", "Oeste (O)", photoOeste)}
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
    marginBottom: 20,
  },
  sectionContainer: {
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#374151",
  },
  sectionCount: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "600",
  },
  photosScroll: {
    alignItems: "center",
    paddingRight: 10,
  },
  imageWrapper: {
    position: "relative",
    marginRight: 12,
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: "#cbd5e1",
    borderWidth: 1,
    borderColor: "#cbd5e1",
  },
  deleteBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "#ffffff",
    borderRadius: 10,
  },
  addPhotoBtn: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#54A676",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
  },
  addPhotoText: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#54A676",
    marginTop: 4,
  },
});
