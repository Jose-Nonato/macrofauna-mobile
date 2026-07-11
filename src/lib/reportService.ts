import { supabase } from "./supabase";

export interface LocationOptions {
  countries: string[];
  states: Record<string, string[]>;
  cities: Record<string, string[]>;
}

export interface ReportData {
  totalSamples: number;
  averageScore: number;
  goodCount: number;
  regularCount: number;
  mediocreCount: number;
  poorCount: number;
  taxonData: {
    earthworm: number;
    ant: number;
    isoptera: number;
    blattaria: number;
    coleoptera: number;
    arachnida: number;
    diplopoda: number;
    chilopoda: number;
    hemiptera: number;
    lepidoptera: number;
    gasteropoda: number;
    dermaptera: number;
    others: number;
  };
}

export async function generateReport(
  country?: string,
  state?: string,
  city?: string,
  startDate?: string,
  endDate?: string
): Promise<ReportData> {
    country,
    state,
    city,
    startDate,
    endDate,
  });

  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error("Usuário não autenticado");

    // Construir query de amostras com filtros
    let samplesQuery = supabase
      .from("samples")
      .select("id, sample_score, created_at")
      .eq("user_id", userData.user.id);

    if (country) samplesQuery = samplesQuery.eq("country", country);
    if (state) samplesQuery = samplesQuery.eq("state", state);
    if (city) samplesQuery = samplesQuery.eq("city", city);

    if (startDate) {
      samplesQuery = samplesQuery.gte("created_at", startDate);
    }
    if (endDate) {
      // Adicionar um dia para incluir todo o dia final
      const endDatePlus = new Date(endDate);
      endDatePlus.setDate(endDatePlus.getDate() + 1);
      samplesQuery = samplesQuery.lt(
        "created_at",
        endDatePlus.toISOString().split("T")[0]
      );
    }

    const { data: samplesData, error: samplesError } = await samplesQuery;

    if (samplesError) throw samplesError;

    const sampleIds = samplesData?.map((s) => s.id) || [];
    const totalSamples = sampleIds.length;


    // Calcular contagens por categoria
    let goodCount = 0;
    let regularCount = 0;
    let mediocreCount = 0;
    let poorCount = 0;
    let scoreSum = 0;

    if (samplesData) {
      samplesData.forEach((sample) => {
        const score = sample.sample_score || 0;
        scoreSum += score;

        if (score >= 0.75) goodCount++;
        else if (score >= 0.5) regularCount++;
        else if (score >= 0.25) mediocreCount++;
        else poorCount++;
      });
    }

    const averageScore = totalSamples > 0 ? scoreSum / totalSamples : 0;

    // Buscar dados de insetos - TODOS os registros para as amostras
    const { data: insectsData, error: insectsError } = await supabase
      .from("insect")
      .select(
        "sample_id, earthworm, ant, isoptera, blattaria, coleoptera, arachnida, diplopoda, chilopoda, hemiptera, lepidoptera, gasteropoda, dermaptera, others"
      )
      .in("sample_id", sampleIds);

    if (insectsError) throw insectsError;


    // Somar dados de insetos - acumula TODOS os registros
    const taxonData = {
      earthworm: 0,
      ant: 0,
      isoptera: 0,
      blattaria: 0,
      coleoptera: 0,
      arachnida: 0,
      diplopoda: 0,
      chilopoda: 0,
      hemiptera: 0,
      lepidoptera: 0,
      gasteropoda: 0,
      dermaptera: 0,
      others: 0,
    };

    if (insectsData && insectsData.length > 0) {
      insectsData.forEach((insect) => {
        taxonData.earthworm += insect.earthworm || 0;
        taxonData.ant += insect.ant || 0;
        taxonData.isoptera += insect.isoptera || 0;
        taxonData.blattaria += insect.blattaria || 0;
        taxonData.coleoptera += insect.coleoptera || 0;
        taxonData.arachnida += insect.arachnida || 0;
        taxonData.diplopoda += insect.diplopoda || 0;
        taxonData.chilopoda += insect.chilopoda || 0;
        taxonData.hemiptera += insect.hemiptera || 0;
        taxonData.lepidoptera += insect.lepidoptera || 0;
        taxonData.gasteropoda += insect.gasteropoda || 0;
        taxonData.dermaptera += insect.dermaptera || 0;
        taxonData.others += insect.others || 0;
      });

    }


    return {
      totalSamples,
      averageScore: Number(averageScore.toFixed(2)),
      goodCount,
      regularCount,
      mediocreCount,
      poorCount,
      taxonData,
    };
  } catch (error: any) {
    throw error;
  }
}

