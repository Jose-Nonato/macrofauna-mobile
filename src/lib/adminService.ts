import { calculateIqms } from "./iqms";
import { supabase } from "./supabase";
import {
  countsFromInsectRow,
  fetchTaxonomy,
  SAMPLE_COUNTS_SELECT,
  type Taxonomy,
} from "./taxonomy";

// ---------------------------------------------------------------- acesso

/** Verdadeiro se o usuário logado é admin ativo (mesma regra da RLS). */
export async function checkIsAdmin(): Promise<boolean> {
  const { data, error } = await supabase.rpc("is_admin");
  if (error) return false;
  return data === true;
}

/** Registra uma ação administrativa em audit_log (falha não interrompe a ação). */
export async function audit(
  action: string,
  entity: string,
  entityId?: string | null,
  details?: Record<string, unknown>,
) {
  const { error } = await supabase
    .from("audit_log")
    .insert({ action, entity, entity_id: entityId ?? null, details: details ?? null });
  if (error) console.warn("Falha ao gravar auditoria:", error.message);
}

// ------------------------------------------------------------- dashboard

export interface DashboardStats {
  users: number;
  admins: number;
  samples: number;
  deletedSamples: number;
  samplesLast30Days: number;
  averageScore: number;
  bands: { good: number; regular: number; mediocre: number; poor: number };
}

async function count(query: PromiseLike<{ count: number | null; error: any }>) {
  const { count: c, error } = await query;
  if (error) throw error;
  return c ?? 0;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const since = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
  const head = { count: "exact" as const, head: true };
  const live = () => supabase.from("samples").select("id", head).eq("deleted", false);

  const [users, admins, samples, deletedSamples, recent, good, regular, mediocre, scores] =
    await Promise.all([
      count(supabase.from("profiles").select("id", head)),
      count(supabase.from("profiles").select("id", head).eq("role", "admin")),
      count(live()),
      count(supabase.from("samples").select("id", head).eq("deleted", true)),
      count(live().gte("created_at", since)),
      count(live().gte("sample_score", 0.75)),
      count(live().gte("sample_score", 0.5).lt("sample_score", 0.75)),
      count(live().gte("sample_score", 0.25).lt("sample_score", 0.5)),
      supabase.from("samples").select("sample_score").eq("deleted", false).limit(5000),
    ]);
  if (scores.error) throw scores.error;
  const values = (scores.data ?? []).map((s: any) => s.sample_score || 0);
  const averageScore = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;

  return {
    users,
    admins,
    samples,
    deletedSamples,
    samplesLast30Days: recent,
    averageScore: Number(averageScore.toFixed(2)),
    bands: { good, regular, mediocre, poor: Math.max(0, samples - good - regular - mediocre) },
  };
}

// --------------------------------------------------------------- classes

export interface TaxonClassRow {
  id: string;
  key: string;
  code: string;
  names: Record<string, string>;
  descriptions: Record<string, string>;
  weight_vi: number;
  icon_url: string | null;
  image_urls: string[];
  active: boolean;
  sort_order: number;
}

export async function listTaxonClasses(): Promise<TaxonClassRow[]> {
  const { data, error } = await supabase.from("taxon_classes").select("*").order("sort_order");
  if (error) throw error;
  return (data ?? []).map((c: any) => ({ ...c, weight_vi: Number(c.weight_vi) }));
}

export type TaxonClassInput = Omit<TaxonClassRow, "id">;

export async function saveTaxonClass(id: string | null, input: TaxonClassInput) {
  if (id) {
    const { error } = await supabase.from("taxon_classes").update(input).eq("id", id);
    if (error) throw error;
    await audit("update", "taxon_class", id, { key: input.key, weight_vi: input.weight_vi, active: input.active });
    return id;
  }
  const { data, error } = await supabase.from("taxon_classes").insert(input).select("id").single();
  if (error) throw error;
  await audit("create", "taxon_class", data.id, { key: input.key });
  return data.id as string;
}

