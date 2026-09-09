// Client HTTP minimal, prêt à être branché sur un futur back-end.
// L'URL de base vient de l'environnement (VITE_API_BASE_URL) ; tant qu'elle
// n'est pas définie, les services renvoient un résultat "non configuré" plutôt
// que d'échouer silencieusement.

const BASE_URL = import.meta.env.VITE_API_BASE_URL as string | undefined;

export const isApiConfigured = (): boolean => Boolean(BASE_URL);

export async function apiPost<TResponse, TBody = unknown>(
  path: string,
  body: TBody
): Promise<TResponse> {
  if (!BASE_URL) {
    throw new Error(
      "Back-end non configuré (définir VITE_API_BASE_URL pour activer l'envoi)."
    );
  }
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as TResponse;
}