export async function getSamplesWithInsects(
  country?: string,
  state?: string,
  city?: string,
  startDate?: string,
  endDate?: string
): Promise<
  Array<{
    id: string;
    sample_score: number;
    earthworm: number;
    ant: number;
    isoptera: number;
    blattaria: number;
    coleoptera: number;
    arachnida: number;
    diplopoda: number;
    chilopoda: number;
    hemiptera: number;
    lepidoptera: number;
    gasteropoda: number;
    dermaptera: number;
    others: number;
  }>
> {

  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error("Usuário não autenticado");

    // Construir query de amostras com filtros
    let samplesQuery = supabase
      .from("samples")
      .select("id, sample_score, created_at")
      .eq("user_id", userData.user.id);

    if (country) samplesQuery = samplesQuery.eq("country", country);
    if (state) samplesQuery = samplesQuery.eq("state", state);
    if (city) samplesQuery = samplesQuery.eq("city", city);

    if (startDate) {
      samplesQuery = samplesQuery.gte("created_at", startDate);
    }
    if (endDate) {
      const endDatePlus = new Date(endDate);
      endDatePlus.setDate(endDatePlus.getDate() + 1);
      samplesQuery = samplesQuery.lt(
        "created_at",
        endDatePlus.toISOString().split("T")[0]
      );
    }

    const { data: samplesData, error: samplesError } = await samplesQuery;

    if (samplesError) throw samplesError;

    const sampleIds = samplesData?.map((s) => s.id) || [];

    if (sampleIds.length === 0) {
      return [];
    }

    // Buscar insetos para as amostras
    const { data: insectsData, error: insectsError } = await supabase
      .from("insect")
      .select(
        "sample_id, iqms, earthworm, ant, isoptera, blattaria, coleoptera, arachnida, diplopoda, chilopoda, hemiptera, lepidoptera, gasteropoda, dermaptera, others"
      )
      .in("sample_id", sampleIds);

    if (insectsError) throw insectsError;

    // Agrupar por sample_id e somar todos os níveis
    const sampleMap = new Map<
      string,
      {
        id: string;
        sample_score: number;
        earthworm: number;
        ant: number;
        isoptera: number;
        blattaria: number;
        coleoptera: number;
        arachnida: number;
        diplopoda: number;
        chilopoda: number;
        hemiptera: number;
        lepidoptera: number;
        gasteropoda: number;
        dermaptera: number;
        others: number;
      }
    >();

    if (insectsData) {
      insectsData.forEach((insect) => {
        const sampleId = insect.sample_id;

        if (!sampleMap.has(sampleId)) {
          sampleMap.set(sampleId, {
            id: sampleId,
            sample_score: insect.iqms || 0,
            earthworm: 0,
            ant: 0,
            isoptera: 0,
            blattaria: 0,
            coleoptera: 0,
            arachnida: 0,
            diplopoda: 0,
            chilopoda: 0,
            hemiptera: 0,
            lepidoptera: 0,
            gasteropoda: 0,
            dermaptera: 0,
            others: 0,
          });
        }

        const sample = sampleMap.get(sampleId)!;
        sample.earthworm += insect.earthworm || 0;
        sample.ant += insect.ant || 0;
        sample.isoptera += insect.isoptera || 0;
        sample.blattaria += insect.blattaria || 0;
        sample.coleoptera += insect.coleoptera || 0;
        sample.arachnida += insect.arachnida || 0;
        sample.diplopoda += insect.diplopoda || 0;
        sample.chilopoda += insect.chilopoda || 0;
        sample.hemiptera += insect.hemiptera || 0;
        sample.lepidoptera += insect.lepidoptera || 0;
        sample.gasteropoda += insect.gasteropoda || 0;
        sample.dermaptera += insect.dermaptera || 0;
        sample.others += insect.others || 0;
      });
    }

    const result = Array.from(sampleMap.values());

      "📊 [REPORT] Amostras com insetos consolidadas:",
      result.length
    );
    return result;
  } catch (error: any) {
      "📊 [REPORT] Erro ao buscar amostras com insetos:",
      error.message
    );
    throw error;
  }
}

