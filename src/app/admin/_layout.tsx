import { Ionicons } from "@expo/vector-icons";
import { Slot, usePathname, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "@/components/admin/ui";
import { checkIsAdmin } from "@/lib/adminService";

const NAV: { href: string; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { href: "/admin", label: "Visão geral", icon: "stats-chart-outline" },
  { href: "/admin/classes", label: "Classes", icon: "bug-outline" },
  { href: "/admin/samples", label: "Amostras", icon: "flask-outline" },
  { href: "/admin/users", label: "Usuários", icon: "people-outline" },
];

export default function AdminLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const [state, setState] = useState<"loading" | "ok" | "denied">("loading");

  useEffect(() => {
    checkIsAdmin().then((ok) => {
      if (ok) setState("ok");
      else {
        setState("denied");
        router.replace("/");
      }
    });
  }, []);

  if (state !== "ok") {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
        {state === "denied" && <Text style={styles.denied}>Acesso restrito a administradores.</Text>}
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.topbar}>
        <TouchableOpacity onPress={() => router.replace("/")} style={styles.back}>
          <Ionicons name="arrow-back" size={18} color="#fff" />
          <Text style={styles.backText}>App</Text>
        </TouchableOpacity>
        <Text style={styles.brand}>Macrofauna · Administração</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.nav} contentContainerStyle={styles.navContent}>
        {NAV.map((item) => {
          const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
          return (
            <TouchableOpacity
              key={item.href}
              onPress={() => router.push(item.href as any)}
              style={[styles.navItem, active && styles.navItemActive]}
            >
              <Ionicons name={item.icon} size={16} color={active ? colors.primaryDark : colors.muted} />
              <Text style={[styles.navText, active && styles.navTextActive]}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <View style={styles.content}>
        <Slot />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  denied: { color: colors.muted },
  topbar: { backgroundColor: colors.primary, flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, gap: 16 },
  back: { flexDirection: "row", alignItems: "center", gap: 4 },
  backText: { color: "#fff", fontWeight: "600" },
  brand: { color: "#fff", fontSize: 16, fontWeight: "700" },
  nav: { flexGrow: 0, backgroundColor: "#fff", borderBottomWidth: 1, borderColor: colors.border },
  navContent: { paddingHorizontal: 12, gap: 4 },
  navItem: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 3, borderBottomColor: "transparent" },
  navItemActive: { borderBottomColor: colors.primary },
  navText: { color: colors.muted, fontWeight: "600" },
  navTextActive: { color: colors.primaryDark },
  content: { flex: 1, width: "100%", maxWidth: 1100, alignSelf: "center" },
});
