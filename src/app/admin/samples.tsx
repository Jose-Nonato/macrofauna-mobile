import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Btn, Card, Chip, colors, Field, PageTitle, Pager, scoreTone } from "@/components/admin/ui";
import { useTaxonomy } from "@/contexts/TaxonomyContext";
import {
  AdminSample,
  getSampleDetail,
  listSamples,
  PAGE_SIZE,
  purgeSample,
  recalculateSample,
  SampleFilters,
  SampleLevel,
  setSampleDeleted,
} from "@/lib/adminService";
import { showAlert } from "@/lib/alert";

const DEPTHS = ["0-10 cm", "10-20 cm", "20-30 cm"];

export default function AdminSamples() {
  const [filters, setFilters] = useState<SampleFilters>({ status: "active", search: "", country: "", vegetation: "" });
  const [applied, setApplied] = useState(filters);
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState<AdminSample[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<AdminSample | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const r = await listSamples(applied, page);
      setRows(r.rows);
      setTotal(r.total);
    } catch (e: any) {
      setError(e.message || "Erro ao carregar amostras");
    } finally {
      setLoading(false);
    }
  }, [applied, page]);

  useEffect(() => {
    load();
  }, [load]);

  const apply = () => {
    setPage(0);
    setApplied(filters);
  };

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <PageTitle title="Amostras" subtitle="Todas as amostras registradas pelos usuários" />

      <Card>
        <View style={styles.filterRow}>
          <Field label="Usuário, cidade ou estado" value={filters.search} onChangeText={(v) => setFilters({ ...filters, search: v })} onSubmitEditing={apply} />
          <Field label="País" value={filters.country} onChangeText={(v) => setFilters({ ...filters, country: v })} onSubmitEditing={apply} />
          <Field label="Vegetação" value={filters.vegetation} onChangeText={(v) => setFilters({ ...filters, vegetation: v })} onSubmitEditing={apply} />
        </View>
        <View style={styles.filterRow}>
          {(["active", "deleted", "all"] as const).map((s) => (
            <Btn
              key={s}
              small
              kind={filters.status === s ? "primary" : "secondary"}
              label={s === "active" ? "Ativas" : s === "deleted" ? "Excluídas" : "Todas"}
              onPress={() => setFilters({ ...filters, status: s })}
            />
          ))}
          <View style={{ flex: 1 }} />
          <Btn label="Filtrar" onPress={apply} />
        </View>
      </Card>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {loading ? <ActivityIndicator color={colors.primary} /> : null}

      {rows.map((s) => (
        <TouchableOpacity key={s.id} activeOpacity={0.8} onPress={() => setSelected(s)}>
          <Card style={styles.row}>
            <View style={{ flex: 1, minWidth: 180 }}>
              <Text style={styles.title}>
                {[s.city, s.state, s.country].filter(Boolean).join(", ") || "Local não informado"}
              </Text>
              <Text style={styles.sub}>
                {s.profiles?.name || s.profiles?.email || s.user_id.slice(0, 8)} ·{" "}
                {new Date(s.created_at).toLocaleDateString("pt-BR")} · {s.vegetation_type || "vegetação n/i"}
              </Text>
            </View>
            <View style={styles.right}>
              {s.deleted ? <Chip label="Excluída" tone="red" /> : null}
              <Chip label={`IQMS ${(s.sample_score ?? 0).toFixed(2)}`} tone={scoreTone(s.sample_score)} />
              <Text style={styles.sub}>{s.animal_quantity ?? 0} indivíduos</Text>
            </View>
          </Card>
        </TouchableOpacity>
      ))}
      {!loading && rows.length === 0 && !error ? <Text style={styles.sub}>Nenhuma amostra encontrada.</Text> : null}
      <Pager page={page} total={total} pageSize={PAGE_SIZE} onChange={setPage} />

      <SampleDetail sample={selected} onClose={() => setSelected(null)} onChanged={() => { setSelected(null); load(); }} />
    </ScrollView>
  );
}

