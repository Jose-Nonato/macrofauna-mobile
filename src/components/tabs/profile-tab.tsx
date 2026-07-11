import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Platform,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { supabase } from "@/lib/supabase";
import {
  getUserProfile,
  updateUserProfile,
  deleteUserAccount,
  getUserEmail,
  UserProfile,
} from "@/lib/profileService";
import { countries, getStates, getCities } from "@/lib/locationData";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function ProfileTab() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editData, setEditData] = useState({
    name: "",
    country: "Brasil",
    state: "",
    city: "",
    profession: "",
    bachelor: "",
    university: "",
    birth_date: "",
  });
  const [saving, setSaving] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [states, setStates] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);

  useEffect(() => {
    loadProfile();
    updateStates("Brasil");
  }, []);

  useEffect(() => {
    updateCities(editData.country, editData.state);
  }, [editData.state]);

  function updateStates(country: string) {
    const stateList = getStates(country);
    setStates(stateList);
    setEditData((prev) => ({
      ...prev,
      country,
      state: stateList[0] || "",
      city: "",
    }));
  }

  function updateCities(country: string, state: string) {
    const cityList = getCities(country, state);
    setCities(cityList);
    if (cityList.length > 0 && !cityList.includes(editData.city)) {
      setEditData((prev) => ({
        ...prev,
        city: cityList[0],
      }));
    }
  }

  async function loadProfile() {
    try {
      setLoading(true);

      const userEmail = await getUserEmail();
      setEmail(userEmail || "");

      let userProfile = await getUserProfile();

      if (userProfile) {
        setProfile(userProfile);
        const country = userProfile.country || "Brasil";
        const state = userProfile.state || "";

        setEditData({
          name: userProfile.name || "",
          country: country,
          state: state || "",
          city: userProfile.city || "",
          profession: userProfile.profession || "",
          bachelor: userProfile.bachelor || "",
          university: userProfile.university || "",
          birth_date: userProfile.birth_date || "",
        });

        updateStates(country);
        if (state) {
          updateCities(country, state);
        }
      }
    } catch (error: any) {
      Alert.alert("Erro", "Não foi possível carregar o perfil");
    } finally {
      setLoading(false);
    }
  }

  function handleDateChange(event: any, selectedDate?: Date) {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }

    if (selectedDate) {
      const dateString = selectedDate.toISOString().split("T")[0];
      setEditData({ ...editData, birth_date: dateString });
    }
  }

  function handleOpenEditModal() {
    setEditModalVisible(true);
  }

  async function handleSaveProfile() {
    try {
      setSaving(true);

      if (!profile) {
        throw new Error("Perfil não encontrado");
      }

      await updateUserProfile({
        ...profile,
        ...editData,
      });

      setProfile((prev) =>
        prev ? { ...prev, ...editData } : null
      );

      Alert.alert("Sucesso", "Perfil atualizado com sucesso!");
      setEditModalVisible(false);
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Erro ao salvar perfil");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteAccount() {
    Alert.alert(
      "Deletar Conta",
      "Tem certeza que deseja deletar sua conta? Esta ação é irreversível.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Deletar",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              await deleteUserAccount();
              await supabase.auth.signOut();
              router.replace("/login");
            } catch (error: any) {
              Alert.alert("Erro", error.message || "Erro ao deletar conta");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  }

  async function handleLogout() {
    Alert.alert("Sair da Conta", "Deseja realmente sair?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: async () => {
          try {
            setLoading(true);
            await supabase.auth.signOut();
            router.replace("/login");
          } catch (error: any) {
            Alert.alert("Erro", error.message || "Erro ao fazer logout");
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  }

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#54A676" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person-circle" size={80} color="#54A676" />
          </View>
          <Text style={styles.nameText}>{profile?.name || "Usuário"}</Text>
          <Text style={styles.emailText}>{email}</Text>
        </View>

        {/* Personal Info Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Informações Pessoais</Text>
            <TouchableOpacity
              onPress={handleOpenEditModal}
              style={styles.editButton}
            >
              <Ionicons name="pencil" size={20} color="#54A676" />
            </TouchableOpacity>
          </View>

          <View style={styles.infoItem}>
            <View style={styles.infoIconContainer}>
              <Ionicons name="person" size={20} color="#54A676" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Nome</Text>
              <Text style={styles.infoValue}>
                {profile?.name || "Não informado"}
              </Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <View style={styles.infoIconContainer}>
              <Ionicons name="calendar" size={20} color="#54A676" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Data de Nascimento</Text>
              <Text style={styles.infoValue}>
                {profile?.birth_date
                  ? new Date(profile.birth_date).toLocaleDateString("pt-BR")
                  : "Não informado"}
              </Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <View style={styles.infoIconContainer}>
              <Ionicons name="briefcase" size={20} color="#54A676" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Profissão</Text>
              <Text style={styles.infoValue}>
                {profile?.profession || "Não informado"}
              </Text>
            </View>
          </View>
        </View>

        {/* Education Info Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Formação Acadêmica</Text>

          <View style={styles.infoItem}>
            <View style={styles.infoIconContainer}>
              <Ionicons name="book" size={20} color="#54A676" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Graduação</Text>
              <Text style={styles.infoValue}>
                {profile?.bachelor || "Não informado"}
              </Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <View style={styles.infoIconContainer}>
              <Ionicons name="school" size={20} color="#54A676" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Universidade</Text>
              <Text style={styles.infoValue}>
                {profile?.university || "Não informado"}
              </Text>
            </View>
          </View>
        </View>

        {/* Location Info Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Localização</Text>

          <View style={styles.infoItem}>
            <View style={styles.infoIconContainer}>
              <Ionicons name="globe" size={20} color="#54A676" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>País</Text>
              <Text style={styles.infoValue}>
                {profile?.country || "Não informado"}
              </Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <View style={styles.infoIconContainer}>
              <Ionicons name="map" size={20} color="#54A676" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Estado</Text>
              <Text style={styles.infoValue}>
                {profile?.state || "Não informado"}
              </Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <View style={styles.infoIconContainer}>
              <Ionicons name="location" size={20} color="#54A676" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Cidade</Text>
              <Text style={styles.infoValue}>
                {profile?.city || "Não informado"}
              </Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Ionicons name="log-out" size={20} color="#ffffff" />
            <Text style={styles.logoutButtonText}>Sair da Conta</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDeleteAccount}
          >
            <Ionicons name="trash" size={20} color="#ffffff" />
            <Text style={styles.deleteButtonText}>Deletar Conta</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Editar Perfil</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close" size={24} color="#1f2937" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>Nome</Text>
              <TextInput
                style={styles.input}
                placeholder="Digite seu nome"
                value={editData.name}
                onChangeText={(text) =>
                  setEditData({ ...editData, name: text })
                }
                editable={!saving}
              />

              <Text style={styles.inputLabel}>Data de Nascimento</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
                disabled={saving}
              >
                <Ionicons name="calendar" size={20} color="#54A676" />
                <Text style={styles.dateButtonText}>
                  {editData.birth_date
                    ? new Date(editData.birth_date).toLocaleDateString("pt-BR")
                    : "Selecione uma data"}
                </Text>
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={
                    editData.birth_date
                      ? new Date(editData.birth_date)
                      : new Date()
                  }
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={handleDateChange}
                />
              )}

              <Text style={styles.inputLabel}>Profissão</Text>
              <TextInput
                style={styles.input}
                placeholder="Digite sua profissão"
                value={editData.profession}
                onChangeText={(text) =>
                  setEditData({ ...editData, profession: text })
                }
                editable={!saving}
              />

              <Text style={styles.inputLabel}>Graduação</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Engenharia Ambiental"
                value={editData.bachelor}
                onChangeText={(text) =>
                  setEditData({ ...editData, bachelor: text })
                }
                editable={!saving}
              />

              <Text style={styles.inputLabel}>Universidade</Text>
              <TextInput
                style={styles.input}
                placeholder="Digite sua universidade"
                value={editData.university}
                onChangeText={(text) =>
                  setEditData({ ...editData, university: text })
                }
                editable={!saving}
              />

              <Text style={styles.inputLabel}>País</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={editData.country}
                  onValueChange={(value) => {
                    updateStates(value);
                  }}
                  enabled={!saving}
                >
                  {countries.map((country) => (
                    <Picker.Item key={country} label={country} value={country} />
                  ))}
                </Picker>
              </View>

              <Text style={styles.inputLabel}>Estado</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={editData.state}
                  onValueChange={(value) => {
                    setEditData({ ...editData, state: value });
                  }}
                  enabled={!saving && states.length > 0}
                >
                  {states.map((state) => (
                    <Picker.Item key={state} label={state} value={state} />
                  ))}
                </Picker>
              </View>

              <Text style={styles.inputLabel}>Cidade</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={editData.city}
                  onValueChange={(value) => {
                    setEditData({ ...editData, city: value });
                  }}
                  enabled={!saving && cities.length > 0}
                >
                  {cities.map((city) => (
                    <Picker.Item key={city} label={city} value={city} />
                  ))}
                </Picker>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setEditModalVisible(false)}
                disabled={saving}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                onPress={handleSaveProfile}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.saveButtonText}>Salvar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9fafb",
  },
  header: {
    alignItems: "center",
    paddingVertical: 32,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  avatarContainer: {
    marginBottom: 16,
  },
  nameText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1f2937",
    marginTop: 8,
  },
  emailText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6b7280",
    marginTop: 4,
  },
  card: {
    backgroundColor: "#ffffff",
    marginHorizontal: 16,
    marginVertical: 16,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
  },
  editButton: {
    padding: 8,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6b7280",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1f2937",
  },
  actionsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#54A676",
    padding: 14,
    borderRadius: 8,
    marginBottom: 12,
  },
  logoutButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#dc2626",
    padding: 14,
    borderRadius: 8,
  },
  deleteButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "90%",
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1f2937",
  },
  modalBody: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#1f2937",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 16,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d1d5db",
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#4b5563",
    fontSize: 16,
    fontWeight: "600",
  },
  saveButton: {
    flex: 1,
    backgroundColor: "#54A676",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  pickerContainer: {
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    overflow: "hidden",
    marginTop: 8,
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 8,
  },
  dateButtonText: {
    marginLeft: 12,
    fontSize: 16,
    color: "#1f2937",
  },
});
