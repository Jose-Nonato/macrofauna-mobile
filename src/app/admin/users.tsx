import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { Btn, Card, Chip, colors, Field, PageTitle, Pager } from "@/components/admin/ui";
import { AdminUser, listUsers, PAGE_SIZE, setUserRole } from "@/lib/adminService";
import { showAlert } from "@/lib/alert";
import { supabase } from "@/lib/supabase";

export default function AdminUsers() {
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [me, setMe] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setMe(data.user?.id ?? null));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const r = await listUsers(query, page);
      setRows(r.rows);
      setTotal(r.total);
    } catch (e: any) {
      setError(e.message || "Erro ao carregar usuários");
    } finally {
      setLoading(false);
    }
  }, [query, page]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleRole = (u: AdminUser) => {
    const next = u.role === "admin" ? "user" : "admin";
    showAlert(
      next === "admin" ? "Promover a administrador" : "Remover administrador",
      `${u.name || u.email} ${next === "admin" ? "poderá gerenciar classes, amostras e usuários." : "perderá o acesso ao painel."}`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          onPress: async () => {
            try {
              await setUserRole(u.user_id, next);
              load();
            } catch (e: any) {
              showAlert("Erro", e.message);
            }
          },
        },
      ],
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <PageTitle title="Usuários" subtitle="Contas cadastradas no app" />
      <Card>
        <View style={styles.searchRow}>
          <Field label="Buscar por nome ou e-mail" value={search} onChangeText={setSearch} onSubmitEditing={() => { setPage(0); setQuery(search); }} />
          <Btn label="Buscar" onPress={() => { setPage(0); setQuery(search); }} />
        </View>
      </Card>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {loading ? <ActivityIndicator color={colors.primary} /> : null}

      {rows.map((u) => (
        <Card key={u.id} style={styles.userCard}>
          <View style={{ flex: 1, minWidth: 200 }}>
            <Text style={styles.name}>{u.name || "(sem nome)"}</Text>
            <Text style={styles.sub}>{u.email}</Text>
            <Text style={styles.sub}>
              {[u.university, u.city, u.country].filter(Boolean).join(" · ") || "—"}
            </Text>
            <Text style={styles.sub}>
              Cadastro em {new Date(u.created_at).toLocaleDateString("pt-BR")} · {u.sampleCount} amostra(s)
            </Text>
          </View>
          <View style={styles.actions}>
            <Chip label={u.role === "admin" ? "Admin" : "Usuário"} tone={u.role === "admin" ? "blue" : "gray"} />
            <Btn
              small
              kind="secondary"
              label={u.role === "admin" ? "Remover admin" : "Tornar admin"}
              disabled={u.user_id === me}
              onPress={() => toggleRole(u)}
            />
          </View>
        </Card>
      ))}

      {!loading && rows.length === 0 && !error ? <Text style={styles.sub}>Nenhum usuário encontrado.</Text> : null}
      <Pager page={page} total={total} pageSize={PAGE_SIZE} onChange={setPage} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: 16, paddingBottom: 48 },
  searchRow: { flexDirection: "row", alignItems: "flex-end", gap: 12, flexWrap: "wrap" },
  userCard: { flexDirection: "row", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 10 },
  name: { fontSize: 15, fontWeight: "700", color: colors.text },
  sub: { fontSize: 12, color: colors.muted, marginTop: 2 },
  actions: { alignItems: "flex-end", gap: 8 },
  error: { color: colors.danger, marginBottom: 12 },
});
