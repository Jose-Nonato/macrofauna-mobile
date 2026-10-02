import { TaxonKey } from "@/components/register-sample-steps/step-taxonomy";

type Code =
  | "EW"
  | "AN"
  | "TER"
  | "BLA"
  | "COL"
  | "ARA"
  | "DIPLO"
  | "CHI"
  | "HEMI"
  | "DER"
  | "LEP"
  | "GAS"
  | "DL"
  | "ISO"
  | "ORTH"
  | "OT";

// Mapeia cada chave de táxon da UI para o código usado na Eq. 3 do artigo
// (Hurtado Lugo, Velasquez & Lavelle, 2023 — Applied Soil Ecology 193).
const TAXON_KEY_TO_CODE: Record<TaxonKey, Code> = {
  earthworm: "EW",
  ant: "AN",
  isoptera: "TER",
  blattaria: "BLA",
  coleoptera: "COL",
  arachnida: "ARA",
  diplopoda: "DIPLO",
  chilopoda: "CHI",
  hemiptera: "HEMI",
  dermaptera: "DER",
  lepidoptera: "LEP",
  gasteropoda: "GAS",
  diptera_larvae: "DL",
  isopoda: "ISO",
  orthoptera: "ORTH",
  others: "OT",
};

// Pesos (Vi) da Eq. 3 do artigo (fórmula global, 3.694 sites). Isopoda e
// Orthoptera não têm peso definido no artigo (que agrupa Isopoda em
// "Others" e nem cita Orthoptera), mas a planilha de referência do
// professor (Patrick) os trata como categorias próprias com peso 18.3 —
// replicado aqui para bater com os valores já calculados por ele.
const WEIGHTS: Record<Code, number> = {
  EW: 18.3,
  AN: 16.83,
  TER: 9.2,
  BLA: 7.69,
  COL: 19.62,
  ARA: 15.09,
  DIPLO: 18.78,
  CHI: 20.12,
  HEMI: 11.29,
  DER: 7.58,
  LEP: 9.15,
  GAS: 15.08,
  DL: 16.31,
  ISO: 18.3,
  ORTH: 18.3,
  OT: 19.82,
};
const WEIGHT_DN = 24.74; // peso da densidade total (DN)
const WEIGHT_TR = 27.88; // peso da riqueza taxonômica (TR)

const CODES = Object.keys(WEIGHTS) as Code[];

export interface IqmsResult {
  totalAnimals: number;
  densityValue: number; // log10(indivíduos/m² + 1), 2 casas
  richness: number;
  score: number; // IQMS normalizado [0.1, 1.0], 2 casas
}

/**
 * Calcula densidade e IQMS a partir das contagens de táxons de UM nível
 * (ou de um conjunto já somado de vários níveis). Mesma fórmula usada
 * tanto para o score por nível quanto para o score agregado da amostra.
 */
export function calculateIqms(counts: Partial<Record<TaxonKey, number>>): IqmsResult {
  const codeTotals = {} as Record<Code, number>;
  CODES.forEach((code) => {
    codeTotals[code] = 0;
  });
  (Object.keys(TAXON_KEY_TO_CODE) as TaxonKey[]).forEach((key) => {
    const code = TAXON_KEY_TO_CODE[key];
    codeTotals[code] += counts[key] || 0;
  });

  const totalAnimals = CODES.reduce((sum, c) => sum + codeTotals[c], 0);

  // Amostra ISO/TSBF de 25x25 cm = 0,0625 m², logo 1/0,0625 = 16 converte
  // a contagem do monólito para indivíduos/m² — aplicado a cada táxon e
  // à riqueza, não só ao total (confirmado pela planilha de referência).
  const densityPerM2 = totalAnimals * 16;
  const densityValue = Number(Math.log10(densityPerM2 + 1).toFixed(2));

  const richness = CODES.filter((c) => codeTotals[c] > 0).length;

  let rawI = 0;
  CODES.forEach((c) => {
    rawI += WEIGHTS[c] * Math.log10(codeTotals[c] * 16 + 1);
  });
  rawI += WEIGHT_DN * densityValue;
  rawI += WEIGHT_TR * Math.log10(richness * 16 + 1);

  const rawScore = rawI * 0.0014 + 0.1;
  const score = Number(Math.min(1, Math.max(0.1, rawScore)).toFixed(2));

  return { totalAnimals, densityValue, richness, score };
}
