import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { Btn, Card, colors, PageTitle } from "@/components/admin/ui";
import { DashboardStats, getDashboardStats, listAuditLog } from "@/lib/adminService";

function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <Card style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {hint ? <Text style={styles.statHint}>{hint}</Text> : null}
    </Card>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [log, setLog] = useState<any[]>([]);
  const [error, setError] = useState("");

  const load = async () => {
    setError("");
    try {
      const [s, l] = await Promise.all([getDashboardStats(), listAuditLog(15)]);
      setStats(s);
      setLog(l);
    } catch (e: any) {
      setError(e.message || "Erro ao carregar");
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <PageTitle title="Visão geral" subtitle="Resumo dos dados do Macrofauna" right={<Btn label="Atualizar" kind="secondary" small onPress={load} />} />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!stats && !error ? <ActivityIndicator color={colors.primary} /> : null}
      {stats && (
        <>
          <View style={styles.grid}>
            <Stat label="Usuários" value={stats.users} hint={`${stats.admins} admin(s)`} />
            <Stat label="Amostras" value={stats.samples} hint={`${stats.deletedSamples} excluída(s)`} />
            <Stat label="Últimos 30 dias" value={stats.samplesLast30Days} hint="amostras novas" />
            <Stat label="IQMS médio" value={stats.averageScore.toFixed(2)} />
          </View>

          <Card>
            <Text style={styles.section}>Qualidade do solo (IQMS)</Text>
            {(
              [
                ["Boa (≥ 0,75)", stats.bands.good, "#10b981"],
                ["Regular (0,50–0,74)", stats.bands.regular, "#f59e0b"],
                ["Mediocre (0,25–0,49)", stats.bands.mediocre, "#ef4444"],
                ["Ruim (< 0,25)", stats.bands.poor, "#7f1d1d"],
              ] as const
            ).map(([label, n, color]) => {
              const pct = stats.samples ? (n / stats.samples) * 100 : 0;
              return (
                <View key={label} style={styles.barRow}>
                  <Text style={styles.barLabel}>{label}</Text>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: color }]} />
                  </View>
                  <Text style={styles.barValue}>
                    {n} ({pct.toFixed(0)}%)
                  </Text>
                </View>
              );
            })}
          </Card>

          <Card>
            <Text style={styles.section}>Últimas ações administrativas</Text>
            {log.length === 0 ? (
              <Text style={styles.muted}>Nenhuma ação registrada ainda.</Text>
            ) : (
              log.map((l) => (
                <View key={l.id} style={styles.logRow}>
                  <Text style={styles.logWhen}>{new Date(l.created_at).toLocaleString("pt-BR")}</Text>
                  <Text style={styles.logWhat}>
                    {l.action} · {l.entity}
                    {l.entity_id ? ` · ${String(l.entity_id).slice(0, 8)}` : ""}
                  </Text>
                </View>
              ))
            )}
          </Card>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: 16, paddingBottom: 48 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 4 },
  stat: { flexGrow: 1, flexBasis: 150, marginBottom: 0 },
  statValue: { fontSize: 28, fontWeight: "700", color: colors.text },
  statLabel: { fontSize: 13, color: colors.muted, fontWeight: "600" },
  statHint: { fontSize: 11, color: colors.muted, marginTop: 2 },
  section: { fontSize: 15, fontWeight: "700", color: colors.text, marginBottom: 12 },
  barRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  barLabel: { width: 150, fontSize: 12, color: colors.text },
  barTrack: { flex: 1, height: 10, borderRadius: 5, backgroundColor: "#f3f4f6", overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 5 },
  barValue: { width: 80, fontSize: 12, color: colors.muted, textAlign: "right" },
  logRow: { paddingVertical: 6, borderBottomWidth: 1, borderColor: "#f3f4f6" },
  logWhen: { fontSize: 11, color: colors.muted },
  logWhat: { fontSize: 13, color: colors.text },
  muted: { color: colors.muted },
  error: { color: colors.danger, marginBottom: 12 },
});
