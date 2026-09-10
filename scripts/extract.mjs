/**
 * Extracteur : miroir statique -> fragments React + manifeste.
 *
 * Pour chaque page du miroir (mirror-tabax/**\/index.html) :
 *  - contenu principal (.page_content_wrap) -> src/content/pages/<slug>.html
 *  - styles inline Elementor de la page      -> src/content/inline/<slug>.css
 * Header et footer (communs) sont extraits une fois depuis l'accueil.
 * Union des <link> CSS et <script src> -> src/generated/assets.ts
 * Liste des pages (slug, route, titre, catégorie) -> src/generated/pages.ts
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { load } from "cheerio";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const MIRROR = path.resolve(ROOT, "..", "mirror-tabax");

const OUT_PAGES = path.join(ROOT, "src/content/pages");
const OUT_INLINE = path.join(ROOT, "src/content/inline");
const OUT_SCRIPTS = path.join(ROOT, "src/content/scripts");
const OUT_GEN = path.join(ROOT, "src/generated");
const OUT_PARTIALS = path.join(ROOT, "src/content");
for (const d of [OUT_PAGES, OUT_INLINE, OUT_SCRIPTS, OUT_GEN])
  fs.mkdirSync(d, { recursive: true });

// --- pages du parti (priorité + libellés propres) ---
const PARTY = {
  "home": { label: "Accueil", nav: true },
  "historique": { label: "Historique", nav: true },
  "le-president": { label: "Le Président", nav: true },
  "projet-de-societe": { label: "Projet de société", nav: true },
  "69418-2": { label: "Actualité", nav: true },
  "galerie": { label: "Galerie", nav: true },
  "contact-us": { label: "Contact", nav: false },
  "formulaire-dadhesion": { label: "Adhésion", nav: false },
  "donation-form": { label: "Don", nav: false },
};

// Périmètre : uniquement les pages réelles du parti (décision projet).
function partyFiles() {
  return Object.keys(PARTY).map((slug) =>
    slug === "home"
      ? path.join(MIRROR, "index.html")
      : path.join(MIRROR, slug, "index.html")
  );
}

function routeFrom(file) {
  const rel = path.relative(MIRROR, path.dirname(file)).split(path.sep).join("/");
  return rel === "" ? "/" : "/" + rel + "/";
}
function slugFrom(route) {
  if (route === "/") return "home";
  return route.replace(/^\/|\/$/g, "").replace(/[^a-z0-9]+/gi, "-").toLowerCase();
}

const cssSet = new Set();
const jsSet = new Set();
const pages = [];
const galleries = {}; // clé -> images[] (composant natif Gallery)

const files = partyFiles().filter((f) => {
  if (fs.existsSync(f)) return true;
  console.warn(`(absent) ${f}`);
  return false;
});

for (const file of files) {
  const html = fs.readFileSync(file, "utf8");
  const $ = load(html, { decodeEntities: false });
  const route = routeFrom(file);
  const slug = slugFrom(route);

  $("link[rel=stylesheet][href]").each((_, el) => cssSet.add($(el).attr("href")));
  $("script[src]").each((_, el) => jsSet.add($(el).attr("src")));

  // Scripts dans l'ordre du document (inline + externes) : nécessaires pour
  // rejouer l'initialisation JS (config Elementor avant elementor-frontend, etc.).
  // Seuls les scripts JS classiques sont rejoués. Les blocs de données non-JS
  // (application/json, importmap, speculationrules, ld+json, text/template…)
  // ne doivent pas être exécutés : injectés comme du code ils lèvent une
  // SyntaxError (ex. « Unexpected token ':' » sur un objet JSON).
  const JS_INLINE_TYPES = new Set(["", "text/javascript", "application/javascript"]);
  const scripts = [];
  $("script").each((_, el) => {
    const $el = $(el);
    const src = $el.attr("src");
    if (src) {
      scripts.push({ src });
      return;
    }
    const type = ($el.attr("type") || "").toLowerCase();
    if (!JS_INLINE_TYPES.has(type)) return;
    const code = $el.html() || "";
    if (code.trim()) scripts.push({ code });
  });
  fs.writeFileSync(path.join(OUT_SCRIPTS, `${slug}.json`), JSON.stringify(scripts));

  // styles inline (Elementor per-post + custom) du <head>
  const inlineCss = $("head style").map((_, el) => $(el).html() || "").get().join("\n");
  if (inlineCss.trim()) fs.writeFileSync(path.join(OUT_INLINE, `${slug}.css`), inlineCss);

  // Corps complet de la page (header + bandeau + contenu + footer). Ce thème
  // utilise des en-têtes/pieds différents selon les pages : on capture donc le
  // .body_wrap entier pour garantir la fidélité de chaque page.
  let bodyWrap = $(".body_wrap").first();
  if (!bodyWrap.length) bodyWrap = $("body");
  bodyWrap.find("script, noscript").remove();

  // Dé-lazification : les images/fonds chargés en JS (data-src…) sont rendus
  // statiques pour s'afficher sans dépendre de l'init JavaScript (sliders, lazyload).
  bodyWrap.find("img[data-src]").each((_, el) => {
    const $el = $(el);
    $el.attr("src", $el.attr("data-src"));
  });
  bodyWrap.find("img[data-srcset]").each((_, el) => {
    const $el = $(el);
    $el.attr("srcset", $el.attr("data-srcset"));
  });
  bodyWrap.find("[data-bg]").each((_, el) => {
    const $el = $(el);
    const bg = $el.attr("data-bg");
    $el.attr("style", `${$el.attr("style") || ""};background-image:url('${bg}')`);
  });
  // classes de lazyload -> considérées comme déjà chargées
  bodyWrap.find(".lazyload, .lazyloading").each((_, el) => {
    $(el).removeClass("lazyload lazyloading").addClass("lazyloaded");
  });

  // Galeries WordPress (layout piloté par JS) -> remplacées par un placeholder
  // que React remplit avec le composant natif <Gallery> (grille + lightbox).
  let gi = 0;
  bodyWrap.find("figure.wp-block-gallery").each((_, el) => {
    const $g = $(el);
    const imgs = [];
    $g.find("img").each((_, im) => {
      const $im = $(im);
      const src = $im.attr("src");
      if (!src) return;
      imgs.push({ src, alt: $im.attr("alt") || "", w: +($im.attr("width") || 0), h: +($im.attr("height") || 0) });
    });
    if (imgs.length < 2) return;
    const key = `${slug}-g${gi++}`;
    galleries[key] = imgs;
    $g.replaceWith(`<div class="native-gallery" data-native="gallery" data-native-key="${key}"></div>`);
  });

  // Galerie Elementor (figures .gallery-item groupées, lien vers l'image pleine taille)
  const $items = bodyWrap.find("figure.gallery-item");
  if ($items.length >= 2) {
    const imgs = [];
    $items.each((_, it) => {
      const $it = $(it);
      const href = $it.find("a[href]").first().attr("href") || "";
      const $img = $it.find("img").first();
      const src = /\.(jpe?g|png|webp|gif)$/i.test(href) ? href : $img.attr("src") || "";
      if (src) imgs.push({ src, alt: $img.attr("alt") || "", w: +($img.attr("width") || 0), h: +($img.attr("height") || 0) });
    });
    if (imgs.length >= 2) {
      const key = `${slug}-g${gi++}`;
      galleries[key] = imgs;
      $items.first().before(`<div class="native-gallery" data-native="gallery" data-native-key="${key}"></div>`);
      $items.remove();
    }
  }

  // Adhésion : le formulaire WPForms principal est remplacé par le formulaire natif
  // (le bouton Google Forms du footer reste inchangé).
  if (slug === "formulaire-dadhesion") {
    const $form = bodyWrap.find("form.wpforms-form, .wpforms-container").first();
    if ($form.length) {
      let $w = $form.closest(".elementor-widget");
      if (!$w.length) $w = $form.closest(".wpforms-container");
      if (!$w.length) $w = $form;
      $w.replaceWith('<div class="native-membership" data-native="membership"></div>');
    }
  }

  fs.writeFileSync(path.join(OUT_PAGES, `${slug}.html`), $.html(bodyWrap));

  const title = ($("title").text() || slug).replace(/\s*&#8211;.*/, "").trim();
  const bodyClass = ($("body").attr("class") || "").replace(/\s+/g, " ").trim();
  const htmlClass = ($("html").attr("class") || "").replace(/\bno-js\b/, "js").replace(/\s+/g, " ").trim();
  const party = PARTY[slug];
  pages.push({
    slug,
    route,
    title,
    label: party?.label ?? title,
    nav: party?.nav ?? false,
    party: Boolean(party),
    hasInline: inlineCss.trim().length > 0,
    bodyClass,
    htmlClass,
  });
}

