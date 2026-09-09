import { apiPost, isApiConfigured } from "./apiClient";
import type { DonationIntent, ServiceResult } from "./types";

// Don. Point d'intégration back-end (POST /donations) qui renverra une URL de
// paiement (GiveWP ou autre PSP) à ouvrir. UI fidèle en attendant.
export async function createDonation(
  intent: DonationIntent
): Promise<ServiceResult<{ checkoutUrl: string }>> {
  if (!isApiConfigured()) {
    return { ok: false, error: "Back-end non configuré." };
  }
  try {
    const data = await apiPost<{ checkoutUrl: string }>("/donations", intent);
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur inconnue" };
  }
}
