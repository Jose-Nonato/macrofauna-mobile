import * as ImagePicker from "expo-image-picker";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Image, Modal, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import { Btn, Card, Chip, colors, Field, PageTitle } from "@/components/admin/ui";
import { useTaxonomy } from "@/contexts/TaxonomyContext";
import {
  getIqmsConfig,
  IqmsConfigRow,
  listTaxonClasses,
  recalculateAll,
  saveIqmsConfig,
  saveTaxonClass,
  TaxonClassInput,
  TaxonClassRow,
  uploadTaxonAsset,
} from "@/lib/adminService";
import { showAlert } from "@/lib/alert";
import { taxonIcon } from "@/lib/taxonomy";

const LANGS = [
  ["pt", "Português"],
  ["en", "English"],
  ["es", "Español"],
  ["fr", "Français"],
] as const;

const EMPTY: TaxonClassInput = {
  key: "",
  code: "",
  names: {},
  descriptions: {},
  weight_vi: 10,
  icon_url: null,
  image_urls: [],
  active: true,
  sort_order: 99,
};

export default function AdminClasses() {
  const { refresh } = useTaxonomy();
  const [classes, setClasses] = useState<TaxonClassRow[]>([]);
  const [config, setConfig] = useState<IqmsConfigRow | null>(null);
  const [cfgForm, setCfgForm] = useState({ weight_den: "", weight_rt: "", monolith_factor: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<{ id: string | null; data: TaxonClassInput } | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [savingCfg, setSavingCfg] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [c, cfg] = await Promise.all([listTaxonClasses(), getIqmsConfig()]);
      setClasses(c);
      setConfig(cfg);
      setCfgForm({
        weight_den: String(cfg.weight_den),
        weight_rt: String(cfg.weight_rt),
        monolith_factor: String(cfg.monolith_factor),
      });
    } catch (e: any) {
      setError(e.message || "Erro ao carregar");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const afterChange = async () => {
    await refresh(); // atualiza o cache do app com as classes novas
    await load();
  };

  const saveConfig = async () => {
    const parsed = {
      weight_den: Number(cfgForm.weight_den.replace(",", ".")),
      weight_rt: Number(cfgForm.weight_rt.replace(",", ".")),
      monolith_factor: Number(cfgForm.monolith_factor.replace(",", ".")),
    };
    if (Object.values(parsed).some((n) => !isFinite(n) || n <= 0)) {
      showAlert("Valor inválido", "Informe números maiores que zero.");
      return;
    }
    setSavingCfg(true);
    try {
      await saveIqmsConfig(parsed);
      await afterChange();
      showAlert("Salvo", "Parâmetros atualizados. As amostras já registradas só mudam de IQMS ao usar “Recalcular todas”.");
    } catch (e: any) {
      showAlert("Erro", e.message);
    } finally {
      setSavingCfg(false);
    }
  };

  const recalcAll = () =>
    showAlert("Recalcular todas as amostras", "Recalcula IQMS e densidade de todas as amostras ativas com os pesos atuais. Pode demorar.", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Recalcular",
        onPress: async () => {
          try {
            setProgress("Iniciando…");
            const n = await recalculateAll((done, total) => setProgress(`Recalculando ${done}/${total}…`));
            showAlert("Pronto", `${n} amostra(s) recalculada(s).`);
          } catch (e: any) {
            showAlert("Erro", e.message);
          } finally {
            setProgress(null);
          }
        },
      },
    ]);

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <PageTitle
        title="Classes taxonômicas"
        subtitle="Cadastro usado no registro de amostras e no cálculo do IQMS"
        right={<Btn label="Nova classe" onPress={() => setEditing({ id: null, data: { ...EMPTY, sort_order: classes.length + 1 } })} />}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {loading ? <ActivityIndicator color={colors.primary} /> : null}

      {config && (
        <Card>
          <Text style={styles.section}>Parâmetros do IQMS (versão {config.version})</Text>
          <View style={styles.formRow}>
            <Field label="Peso da densidade (DEN)" value={cfgForm.weight_den} onChangeText={(v) => setCfgForm({ ...cfgForm, weight_den: v })} keyboardType="numeric" />
            <Field label="Peso da riqueza (RT)" value={cfgForm.weight_rt} onChangeText={(v) => setCfgForm({ ...cfgForm, weight_rt: v })} keyboardType="numeric" />
            <Field label="Fator do monólito (×)" value={cfgForm.monolith_factor} onChangeText={(v) => setCfgForm({ ...cfgForm, monolith_factor: v })} keyboardType="numeric" hint="25×25 cm = 0,0625 m² → 16" />
          </View>
          <View style={styles.formRow}>
            <Btn label="Salvar parâmetros" loading={savingCfg} onPress={saveConfig} />
            <Btn label={progress ?? "Recalcular todas as amostras"} kind="secondary" disabled={!!progress} onPress={recalcAll} />
          </View>
        </Card>
      )}

      {classes.map((c) => (
        <TouchableOpacity key={c.id} activeOpacity={0.8} onPress={() => setEditing({ id: c.id, data: { ...c } })}>
          <Card style={styles.row}>
            <View style={styles.iconBox}>
              <Image source={taxonIcon({ ...c, id: c.id })} style={styles.icon} resizeMode="contain" />
            </View>
            <View style={{ flex: 1, minWidth: 160 }}>
              <Text style={styles.name}>{c.names.pt || c.key}</Text>
              <Text style={styles.sub}>
                {c.code} · {c.key} · ordem {c.sort_order}
              </Text>
            </View>
            <View style={{ alignItems: "flex-end", gap: 4 }}>
              <Chip label={c.active ? "Ativa" : "Inativa"} tone={c.active ? "green" : "gray"} />
              <Text style={styles.sub}>peso Vi {c.weight_vi}</Text>
            </View>
          </Card>
        </TouchableOpacity>
      ))}

      {editing && (
        <ClassEditor
          initial={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            afterChange();
          }}
        />
      )}
    </ScrollView>
  );
}