// tri : pages du parti d'abord (ordre du menu défini dans PARTY), puis le reste
const partyOrder = Object.keys(PARTY);
pages.sort((a, b) => {
  const ia = partyOrder.indexOf(a.slug);
  const ib = partyOrder.indexOf(b.slug);
  if (ia !== -1 || ib !== -1) return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
  return a.slug.localeCompare(b.slug);
});

const banner = "// Fichier généré par scripts/extract.mjs — ne pas éditer à la main.\n";
fs.writeFileSync(
  path.join(OUT_GEN, "pages.ts"),
  banner +
    "export interface PageMeta {\n" +
    "  slug: string;\n  route: string;\n  title: string;\n  label: string;\n" +
    "  nav: boolean;\n  party: boolean;\n  hasInline: boolean;\n" +
    "  bodyClass: string;\n  htmlClass: string;\n}\n\n" +
    "export const pages: PageMeta[] = " +
    JSON.stringify(pages, null, 2) +
    ";\n"
);

fs.writeFileSync(
  path.join(OUT_GEN, "assets.ts"),
  banner +
    "// Union des feuilles de style et scripts d'origine, chargés globalement.\n" +
    "export const cssLinks: string[] = " +
    JSON.stringify([...cssSet], null, 2) +
    ";\n\nexport const jsScripts: string[] = " +
    JSON.stringify([...jsSet], null, 2) +
    ";\n"
);

fs.writeFileSync(
  path.join(OUT_GEN, "natives.ts"),
  banner +
    "export interface GalleryImage { src: string; alt: string; w: number; h: number; }\n\n" +
    "// Galeries extraites, rendues par le composant natif <Gallery>.\n" +
    "export const galleries: Record<string, GalleryImage[]> = " +
    JSON.stringify(galleries, null, 2) +
    ";\n"
);

console.log(
  `Pages: ${pages.length} | CSS union: ${cssSet.size} | JS union: ${jsSet.size} | galeries natives: ${Object.keys(galleries).length}`
);
