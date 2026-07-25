import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.log(
    "Aviso: Supabase URL ou Anon Key não estão configurados no arquivo .env.",
  );
}

const customStorage = {
  getItem: async (key: string) => {
    if (Platform.OS === "web" && typeof window === "undefined") {
      return null;
    }
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    if (Platform.OS === "web" && typeof window === "undefined") {
      return;
    }
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
    }
  },
  removeItem: async (key: string) => {
    if (Platform.OS === "web" && typeof window === "undefined") {
      return;
    }
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
    }
  },
};

const loggedFetch: typeof fetch = async (input, init) => {
  const url =
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.toString()
        : input.url;
  const method = init?.method ?? "GET";
  const path = url.replace(supabaseUrl, "");
  const start = Date.now();
  console.log(`🌐 [SUPABASE] → ${method} ${path}`);
  try {
    const response = await fetch(input, init);
    const ms = Date.now() - start;
    if (response.ok) {
      console.log(
        `🌐 [SUPABASE] ← ${response.status} ${method} ${path} (${ms}ms)`,
      );
    } else {
      const body = await response.clone().text();
      console.warn(
        `🌐 [SUPABASE] ← ${response.status} ${method} ${path} (${ms}ms):`,
        body,
      );
    }
    return response;
  } catch (error) {
    console.error(
      `🌐 [SUPABASE] ✕ ${method} ${path} (${Date.now() - start}ms):`,
      error,
    );
    throw error;
  }
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: customStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: {
    fetch: __DEV__ ? loggedFetch : undefined,
  },
});

if (__DEV__) {
  supabase.auth.onAuthStateChange((event, session) => {
    console.log("🔐 [AUTH]", event, session?.user?.email ?? "(sem sessão)");
  });
}