function ClassEditor({
  initial,
  onClose,
  onSaved,
}: {
  initial: { id: string | null; data: TaxonClassInput };
  onClose: () => void;
  onSaved: () => void;
}) {
  const isNew = initial.id === null;
  const [d, setD] = useState<TaxonClassInput>(initial.data);
  const [weight, setWeight] = useState(String(initial.data.weight_vi));
  const [images, setImages] = useState(initial.data.image_urls.join("\n"));
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const pickIcon = async () => {
    if (!d.key.trim()) {
      showAlert("Informe a chave", "Preencha a chave da classe antes de enviar o ícone.");
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.9 });
    if (res.canceled || !res.assets?.[0]) return;
    setUploading(true);
    try {
      const url = await uploadTaxonAsset(d.key.trim(), res.assets[0].uri);
      setD((prev) => ({ ...prev, icon_url: url }));
    } catch (e: any) {
      showAlert("Erro no envio", e.message);
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    const key = d.key.trim().toLowerCase();
    const code = d.code.trim().toUpperCase();
    const w = Number(weight.replace(",", "."));
    if (!/^[a-z][a-z0-9_]*$/.test(key)) return showAlert("Chave inválida", "Use letras minúsculas, números e _ (ex.: collembola).");
    if (!code) return showAlert("Código obrigatório", "Informe um código curto (ex.: COLL).");
    if (!d.names.pt?.trim()) return showAlert("Nome obrigatório", "Informe ao menos o nome em português.");
    if (!isFinite(w) || w < 0) return showAlert("Peso inválido", "O peso Vi deve ser um número maior ou igual a zero.");

    setSaving(true);
    try {
      await saveTaxonClass(initial.id, {
        ...d,
        key,
        code,
        weight_vi: w,
        image_urls: images.split("\n").map((s) => s.trim()).filter(Boolean),
      });
      onSaved();
    } catch (e: any) {
      showAlert("Erro ao salvar", e.message?.includes("duplicate") ? "Já existe uma classe com essa chave ou código." : e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>{isNew ? "Nova classe" : `Editar: ${initial.data.names.pt || initial.data.key}`}</Text>
            <Btn small kind="secondary" label="Cancelar" onPress={onClose} />
          </View>
          <ScrollView contentContainerStyle={{ padding: 16 }}>
            <View style={styles.formRow}>
              <Field label="Chave" value={d.key} onChangeText={(v) => setD({ ...d, key: v })} editable={isNew} autoCapitalize="none" hint={isNew ? "Identificador interno; não muda depois." : "Não pode ser alterada."} />
              <Field label="Código" value={d.code} onChangeText={(v) => setD({ ...d, code: v })} autoCapitalize="characters" />
              <Field label="Peso Vi" value={weight} onChangeText={setWeight} keyboardType="numeric" hint="Peso na fórmula do IQMS" />
              <Field label="Ordem" value={String(d.sort_order)} onChangeText={(v) => setD({ ...d, sort_order: parseInt(v, 10) || 0 })} keyboardType="numeric" />
            </View>

            <View style={[styles.formRow, { alignItems: "center", marginBottom: 12 }]}>
              <Switch value={d.active} onValueChange={(v) => setD({ ...d, active: v })} trackColor={{ true: colors.primary }} />
              <Text style={styles.sub}>{d.active ? "Ativa: aparece no cadastro de amostras" : "Inativa: some do cadastro, mas continua nas amostras antigas"}</Text>
            </View>

            {LANGS.map(([code, label]) => (
              <View key={code}>
                <Field label={`Nome (${label})`} value={d.names[code] ?? ""} onChangeText={(v) => setD({ ...d, names: { ...d.names, [code]: v } })} />
                <Field
                  label={`Descrição (${label})`}
                  value={d.descriptions[code] ?? ""}
                  onChangeText={(v) => setD({ ...d, descriptions: { ...d.descriptions, [code]: v } })}
                  multiline
                />
              </View>
            ))}

            <Text style={styles.section}>Ícone</Text>
            <View style={[styles.formRow, { alignItems: "center" }]}>
              <View style={styles.iconBox}>
                {d.icon_url ? <Image source={{ uri: d.icon_url }} style={styles.icon} resizeMode="contain" /> : <Text style={styles.sub}>padrão</Text>}
              </View>
              <Btn small kind="secondary" label={uploading ? "Enviando…" : "Enviar ícone"} loading={uploading} onPress={pickIcon} />
              {d.icon_url ? <Btn small kind="secondary" label="Remover" onPress={() => setD({ ...d, icon_url: null })} /> : null}
            </View>
            <Text style={styles.hint}>Use PNG branco com fundo transparente: é exibido sobre fundo verde.</Text>

            <Field
              label="Fotos de referência (uma URL por linha)"
              value={images}
              onChangeText={setImages}
              multiline
              autoCapitalize="none"
              hint="Vazio = usa as fotos padrão do app, quando existirem."
            />

            <View style={{ marginTop: 8 }}>
              <Btn label="Salvar classe" loading={saving} onPress={save} />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  page: { padding: 16, paddingBottom: 48 },
  section: { fontSize: 15, fontWeight: "700", color: colors.text, marginBottom: 10 },
  formRow: { flexDirection: "row", gap: 12, flexWrap: "wrap" },
  row: { flexDirection: "row", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 10 },
  iconBox: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  icon: { width: 30, height: 30 },
  name: { fontSize: 15, fontWeight: "700", color: colors.text },
  sub: { fontSize: 12, color: colors.muted },
  hint: { fontSize: 11, color: colors.muted, marginBottom: 12 },
  error: { color: colors.danger, marginBottom: 12 },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 12 },
  sheet: { backgroundColor: "#fff", borderRadius: 16, width: "100%", maxWidth: 720, maxHeight: "94%" },
  sheetHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, borderBottomWidth: 1, borderColor: colors.border },
  sheetTitle: { fontSize: 18, fontWeight: "700", color: colors.text, flex: 1 },
});
