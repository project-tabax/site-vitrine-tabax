// Données de référence Sénégal + validation du téléphone mobile local.

export const titles = ["M.", "Mme", "Mlle", "Dr", "Pr", "Me"] as const;
export type Title = (typeof titles)[number];

// Les 14 régions du Sénégal.
export const regions = [
  "Dakar", "Thiès", "Diourbel", "Fatick", "Kaffrine", "Kaolack",
  "Kédougou", "Kolda", "Louga", "Matam", "Saint-Louis", "Sédhiou",
  "Tambacounda", "Ziguinchor",
] as const;

/**
 * Valide un numéro de mobile sénégalais.
 * Format national : 9 chiffres commençant par 7, 2e chiffre ∈ {0,5,6,7,8}
 * (opérateurs 70/75/76/77/78). Préfixe +221 / 00221 / 221 accepté.
 */
export function normalizeSenegalMobile(raw: string): string | null {
  let d = raw.replace(/[\s.\-()]/g, "");
  d = d.replace(/^\+221/, "").replace(/^00221/, "").replace(/^221/, "");
  return /^7[05678]\d{7}$/.test(d) ? d : null;
}

/** Formate un numéro national à 9 chiffres en « 7X XXX XX XX ». */
export function formatSenegalMobile(d: string): string {
  if (!/^\d{9}$/.test(d)) return d;
  return `${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5, 7)} ${d.slice(7, 9)}`;
}
