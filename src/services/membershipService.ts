import { apiPost, isApiConfigured } from "./apiClient";
import { contact } from "@/data/site";
import type { MembershipApplication, ServiceResult } from "./types";

// Adhésion. Le site actuel s'appuie sur un formulaire Google Forms externe :
// on expose son URL (comportement fidèle) et un point d'intégration back-end
// pour une future adhésion native (POST /memberships).
export function getMembershipFormUrl(): string {
  return contact.membershipFormUrl;
}

export async function submitMembership(
  payload: MembershipApplication
): Promise<ServiceResult> {
  if (!isApiConfigured()) {
    return { ok: false, error: "Back-end non configuré." };
  }
  try {
    await apiPost("/memberships", payload);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur inconnue" };
  }
}
