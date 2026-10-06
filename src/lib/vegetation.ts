// Tipos de vegetação/uso da terra do local da amostra.
// O código é o que fica gravado em samples.vegetation_type; o nome exibido vem
// das traduções em "vegetation.<código>".
export const VEGETATION_TYPES = [
  "primary_forest",
  "secondary_forest",
  "agroforestry",
  "pasture",
  "annual_crop",
  "perennial_crop",
  "forest_plantation",
  "cerrado",
  "other",
] as const;

export type VegetationType = (typeof VEGETATION_TYPES)[number];