function SampleDetail({ sample, onClose, onChanged }: { sample: AdminSample | null; onClose: () => void; onChanged: () => void }) {
  const { taxonomy, nameOf } = useTaxonomy();
  const [levels, setLevels] = useState<SampleLevel[]>([]);
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [current, setCurrent] = useState<AdminSample | null>(null);

  useEffect(() => {
    setCurrent(sample);
    if (!sample) return;
    setLoading(true);
    getSampleDetail(sample.id)
      .then((d) => {
        setLevels(d.levels);
        setPhotos(d.photos);
      })
      .catch((e) => showAlert("Erro", e.message))
      .finally(() => setLoading(false));
  }, [sample]);

  if (!current) return null;
  const s = current;

  const run = async (fn: () => Promise<unknown>, done?: string) => {
    setBusy(true);
    try {
      await fn();
      if (done) showAlert("Pronto", done);
      onChanged();
    } catch (e: any) {
      showAlert("Erro", e.message || "Falha na operação");
    } finally {
      setBusy(false);
    }
  };

  const confirm = (title: string, msg: string, fn: () => Promise<unknown>) =>
    showAlert(title, msg, [{ text: "Cancelar", style: "cancel" }, { text: "Confirmar", style: "destructive", onPress: () => run(fn) }]);

  const totals: Record<string, number> = {};
  levels.forEach((l) => Object.keys(l.counts).forEach((k) => (totals[k] = (totals[k] || 0) + l.counts[k])));
  const grand = Object.values(totals).reduce((a, b) => a + b, 0);

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>{[s.city, s.state].filter(Boolean).join(", ") || "Amostra"}</Text>
            <Btn small kind="secondary" label="Fechar" onPress={onClose} />
          </View>
          <ScrollView contentContainerStyle={{ padding: 16 }}>
            <Text style={styles.sub}>
              {s.profiles?.name || "—"} ({s.profiles?.email || s.user_id}) · {new Date(s.created_at).toLocaleString("pt-BR")}
            </Text>
            <Text style={styles.sub}>
              {s.country} · {s.vegetation_type || "vegetação n/i"} · {s.latitude ?? "?"}, {s.longitude ?? "?"}
            </Text>
            <View style={styles.chips}>
              <Chip label={`IQMS ${(s.sample_score ?? 0).toFixed(2)}`} tone={scoreTone(s.sample_score)} />
              <Chip label={`${s.sample_density ?? 0} ind/m²`} tone="blue" />
              <Chip label={`${s.animal_quantity ?? 0} indivíduos`} />
              {s.deleted ? <Chip label="Excluída" tone="red" /> : null}
            </View>

            <Text style={styles.section}>Composição taxonômica</Text>
            {loading ? <ActivityIndicator color={colors.primary} /> : null}
            {taxonomy.classes
              .filter((c) => (totals[c.key] || 0) > 0)
              .map((c) => (
                <View key={c.key} style={styles.taxRow}>
                  <Text style={styles.taxName}>
                    {nameOf(c.key)} <Text style={styles.sub}>{c.code}</Text>
                  </Text>
                  <Text style={styles.taxValue}>
                    {totals[c.key]} ({grand ? ((totals[c.key] / grand) * 100).toFixed(1) : 0}%)
                  </Text>
                </View>
              ))}
            {!loading && grand === 0 ? <Text style={styles.sub}>Sem contagens.</Text> : null}

            {levels.length > 1 && (
              <>
                <Text style={styles.section}>Por profundidade</Text>
                {levels.map((l, i) => (
                  <Text key={l.id} style={styles.sub}>
                    {DEPTHS[i] ?? `Nível ${i + 1}`}: IQMS {(l.iqms ?? 0).toFixed(2)} · {l.sample_density ?? 0} ind/m² ·{" "}
                    {Object.values(l.counts).reduce((a, b) => a + b, 0)} indivíduos
                  </Text>
                ))}
              </>
            )}

            {photos.length > 0 && (
              <>
                <Text style={styles.section}>Fotos</Text>
                <ScrollView horizontal>
                  {photos.map((p) => (
                    <View key={p.id} style={{ marginRight: 8 }}>
                      <Image source={{ uri: p.photo }} style={styles.photo} />
                      <Text style={styles.sub}>{p.direction}</Text>
                    </View>
                  ))}
                </ScrollView>
              </>
            )}

            <Text style={styles.section}>Ações</Text>
            <View style={styles.chips}>
              <Btn
                small
                kind="secondary"
                label="Recalcular IQMS"
                loading={busy}
                onPress={() => run(async () => { const r = await recalculateSample(s.id); return r; }, "IQMS e densidade recalculados com os pesos atuais.")}
              />
              {s.deleted ? (
                <Btn small kind="secondary" label="Restaurar" loading={busy} onPress={() => run(() => setSampleDeleted(s.id, false))} />
              ) : (
                <Btn
                  small
                  kind="danger"
                  label="Marcar como excluída"
                  loading={busy}
                  onPress={() => confirm("Excluir amostra", "A amostra some do app do usuário, mas pode ser restaurada aqui.", () => setSampleDeleted(s.id, true))}
                />
              )}
              {s.deleted ? (
                <Btn
                  small
                  kind="danger"
                  label="Remover definitivamente"
                  loading={busy}
                  onPress={() =>
                    confirm(
                      "Remover definitivamente",
                      "Apaga a amostra, os níveis, as contagens e os registros de fotos. Não dá para desfazer.",
                      () => purgeSample(s.id),
                    )
                  }
                />
              ) : null}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  page: { padding: 16, paddingBottom: 48 },
  filterRow: { flexDirection: "row", gap: 12, flexWrap: "wrap", alignItems: "flex-end" },
  row: { flexDirection: "row", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 10 },
  title: { fontSize: 15, fontWeight: "700", color: colors.text },
  sub: { fontSize: 12, color: colors.muted, marginTop: 2 },
  right: { alignItems: "flex-end", gap: 4 },
  error: { color: colors.danger, marginBottom: 12 },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 12 },
  sheet: { backgroundColor: "#fff", borderRadius: 16, width: "100%", maxWidth: 720, maxHeight: "92%" },
  sheetHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, borderBottomWidth: 1, borderColor: colors.border },
  sheetTitle: { fontSize: 18, fontWeight: "700", color: colors.text, flex: 1 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10, alignItems: "center" },
  section: { fontSize: 14, fontWeight: "700", color: colors.text, marginTop: 18, marginBottom: 6 },
  taxRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 5, borderBottomWidth: 1, borderColor: "#f3f4f6" },
  taxName: { fontSize: 13, color: colors.text },
  taxValue: { fontSize: 13, fontWeight: "600", color: colors.text },
  photo: { width: 110, height: 110, borderRadius: 8, backgroundColor: "#f3f4f6" },
});
