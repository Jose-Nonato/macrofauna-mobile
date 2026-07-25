import { supabase } from "./supabase";

export interface UserProfile {
  id: string;
  user_id: string;
  name: string | null;
  email: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  profession: string | null;
  bachelor: string | null;
  university: string | null;
  birth_date: string | null;
  created_at: string;
}

// Obter perfil do usuário
export async function getUserProfile(): Promise<UserProfile | null> {

  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error("Usuário não autenticado");

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userData.user.id)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows returned (perfil não existe ainda)
      throw error;
    }

    return data || null;
  } catch (error: any) {
    throw error;
  }
}

// Garantir que o usuário logado tem linha em profiles.
// Contas criadas antes do trigger on_auth_user_created não têm perfil,
// e a FK samples_user_id_fkey bloqueia inserts de amostras sem ele.
export async function ensureUserProfile() {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) throw new Error("Usuário não autenticado");

  const { data: existing, error: selectError } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (selectError) throw selectError;
  if (existing) return;

  // name é NOT NULL no banco; usa o prefixo do email como valor provisório
  const { error } = await supabase.from("profiles").insert({
    user_id: user.id,
    name: user.email?.split("@")[0] ?? "",
    email: user.email ?? "",
  });

  // 23505 = unique_violation: perfil criado em paralelo, ok
  if (error && error.code !== "23505") throw error;
}

// Atualizar perfil do usuário
export async function updateUserProfile(profileData: Partial<UserProfile>) {

  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error("Usuário não autenticado");

    const { data, error } = await supabase
      .from("profiles")
      .update({
        name: profileData.name,
        country: profileData.country,
        state: profileData.state,
        city: profileData.city,
        profession: profileData.profession,
        bachelor: profileData.bachelor,
        university: profileData.university,
        birth_date: profileData.birth_date,
      })
      .eq("user_id", userData.user.id)
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error: any) {
    throw error;
  }
}

// Deletar perfil e usuário
export async function deleteUserAccount() {

  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error("Usuário não autenticado");

    // Deletar perfil
    const { error: profileError } = await supabase
      .from("profiles")
      .delete()
      .eq("user_id", userData.user.id);

    if (profileError) throw profileError;

  } catch (error: any) {
    throw error;
  }
}

// Obter email do usuário logado
export async function getUserEmail(): Promise<string | null> {
  try {
    const { data: userData } = await supabase.auth.getUser();
    return userData.user?.email || null;
  } catch (error) {
    return null;
  }
}

// Obter última localização registrada nas amostras
export async function getLastSampleLocation(): Promise<{
  country: string | null;
  state: string | null;
  city: string | null;
} | null> {

  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error("Usuário não autenticado");

    const { data, error } = await supabase
      .from("samples")
      .select("country, state, city")
      .eq("user_id", userData.user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    return data || null;
  } catch (error: any) {
    return null;
  }
}
