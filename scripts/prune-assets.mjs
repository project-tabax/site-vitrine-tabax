/**
 * Élagage de public/ : ne conserve que les assets d'origine réellement
 * référencés par la vitrine, afin de garder un repo autonome mais léger.
 *
 * Ensemble « à garder » calculé par fermeture transitive :
 *   1. chemins /wp-content, /wp-includes, /_ext cités dans les fragments HTML,
 *      les styles inline et generated/assets.ts (CSS + JS) ;
 *   2. + tout ce que les CSS conservés référencent via url(...) / @import
 *      (polices, images de fond) — sinon les icônes/polices manquent.
 *
 * Les médias externalisés (EXTERNAL_ASSETS, ex. la grosse vidéo) sont exclus :
 * ils sont servis depuis le site d'origine (voir src/lib/originalAssets.ts).
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PUBLIC = path.join(ROOT, "public");
const ASSET_DIRS = ["wp-content", "wp-includes", "_ext"];

// Médias non versionnés (doivent correspondre à EXTERNAL_ASSETS côté runtime).
const EXTERNAL = new Set([
  "/wp-content/uploads/2025/12/XEL-YI-DAL-XOL-YI-FEEX-POOS-YI-FEES.mp4",
]);

const ASSET_RE = /\/(?:wp-content|wp-includes|_ext)\/[^"'`)\s?>]+/g;

// Normalise un chemin d'asset : enlève query/hash, décode les %xx.
function normalize(p) {
  const clean = p.split("?")[0].split("#")[0];
  try {
    return decodeURIComponent(clean);
  } catch {
    return clean;
  }
}

// Graine : fragments + inline + assets.ts.
const keep = new Set();
function addFromText(txt) {
  const m = txt.match(ASSET_RE);
  if (m) for (const r of m) keep.add(normalize(r));
}

for (const dir of ["src/content/pages", "src/content/inline"]) {
  const abs = path.join(ROOT, dir);
  if (!fs.existsSync(abs)) continue;
  for (const f of fs.readdirSync(abs)) {
    addFromText(fs.readFileSync(path.join(abs, f), "utf8"));
  }
}
addFromText(fs.readFileSync(path.join(ROOT, "src/generated/assets.ts"), "utf8"));

// Fermeture transitive : suivre les url(...) / @import des CSS conservés.
const URL_RE = /url\(\s*['"]?([^'")]+)['"]?\s*\)/g;
const IMPORT_RE = /@import\s+['"]([^'"]+)['"]/g;

function resolveCssRef(cssAbsPath, ref) {
  if (/^(https?:)?\/\//.test(ref) || ref.startsWith("data:")) return null;
  const clean = normalize(ref);
  let abs;
  if (clean.startsWith("/")) {
    abs = path.join(PUBLIC, clean);
  } else {
    abs = path.resolve(path.dirname(cssAbsPath), clean);
  }
  const rel = path.relative(PUBLIC, abs).split(path.sep).join("/");
  if (rel.startsWith("..")) return null; // hors public/
  return "/" + rel;
}

const processed = new Set();
const queue = [...keep].filter((r) => r.endsWith(".css"));
while (queue.length) {
  const cssRef = queue.pop();
  if (processed.has(cssRef)) continue;
  processed.add(cssRef);
  const cssAbs = path.join(PUBLIC, normalize(cssRef).replace(/^\//, ""));
  if (!fs.existsSync(cssAbs)) continue;
  const css = fs.readFileSync(cssAbs, "utf8");
  for (const re of [URL_RE, IMPORT_RE]) {
    let m;
    while ((m = re.exec(css))) {
      const resolved = resolveCssRef(cssAbs, m[1]);
      if (!resolved || keep.has(resolved)) continue;
      keep.add(resolved);
      if (resolved.endsWith(".css")) queue.push(resolved);
    }
  }
}

// Retire les médias externalisés de l'ensemble à garder.
for (const ext of EXTERNAL) keep.delete(ext);

// Parcours de public/ : supprime tout fichier non référencé, puis les dossiers vides.
let kept = 0;
let removed = 0;
let removedBytes = 0;

function walk(absDir) {
  for (const name of fs.readdirSync(absDir)) {
    const abs = path.join(absDir, name);
    const stat = fs.statSync(abs);
    if (stat.isDirectory()) {
      walk(abs);
      if (fs.readdirSync(abs).length === 0) fs.rmdirSync(abs);
    } else {
      const rel = "/" + path.relative(PUBLIC, abs).split(path.sep).join("/");
      if (keep.has(rel)) {
        kept++;
      } else {
        removedBytes += stat.size;
        fs.rmSync(abs);
        removed++;
      }
    }
  }
}

for (const dir of ASSET_DIRS) {
  const abs = path.join(PUBLIC, dir);
  if (fs.existsSync(abs)) walk(abs);
}

console.log(
  `Élagage terminé : ${kept} fichiers conservés, ${removed} supprimés ` +
    `(${(removedBytes / 1048576).toFixed(1)} Mo libérés).`
);
