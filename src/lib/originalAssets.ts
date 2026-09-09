import { cssLinks } from "@/generated/assets";

// Gestion des assets d'origine (CSS + JS) pour un rendu fidèle.

export interface PageScript {
  src?: string;
  code?: string;
}

let stylesInstalled = false;
let stickyInstalled = false;
const loadedSrc = new Set<string>();

/**
 * Installe les feuilles de style d'origine dans le <head> AVANT le premier
 * rendu (cascade correcte : liens globaux d'abord, styles inline de page ensuite).
 */
export function installOriginalStyles(): void {
  if (stylesInstalled) return;
  stylesInstalled = true;
  for (const href of cssLinks) {
    if (document.querySelector(`link[data-orig="${href}"]`)) continue;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.dataset.orig = href;
    document.head.appendChild(link);
  }

  // Override chargé en dernier : révèle les sections Elementor dont l'animation
  // d'entrée « au scroll » ne se rejoue pas en SPA (l'état final reste fidèle).
  const override = document.createElement("style");
  override.dataset.orig = "overrides";
  override.textContent = `.elementor-invisible{opacity:1 !important;visibility:visible !important;}`;
  document.head.appendChild(override);
}

function loadSrc(src: string): Promise<void> {
  if (loadedSrc.has(src)) return Promise.resolve();
  loadedSrc.add(src);
  return new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = src;
    s.async = false;
    s.dataset.orig = src;
    s.onload = () => resolve();
    s.onerror = () => resolve(); // un asset manquant ne doit pas bloquer la suite
    document.body.appendChild(s);
  });
}

function runInline(code: string): void {
  try {
    const s = document.createElement("script");
    s.textContent = code;
    document.body.appendChild(s);
    document.body.removeChild(s);
  } catch {
    /* config non critique */
  }
}

/**
 * Rejoue les scripts d'une page dans l'ordre du document : les externes déjà
 * chargés sont ignorés (persistants), les inline sont ré-exécutés à chaque
 * navigation pour ré-initialiser Elementor/plugins sur le nouveau contenu.
 */
export async function runPageScripts(scripts: PageScript[]): Promise<void> {
  for (const s of scripts) {
    if (s.src) await loadSrc(s.src);
    else if (s.code) runInline(s.code);
  }
  reinitOriginalScripts();
}

/**
 * Contrôleur de header sticky natif : reproduit le comportement ThemeREX
 * (dont l'IntersectionObserver ne se déclenche pas de façon fiable en SPA) en
 * basculant la classe `sc_layouts_row_fixed_on` sur les rangées fixes et
 * `trx_addons_page_scrolled` sur le body, selon la position de défilement.
 */
export function installStickyHeader(): void {
  if (stickyInstalled) return;
  stickyInstalled = true;

  const update = () => {
    const y = window.scrollY || document.documentElement.scrollTop || 0;
    document.body.classList.toggle("trx_addons_page_scrolled", y > 10);
    const rows = document.querySelectorAll<HTMLElement>(".sc_layouts_row_fixed");
    rows.forEach((row) => {
      // Seuil : position d'origine de la rangée (via son placeholder) ou hauteur d'en-tête.
      const ph = document.querySelector<HTMLElement>(".sc_layouts_row_fixed_placeholder");
      const threshold = ph ? Math.max(ph.offsetHeight, 60) : 100;
      const alwaysOn = row.classList.contains("sc_layouts_row_fixed_always");
      row.classList.toggle("sc_layouts_row_fixed_on", alwaysOn || y >= threshold);
    });
  };

  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
  update();
}

// Réinitialisation best-effort après injection du contenu / navigation client.
// Beaucoup d'inits du thème (header sticky ThemeREX, animations) sont liées à
// window.load / scroll / resize — déjà déclenchés avant le montage React. On
// les rejoue explicitement via jQuery pour reproduire le comportement d'origine.
export function reinitOriginalScripts(): void {
  try {
    const w = window as unknown as {
      elementorFrontend?: { init?: () => void };
      jQuery?: (t: Document | Window) => { trigger: (e: string) => unknown };
    };
    installStickyHeader(); // natif, indépendant de jQuery
    w.elementorFrontend?.init?.();
    const $ = w.jQuery;
    if ($) {
      // Événements ThemeREX : action.ready_trx_addons initialise notamment le
      // header sticky (.sc_layouts_row_fixed). L'init est auto-gardée (idempotente).
      $(document).trigger("action.ready_trx_addons");
      $(document).trigger("action.resize_trx_addons");
      $(document).trigger("action.init_hidden_elements");
      $(window).trigger("load");
      $(window).trigger("resize");
      $(window).trigger("scroll");
    }
    window.dispatchEvent(new Event("load"));
    window.dispatchEvent(new Event("resize"));
    window.dispatchEvent(new Event("scroll"));
  } catch {
    /* interactions dégradées, rendu visuel conservé */
  }
}