/** Envia uma imagem (uri local/blob) para o bucket público taxon-assets. */
export async function uploadTaxonAsset(classKey: string, uri: string): Promise<string> {
  const blob = await (await fetch(uri)).blob();
  const ext = (blob.type.split("/")[1] || "png").replace("jpeg", "jpg");
  const path = `${classKey}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from("taxon-assets")
    .upload(path, blob, { contentType: blob.type || "image/png", upsert: false });
  if (error) throw error;
  return supabase.storage.from("taxon-assets").getPublicUrl(path).data.publicUrl;
}

// ------------------------------------------------------ parâmetros IQMS

export interface IqmsConfigRow {
  weight_den: number;
  weight_rt: number;
  monolith_factor: number;
  version: number;
}

export async function getIqmsConfig(): Promise<IqmsConfigRow> {
  const { data, error } = await supabase.from("iqms_config").select("*").eq("id", 1).single();
  if (error) throw error;
  return {
    weight_den: Number(data.weight_den),
    weight_rt: Number(data.weight_rt),
    monolith_factor: Number(data.monolith_factor),
    version: data.version,
  };
}

export async function saveIqmsConfig(input: Omit<IqmsConfigRow, "version">) {
  const current = await getIqmsConfig();
  const { data: userData } = await supabase.auth.getUser();
  const { error } = await supabase
    .from("iqms_config")
    .update({ ...input, version: current.version + 1, updated_at: new Date().toISOString(), updated_by: userData.user?.id })
    .eq("id", 1);
  if (error) throw error;
  await audit("update", "iqms_config", "1", { ...input, version: current.version + 1 });
}

// --------------------------------------------------------------- amostras

export interface AdminSample {
  id: string;
  user_id: string;
  sample_score: number | null;
  sample_density: number | null;
  animal_quantity: number | null;
  country: string | null;
  state: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  vegetation_type: string | null;
  created_at: string;
  deleted: boolean | null;
  profiles: { name: string | null; email: string | null } | null;
}

export interface SampleFilters {
  status: "active" | "deleted" | "all";
  search: string; // nome/e-mail do usuário ou cidade/estado
  country: string;
  vegetation: string;
}

export const PAGE_SIZE = 25;

export async function listSamples(filters: SampleFilters, page: number) {
  let userIds: string[] | null = null;
  const term = filters.search.trim().replace(/[%,()]/g, "");
  if (term) {
    const { data, error } = await supabase
      .from("profiles")
      .select("user_id")
      .or(`name.ilike.%${term}%,email.ilike.%${term}%`)
      .limit(200);
    if (error) throw error;
    userIds = (data ?? []).map((p: any) => p.user_id);
  }

  let q = supabase
    .from("samples")
    .select("*, profiles(name, email)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

  if (filters.status === "active") q = q.eq("deleted", false);
  if (filters.status === "deleted") q = q.eq("deleted", true);
  if (filters.country.trim()) q = q.ilike("country", `%${filters.country.trim()}%`);
  if (filters.vegetation.trim()) q = q.ilike("vegetation_type", `%${filters.vegetation.trim()}%`);
  if (term) {
    const ors = [`city.ilike.%${term}%`, `state.ilike.%${term}%`];
    if (userIds && userIds.length) ors.push(`user_id.in.(${userIds.join(",")})`);
    q = q.or(ors.join(","));
  }

  const { data, count: total, error } = await q;
  if (error) throw error;
  return { rows: (data ?? []) as unknown as AdminSample[], total: total ?? 0 };
}

export interface SampleLevel {
  id: string;
  iqms: number | null;
  sample_density: number | null;
  counts: Record<string, number>;
}

export async function getSampleDetail(sampleId: string) {
  const [levelsRes, photosRes] = await Promise.all([
    supabase
      .from("insect")
      .select(`*, ${SAMPLE_COUNTS_SELECT}`)
      .eq("sample_id", sampleId)
      .order("created_at"),
    supabase.from("photos").select("*").eq("sample_id", sampleId),
  ]);
  if (levelsRes.error) throw levelsRes.error;
  if (photosRes.error) throw photosRes.error;
  const levels: SampleLevel[] = (levelsRes.data ?? []).map((row: any) => ({
    id: row.id,
    iqms: row.iqms,
    sample_density: row.sample_density,
    counts: countsFromInsectRow(row),
  }));
  return { levels, photos: photosRes.data ?? [] };
}

export async function setSampleDeleted(sampleId: string, deleted: boolean) {
  const { error } = await supabase.from("samples").update({ deleted }).eq("id", sampleId);
  if (error) throw error;
  await audit(deleted ? "soft_delete" : "restore", "sample", sampleId);
}

/** Remove definitivamente a amostra, seus níveis, contagens e registros de fotos. */
export async function purgeSample(sampleId: string) {
  for (const table of ["photos", "insect"] as const) {
    const { error } = await supabase.from(table).delete().eq("sample_id", sampleId);
    if (error) throw error;
  }
  const { error } = await supabase.from("samples").delete().eq("id", sampleId);
  if (error) throw error;
  await audit("purge", "sample", sampleId);
}

/** Recalcula IQMS/densidade de uma amostra com a taxonomia informada. */
export async function recalculateSample(sampleId: string, taxonomy?: Taxonomy) {
  const tax = taxonomy ?? (await fetchTaxonomy());
  const { levels } = await getSampleDetail(sampleId);
  if (levels.length === 0) return null;

  for (const level of levels) {
    const r = calculateIqms([level.counts], tax);
    const { error } = await supabase
      .from("insect")
      .update({ iqms: r.score, sample_density: r.densityValue })
      .eq("id", level.id);
    if (error) throw error;
  }
  const total = calculateIqms(levels.map((l) => l.counts), tax);
  const { error } = await supabase
    .from("samples")
    .update({
      sample_score: total.score,
      sample_density: total.densityValue,
      animal_quantity: total.totalAnimals,
    })
    .eq("id", sampleId);
  if (error) throw error;
  return total;
}

/** Recalcula todas as amostras (não excluídas). Chama onProgress a cada uma. */
export async function recalculateAll(onProgress?: (done: number, total: number) => void) {
  const tax = await fetchTaxonomy();
  const { data, error } = await supabase.from("samples").select("id").eq("deleted", false);
  if (error) throw error;
  const ids = (data ?? []).map((s: any) => s.id as string);
  let done = 0;
  for (const id of ids) {
    await recalculateSample(id, tax);
    onProgress?.(++done, ids.length);
  }
  await audit("recalculate_all", "sample", null, { samples: ids.length, config_version: tax.config.version });
  return ids.length;
}

// --------------------------------------------------------------- usuários

export interface AdminUser {
  id: string;
  user_id: string;
  name: string | null;
  email: string | null;
  country: string | null;
  city: string | null;
  university: string | null;
  role: "user" | "admin";
  active: boolean;
  created_at: string;
  sampleCount: number;
}

export async function listUsers(search: string, page: number) {
  const term = search.trim().replace(/[%,()]/g, "");
  let q = supabase
    .from("profiles")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
  if (term) q = q.or(`name.ilike.%${term}%,email.ilike.%${term}%`);
  const { data, count: total, error } = await q;
  if (error) throw error;

  const ids = (data ?? []).map((p: any) => p.user_id);
  const counts: Record<string, number> = {};
  if (ids.length) {
    const { data: samples, error: sErr } = await supabase
      .from("samples")
      .select("user_id")
      .in("user_id", ids)
      .eq("deleted", false);
    if (sErr) throw sErr;
    (samples ?? []).forEach((s: any) => {
      counts[s.user_id] = (counts[s.user_id] || 0) + 1;
    });
  }
  const rows: AdminUser[] = (data ?? []).map((p: any) => ({ ...p, sampleCount: counts[p.user_id] || 0 }));
  return { rows, total: total ?? 0 };
}

export async function setUserRole(userId: string, role: "user" | "admin") {
  const { error } = await supabase.from("profiles").update({ role }).eq("user_id", userId);
  if (error) throw error;
  await audit("set_role", "user", userId, { role });
}

export async function listAuditLog(limit = 50) {
  const { data, error } = await supabase
    .from("audit_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}