export function generateCSV(
  samplesWithInsects: Array<{
    id: string;
    sample_score: number;
    earthworm: number;
    ant: number;
    isoptera: number;
    blattaria: number;
    coleoptera: number;
    arachnida: number;
    diplopoda: number;
    chilopoda: number;
    hemiptera: number;
    lepidoptera: number;
    gasteropoda: number;
    dermaptera: number;
    others: number;
  }>
): string {
  const lines: string[] = [];

  // Header
  lines.push("RELATÓRIO DE MACROFAUNA - INDICADOR IQMS");
  lines.push("");
  lines.push("DATA DO RELATÓRIO," + new Date().toLocaleDateString("pt-BR"));
  lines.push("");

  // Cabeçalho da tabela
  lines.push("ID DA AMOSTRA,IQMS");
  lines.push(
    "Minhoca,Formiga,Cupim,Barata,Besouro,Aranha,Milípede,Centípede,Hemíptera,Borboleta,Gastrópode,Tesourinha,Outros"
  );

  const header = [
    "ID_AMOSTRA",
    "IQMS",
    "MINHOCA",
    "FORMIGA",
    "CUPIM",
    "BARATA",
    "BESOURO",
    "ARANHA",
    "MILÍPEDE",
    "CENTÍPEDE",
    "HEMÍPTERA",
    "BORBOLETA",
    "GASTRÓPODE",
    "TESOURINHA",
    "OUTROS",
  ];
  lines.push(header.join(","));

  // Dados das amostras
  samplesWithInsects.forEach((sample) => {
    const row = [
      sample.id,
      sample.sample_score.toFixed(2),
      sample.earthworm,
      sample.ant,
      sample.isoptera,
      sample.blattaria,
      sample.coleoptera,
      sample.arachnida,
      sample.diplopoda,
      sample.chilopoda,
      sample.hemiptera,
      sample.lepidoptera,
      sample.gasteropoda,
      sample.dermaptera,
      sample.others,
    ];
    lines.push(row.join(","));
  });

  return lines.join("\n");
}

export async function getLocationOptions(): Promise<LocationOptions> {

  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error("Usuário não autenticado");

    // Buscar todos os registros do usuário
    const { data: samples, error } = await supabase
      .from("samples")
      .select("country, state, city")
      .eq("user_id", userData.user.id);

    if (error) throw error;

    // Extrair opções únicas
    const countries = new Set<string>();
    const statesByCountry: Record<string, Set<string>> = {};
    const citiesByState: Record<string, Set<string>> = {};

    if (samples) {
      samples.forEach((sample) => {
        if (sample.country) {
          countries.add(sample.country);

          if (!statesByCountry[sample.country]) {
            statesByCountry[sample.country] = new Set();
          }
          if (sample.state) {
            statesByCountry[sample.country].add(sample.state);

            const stateKey = `${sample.country}-${sample.state}`;
            if (!citiesByState[stateKey]) {
              citiesByState[stateKey] = new Set();
            }
            if (sample.city) {
              citiesByState[stateKey].add(sample.city);
            }
          }
        }
      });
    }

    // Converter Sets em Arrays
    const countryArray = Array.from(countries).sort();
    const statesRecord: Record<string, string[]> = {};
    const citiesRecord: Record<string, string[]> = {};

    Object.entries(statesByCountry).forEach(([country, states]) => {
      statesRecord[country] = Array.from(states).sort();
    });

    Object.entries(citiesByState).forEach(([key, cities]) => {
      citiesRecord[key] = Array.from(cities).sort();
    });


    return {
      countries: countryArray,
      states: statesRecord,
      cities: citiesRecord,
    };
  } catch (error: any) {
    throw error;
  }
}
