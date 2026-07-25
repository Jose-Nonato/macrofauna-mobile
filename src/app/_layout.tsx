import { ensureUserProfile } from "@/lib/profileService";
import { supabase } from "@/lib/supabase";
import { Session } from "@supabase/supabase-js";
import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      if (session) {
        ensureUserProfile().catch((error) =>
          console.warn("Falha ao garantir perfil:", error.message),
        );
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (event === "SIGNED_IN" && session) {
        // setTimeout evita deadlock: o supabase-js segura um lock de auth
        // enquanto este callback roda
        setTimeout(() => {
          ensureUserProfile().catch((error) =>
            console.warn("Falha ao garantir perfil:", error.message),
          );
        }, 0);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === "login" || segments[0] === "register";

    if (!session && !inAuthGroup) {
      router.replace("/login");
    } else if (session && inAuthGroup) {
      router.replace("/");
    }
  }, [session, loading, segments]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <Stack>
      <Stack.Screen
        name="login"
        options={{ headerShown: false, title: "Login" }}
      />
      <Stack.Screen
        name="register"
        options={{ headerShown: false, title: "Cadastro" }}
      />
      <Stack.Screen
        name="index"
        options={{ headerShown: false, title: "Início" }}
      />
    </Stack>
  );
}
