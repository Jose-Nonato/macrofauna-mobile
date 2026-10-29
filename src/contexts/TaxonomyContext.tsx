import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useI18n } from "@/hooks/useI18n";
import {
  DEFAULT_TAXONOMY,
  fetchTaxonomy,
  loadCachedTaxonomy,
  setTaxonomySnapshot,
  taxonDescription,
  taxonIcon,
  taxonImages,
  taxonName,
  type TaxonClass,
  type Taxonomy,
} from "@/lib/taxonomy";

interface TaxonomyContextValue {
  taxonomy: Taxonomy;
  /** Classes ativas, na ordem de exibição (para registrar amostras). */
  activeClasses: TaxonClass[];
  byKey: (key: string) => TaxonClass | undefined;
  nameOf: (key: string) => string;
  descriptionOf: (key: string) => string;
  iconOf: (key: string) => ReturnType<typeof taxonIcon>;
  imagesOf: (key: string) => string[];
  refresh: () => Promise<void>;
}

const TaxonomyContext = createContext<TaxonomyContextValue | null>(null);

export function TaxonomyProvider({
  userId,
  children,
}: {
  /** Muda quando o usuário entra/sai; as tabelas só podem ser lidas logado. */
  userId?: string | null;
  children: React.ReactNode;
}) {
  const { language } = useLanguage();
  const { t } = useI18n();
  const [taxonomy, setTaxonomy] = useState<Taxonomy>(DEFAULT_TAXONOMY);

  const apply = useCallback((next: Taxonomy) => {
    setTaxonomySnapshot(next);
    setTaxonomy(next);
  }, []);

  const refresh = useCallback(async () => {
    try {
      apply(await fetchTaxonomy());
    } catch (error: any) {
      console.warn("Falha ao carregar classes taxonômicas:", error?.message);
    }
  }, [apply]);

  useEffect(() => {
    let cancelled = false;
    loadCachedTaxonomy().then((cached) => {
      if (cached && !cancelled) apply(cached);
    });
    return () => {
      cancelled = true;
    };
  }, [apply]);

  useEffect(() => {
    if (userId) refresh();
  }, [userId, refresh]);

  const value = useMemo<TaxonomyContextValue>(() => {
    const find = (key: string) => taxonomy.classes.find((c) => c.key === key);
    const fallback = (k: string) => t(k, "");
    return {
      taxonomy,
      activeClasses: taxonomy.classes
        .filter((c) => c.active)
        .sort((a, b) => a.sort_order - b.sort_order),
      byKey: find,
      nameOf: (key) => {
        const c = find(key);
        return c ? taxonName(c, language, fallback) : key;
      },
      descriptionOf: (key) => {
        const c = find(key);
        return c ? taxonDescription(c, language, fallback) : "";
      },
      iconOf: (key) => taxonIcon(find(key) ?? { ...DEFAULT_TAXONOMY.classes[13], key }),
      imagesOf: (key) => {
        const c = find(key);
        return c ? taxonImages(c) : [];
      },
      refresh,
    };
  }, [taxonomy, language, t, refresh]);

  return <TaxonomyContext.Provider value={value}>{children}</TaxonomyContext.Provider>;
}

export function useTaxonomy() {
  const ctx = useContext(TaxonomyContext);
  if (!ctx) throw new Error("useTaxonomy deve ser usado dentro de TaxonomyProvider");
  return ctx;
}
