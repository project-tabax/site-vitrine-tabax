import { apiPost, isApiConfigured } from "./apiClient";
import type { ContactMessage, ServiceResult } from "./types";

// Envoi d'un message de contact. Point d'intégration back-end : POST /contact.
export async function submitContactMessage(
  payload: ContactMessage
): Promise<ServiceResult> {
  if (!isApiConfigured()) {
    return { ok: false, error: "Back-end non configuré." };
  }
  try {
    await apiPost("/contact", payload);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur inconnue" };
  }
}
