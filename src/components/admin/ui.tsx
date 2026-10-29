import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";

export const colors = {
  primary: "#54A676",
  primaryDark: "#3f8a5c",
  danger: "#dc2626",
  text: "#111827",
  muted: "#6b7280",
  border: "#e5e7eb",
  bg: "#f3f4f6",
  card: "#ffffff",
};

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function PageTitle({ title, subtitle, right }: { title: string; subtitle?: string; right?: React.ReactNode }) {
  return (
    <View style={styles.pageTitleRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.pageTitle}>{title}</Text>
        {subtitle ? <Text style={styles.pageSubtitle}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

export function Btn({
  label,
  onPress,
  kind = "primary",
  loading,
  disabled,
  small,
}: {
  label: string;
  onPress: () => void;
  kind?: "primary" | "secondary" | "danger";
  loading?: boolean;
  disabled?: boolean;
  small?: boolean;
}) {
  const bg = kind === "primary" ? colors.primary : kind === "danger" ? colors.danger : "#fff";
  const fg = kind === "secondary" ? colors.text : "#fff";
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        styles.btn,
        small && styles.btnSmall,
        { backgroundColor: bg, borderColor: kind === "secondary" ? colors.border : bg },
        (disabled || loading) && { opacity: 0.5 },
      ]}
    >
      {loading ? <ActivityIndicator color={fg} size="small" /> : <Text style={[styles.btnText, { color: fg }]}>{label}</Text>}
    </TouchableOpacity>
  );
}

export function Field({
  label,
  hint,
  ...props
}: TextInputProps & { label: string; hint?: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        {...props}
        style={[styles.input, props.multiline && { minHeight: 80, textAlignVertical: "top" }, props.editable === false && { backgroundColor: "#f9fafb" }]}
        placeholderTextColor="#9ca3af"
      />
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

export function Chip({ label, tone = "gray" }: { label: string; tone?: "green" | "red" | "gray" | "blue" | "amber" }) {
  const map = {
    green: ["#dcfce7", "#166534"],
    red: ["#fee2e2", "#991b1b"],
    gray: ["#f3f4f6", "#374151"],
    blue: ["#dbeafe", "#1e40af"],
    amber: ["#fef3c7", "#92400e"],
  } as const;
  return (
    <View style={[styles.chip, { backgroundColor: map[tone][0] }]}>
      <Text style={[styles.chipText, { color: map[tone][1] }]}>{label}</Text>
    </View>
  );
}

export function Pager({ page, total, pageSize, onChange }: { page: number; total: number; pageSize: number; onChange: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <View style={styles.pager}>
      <Btn label="‹ Anterior" kind="secondary" small disabled={page <= 0} onPress={() => onChange(page - 1)} />
      <Text style={styles.pagerText}>
        Página {page + 1} de {pages} · {total} registro(s)
      </Text>
      <Btn label="Próxima ›" kind="secondary" small disabled={page + 1 >= pages} onPress={() => onChange(page + 1)} />
    </View>
  );
}

export function scoreTone(score: number | null | undefined): "green" | "amber" | "red" | "gray" {
  if (score == null) return "gray";
  if (score >= 0.75) return "green";
  if (score >= 0.5) return "amber";
  return "red";
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  pageTitleRow: { flexDirection: "row", alignItems: "center", marginBottom: 16, gap: 12, flexWrap: "wrap" },
  pageTitle: { fontSize: 24, fontWeight: "700", color: colors.text },
  pageSubtitle: { fontSize: 13, color: colors.muted, marginTop: 2 },
  btn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  btnSmall: { paddingVertical: 6, paddingHorizontal: 10 },
  btnText: { fontSize: 14, fontWeight: "600" },
  field: { marginBottom: 12, flex: 1, minWidth: 160 },
  fieldLabel: { fontSize: 12, fontWeight: "600", color: colors.muted, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: colors.text,
    backgroundColor: "#fff",
  },
  hint: { fontSize: 11, color: colors.muted, marginTop: 3 },
  chip: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  chipText: { fontSize: 11, fontWeight: "600" },
  pager: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: 8, flexWrap: "wrap" },
  pagerText: { fontSize: 12, color: colors.muted },
});
