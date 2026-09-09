import { Outlet } from "react-router-dom";

/**
 * Squelette commun. Chaque page rend son corps complet (header + bandeau +
 * contenu + footer propres à la page), car le thème varie ces éléments selon
 * les pages.
 *
 * Navigation : les liens internes font une navigation classique (rechargement).
 * Ce thème (ThemeREX/Elementor) initialise son JS — menu déroulant, header
 * sticky, animations — au chargement du document ; une navigation SPA ne
 * ré-exécuterait pas ces scripts sur le nouveau markup (menu qui disparaît,
 * etc.). Un rechargement complet garantit un rendu identique au chargement
 * direct, déjà vérifié fidèle. Le Router reste la source de vérité des routes
 * (chargements directs, structure) — voir routes.tsx.
 */
export function SiteLayout() {
  return <Outlet />;
}
