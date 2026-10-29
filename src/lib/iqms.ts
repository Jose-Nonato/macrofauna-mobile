import { getTaxonomySnapshot, type Taxonomy } from "./taxonomy";

// Contagens de um nível (profundidade), indexadas pela chave da classe.
export type TaxonCounts = Record<string, number>;

export interface IqmsResult {
  totalAnimals: number; // soma de indivíduos de todas as amostras/níveis
  densityValue: number; // densidade em indivíduos/m² (média por nível × fator), inteiro
  richness: number; // média de classes presentes por amostra/nível
  score: number; // IQMS normalizado [0.1, 1.0], 2 casas
}

/**
 * Calcula densidade e IQMS conforme a planilha de referência:
 *  1. por classe: média das contagens entre os níveis, log10(média × fator + 1);
 *  2. DEN: média do total de indivíduos por nível, log10(média × fator + 1);
 *  3. RT: média do nº de classes presentes por nível, log10(média × fator + 1);
 *  4. IQMS = 0,0014 × Σ(peso × log10) + 0,1, limitado a [0,1; 1,0].
 * Pesos, classes e fator (monólito de 25x25 cm = 0,0625 m² → 16) vêm da
 * taxonomia cadastrada no banco; sem argumento usa a última carregada.
 * Para calcular o score de UM nível isolado, passe `[nivel]`.
 */
export function calculateIqms(
  levels: TaxonCounts[],
  taxonomy: Taxonomy = getTaxonomySnapshot(),
): IqmsResult {
  const n = Math.max(levels.length, 1);
  const { classes, config } = taxonomy;

  const sums: Record<string, number> = {};
  classes.forEach((c) => {
    sums[c.key] = 0;
  });

  let totalAnimals = 0;
  let richnessSum = 0;

  levels.forEach((level) => {
    classes.forEach((c) => {
      const count = level[c.key] || 0;
      sums[c.key] += count;
      totalAnimals += count;
      if (count > 0) richnessSum += 1;
    });
  });

  const log = (mean: number) => Math.log10(mean * config.monolith_factor + 1);

  const meanDensity = totalAnimals / n;
  const meanRichness = richnessSum / n;
  const densityLog = log(meanDensity);

  let rawI = 0;
  classes.forEach((c) => {
    rawI += c.weight_vi * log(sums[c.key] / n);
  });
  rawI += config.weight_den * densityLog;
  rawI += config.weight_rt * log(meanRichness);

  const rawScore = rawI * 0.0014 + 0.1;
  const score = Number(Math.min(1, Math.max(0.1, rawScore)).toFixed(2));

  return {
    totalAnimals,
    densityValue: Math.round(meanDensity * config.monolith_factor),
    richness: Number(meanRichness.toFixed(2)),
    score,
  };
}

/**
 * Registros antigos podem ter contagens em colunas que não existem mais
 * (isopoda, orthoptera). Agora essas classes pertencem a "Outros".
 */
export function othersWithLegacy(row: any): number {
  return (row?.others || 0) + (row?.isopoda || 0) + (row?.orthoptera || 0);
}
