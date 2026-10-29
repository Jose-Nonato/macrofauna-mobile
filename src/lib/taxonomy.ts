import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ImageSourcePropType } from "react-native";
import { supabase } from "./supabase";
import { TAXON_ICONS, TAXON_IMAGES } from "./taxonInfo";

export interface TaxonClass {
  /** null nas classes de fábrica (ainda não carregadas do banco). */
  id: string | null;
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

export interface IqmsConfig {
  weight_den: number;
  weight_rt: number;
  monolith_factor: number;
  version: number;
}

export interface Taxonomy {
  /** Todas as classes (inclusive inativas): necessárias para amostras antigas. */
  classes: TaxonClass[];
  config: IqmsConfig;
}

/** Classes que ainda têm coluna própria na tabela `insect` (app antigo). */
export const LEGACY_TAXON_KEYS = [
  "earthworm",
  "ant",
  "isoptera",
  "coleoptera",
  "chilopoda",
  "diplopoda",
  "diptera_larvae",
  "blattaria",
  "hemiptera",
  "dermaptera",
  "lepidoptera",
  "gasteropoda",
  "arachnida",
  "others",
] as const;

// Valores de fábrica (planilha do Taller Patrick). Usados enquanto o banco não
// respondeu e como fallback offline; os nomes vêm dos arquivos de idioma.
const DEFAULT_CLASSES: [string, string, number][] = [
  ["earthworm", "EWM", 18.3],
  ["ant", "ANT", 16.83],
  ["isoptera", "TER", 9.2],
  ["coleoptera", "COL", 19.62],
  ["chilopoda", "CHILO", 20.12],
  ["diplopoda", "DIPLO", 18.78],
  ["diptera_larvae", "DIPT", 16.31],
  ["blattaria", "BLA", 7.69],
  ["hemiptera", "HEMI", 11.29],
  ["dermaptera", "DERM", 7.58],
  ["lepidoptera", "LEPI", 9.15],
  ["gasteropoda", "GAST", 15.08],
  ["arachnida", "ARAC", 15.09],
  ["others", "OTH", 19.82],
];

export const DEFAULT_TAXONOMY: Taxonomy = {
  classes: DEFAULT_CLASSES.map(([key, code, weight_vi], i) => ({
    id: null,
    key,
    code,
    names: {},
    descriptions: {},
    weight_vi,
    icon_url: null,
    image_urls: [],
    active: true,
    sort_order: i + 1,
  })),
  config: { weight_den: 24.74, weight_rt: 27.88, monolith_factor: 16, version: 1 },
};

const CACHE_KEY = "taxonomy_cache_v1";

let snapshot: Taxonomy = DEFAULT_TAXONOMY;

/** Última taxonomia carregada (ou a de fábrica). Para código fora de componentes. */
export function getTaxonomySnapshot(): Taxonomy {
  return snapshot;
}

export function setTaxonomySnapshot(taxonomy: Taxonomy) {
  snapshot = taxonomy;
}

export async function loadCachedTaxonomy(): Promise<Taxonomy | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Taxonomy;
    return parsed?.classes?.length ? parsed : null;
  } catch {
    return null;
  }
}

/** Busca classes e parâmetros no Supabase e atualiza o cache local. */
export async function fetchTaxonomy(): Promise<Taxonomy> {
  const [classesRes, configRes] = await Promise.all([
    supabase.from("taxon_classes").select("*").order("sort_order"),
    supabase.from("iqms_config").select("*").eq("id", 1).maybeSingle(),
  ]);
  if (classesRes.error) throw classesRes.error;
  if (configRes.error) throw configRes.error;
  if (!classesRes.data?.length) throw new Error("Nenhuma classe taxonômica cadastrada");

  const taxonomy: Taxonomy = {
    classes: classesRes.data.map((c: any) => ({
      id: c.id,
      key: c.key,
      code: c.code,
      names: c.names ?? {},
      descriptions: c.descriptions ?? {},
      weight_vi: Number(c.weight_vi),
      icon_url: c.icon_url ?? null,
      image_urls: c.image_urls ?? [],
      active: !!c.active,
      sort_order: c.sort_order ?? 0,
    })),
    config: configRes.data
      ? {
          weight_den: Number(configRes.data.weight_den),
          weight_rt: Number(configRes.data.weight_rt),
          monolith_factor: Number(configRes.data.monolith_factor),
          version: configRes.data.version,
        }
      : DEFAULT_TAXONOMY.config,
  };
  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(taxonomy));
  } catch {}
  return taxonomy;
}

// --- Apresentação (nome, descrição, ícone e fotos de uma classe) ---

export function taxonName(c: TaxonClass, language: string, fallback: (key: string) => string) {
  return c.names[language] || c.names.pt || fallback(`taxon.${c.key}`) || c.key;
}

export function taxonDescription(c: TaxonClass, language: string, fallback: (key: string) => string) {
  return c.descriptions[language] || c.descriptions.pt || fallback(`taxonInfo.${c.key}`) || "";
}

export function taxonIcon(c: TaxonClass): ImageSourcePropType {
  if (c.icon_url) return { uri: c.icon_url };
  return TAXON_ICONS[c.key] ?? TAXON_ICONS.others;
}

export function taxonImages(c: TaxonClass): string[] {
  return c.image_urls.length ? c.image_urls : (TAXON_IMAGES[c.key] ?? []);
}

// --- Contagens de uma linha de `insect` ---

/**
 * Contagens por classe de um registro de profundidade. Usa `sample_counts`
 * (embutido na consulta) quando existe; senão cai nas colunas fixas de
 * `insect`, preenchidas pelo app antigo. "Outros" inclui isopoda/orthoptera.
 */
export function countsFromInsectRow(row: any): Record<string, number> {
  const out: Record<string, number> = {};
  if (row?.sample_counts?.length) {
    for (const c of row.sample_counts) {
      const key = c?.taxon_classes?.key;
      if (key) out[key] = (out[key] || 0) + (c.count || 0);
    }
    return out;
  }
  for (const key of LEGACY_TAXON_KEYS) out[key] = row?.[key] || 0;
  out.others = (row?.others || 0) + (row?.isopoda || 0) + (row?.orthoptera || 0);
  return out;
}

/** Trecho de `select` do PostgREST que traz as contagens normalizadas. */
export const SAMPLE_COUNTS_SELECT = "sample_counts(count, taxon_classes(key))";
