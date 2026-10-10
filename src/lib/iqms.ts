import type { TaxonKey } from "@/components/register-sample-steps/step-taxonomy";

type Code =
  | "EWM"
  | "ANT"
  | "TER"
  | "COL"
  | "CHILO"
  | "DIPLO"
  | "DIPT"
  | "BLA"
  | "HEMI"
  | "DERM"
  | "LEPI"
  | "GAST"
  | "ARAC"
  | "OTH";

// Mapeia cada chave de táxon da UI para o código usado na planilha de
// referência (Taller Patrick). Isopoda, Hymenoptera não-formiga, ácaros etc.
// entram em "Outros" (OTH).
const TAXON_KEY_TO_CODE: Record<TaxonKey, Code> = {
  earthworm: "EWM",
  ant: "ANT",
  isoptera: "TER",
  coleoptera: "COL",
  chilopoda: "CHILO",
  diplopoda: "DIPLO",
  diptera_larvae: "DIPT",
  blattaria: "BLA",
  hemiptera: "HEMI",
  dermaptera: "DERM",
  lepidoptera: "LEPI",
  gasteropoda: "GAST",
  arachnida: "ARAC",
  others: "OTH",
};

// Pesos (Vi) de cada classe na planilha de referência.
const WEIGHTS: Record<Code, number> = {
  EWM: 18.3,
  ANT: 16.83,
  TER: 9.2,
  COL: 19.62,
  CHILO: 20.12,
  DIPLO: 18.78,
  DIPT: 16.31,
  BLA: 7.69,
  HEMI: 11.29,
  DERM: 7.58,
  LEPI: 9.15,
  GAST: 15.08,
  ARAC: 15.09,
  OTH: 19.82,
};
const WEIGHT_DEN = 24.74; // peso da densidade total (DEN)
const WEIGHT_RT = 27.88; // peso da riqueza taxonômica (RT)

// Monólito de 25x25 cm = 0,0625 m² → multiplicar por 16 converte a
// contagem média do monólito para indivíduos/m².
const M2_FACTOR = 16;

const CODES = Object.keys(WEIGHTS) as Code[];

export type TaxonCounts = Partial<Record<TaxonKey, number>>;

export interface IqmsResult {
  totalAnimals: number; // soma de indivíduos de todas as amostras/níveis
  densityValue: number; // densidade em indivíduos/m² (média por nível × 16), inteiro
  richness: number; // média de classes presentes por amostra/nível
  score: number; // IQMS normalizado [0.1, 1.0], 2 casas
}

/**
 * Calcula densidade e IQMS conforme a planilha de referência:
 *  1. por classe: média das contagens entre os níveis, log10(média × 16 + 1);
 *  2. DEN: média do total de indivíduos por nível, log10(média × 16 + 1);
 *  3. RT: média do nº de classes presentes por nível, log10(média × 16 + 1);
 *  4. IQMS = 0,0014 × Σ(peso × log10) + 0,1, limitado a [0,1; 1,0].
 * Para calcular o score de UM nível isolado, passe `[nivel]`.
 */
export function calculateIqms(levels: TaxonCounts[]): IqmsResult {
  const n = Math.max(levels.length, 1);

  const codeSums = {} as Record<Code, number>;
  CODES.forEach((c) => {
    codeSums[c] = 0;
  });

  let totalAnimals = 0;
  let richnessSum = 0;

  levels.forEach((level) => {
    const levelCodeTotals = {} as Record<Code, number>;
    CODES.forEach((c) => {
      levelCodeTotals[c] = 0;
    });
    (Object.keys(TAXON_KEY_TO_CODE) as TaxonKey[]).forEach((key) => {
      levelCodeTotals[TAXON_KEY_TO_CODE[key]] += level[key] || 0;
    });
    CODES.forEach((c) => {
      codeSums[c] += levelCodeTotals[c];
      totalAnimals += levelCodeTotals[c];
      if (levelCodeTotals[c] > 0) richnessSum += 1;
    });
  });

  const log = (mean: number) => Math.log10(mean * M2_FACTOR + 1);

  const meanDensity = totalAnimals / n;
  const meanRichness = richnessSum / n;
  const densityLog = log(meanDensity);

  let rawI = 0;
  CODES.forEach((c) => {
    rawI += WEIGHTS[c] * log(codeSums[c] / n);
  });
  rawI += WEIGHT_DEN * densityLog;
  rawI += WEIGHT_RT * log(meanRichness);

  const rawScore = rawI * 0.0014 + 0.1;
  const score = Number(Math.min(1, Math.max(0.1, rawScore)).toFixed(2));

  return {
    totalAnimals,
    densityValue: Math.round(meanDensity * M2_FACTOR),
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
