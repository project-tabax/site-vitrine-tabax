/**
 * Copie les assets d'origine du miroir vers public/ (servis aux chemins d'origine).
 * Dossiers volumineux et non versionnés (voir .gitignore) : reproductibles à tout moment.
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const MIRROR = path.resolve(ROOT, "..", "mirror-tabax");
const PUBLIC = path.join(ROOT, "public");

const DIRS = ["wp-content", "wp-includes", "_ext"];
fs.mkdirSync(PUBLIC, { recursive: true });

for (const d of DIRS) {
  const src = path.join(MIRROR, d);
  const dst = path.join(PUBLIC, d);
  if (!fs.existsSync(src)) {
    console.warn(`(absent) ${src}`);
    continue;
  }
  fs.rmSync(dst, { recursive: true, force: true });
  fs.cpSync(src, dst, { recursive: true });
  console.log(`copié ${d}/`);
}
console.log("Assets synchronisés dans public/");
