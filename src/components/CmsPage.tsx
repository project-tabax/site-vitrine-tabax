import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { HtmlFragment } from "./HtmlFragment";
import { Gallery } from "./Gallery";
import { MembershipForm } from "./MembershipForm";
import { runPageScripts, type PageScript } from "@/lib/originalAssets";
import { galleries } from "@/generated/natives";

interface NativeSlot {
  type: string;
  key: string;
  node: HTMLElement;
}

// Chargeurs paresseux des fragments générés (contenu, styles inline, scripts).
const pageLoaders = import.meta.glob("@/content/pages/*.html", {
  query: "?raw",
  import: "default",
}) as Record<string, () => Promise<string>>;

const inlineLoaders = import.meta.glob("@/content/inline/*.css", {
  query: "?raw",
  import: "default",
}) as Record<string, () => Promise<string>>;

const scriptLoaders = import.meta.glob("@/content/scripts/*.json", {
  import: "default",
}) as Record<string, () => Promise<PageScript[]>>;

function find<T>(map: Record<string, () => Promise<T>>, slug: string, ext: string) {
  const key = Object.keys(map).find((k) => k.endsWith(`/${slug}.${ext}`));
  return key ? map[key] : null;
}

interface Props {
  slug: string;
  title: string;
  bodyClass?: string;
  htmlClass?: string;
}

/**
 * Page générique : applique les classes de thème d'origine, charge le contenu
 * + styles inline Elementor, puis rejoue les scripts de la page (init Elementor,
 * menu, animations). Garantit un rendu fidèle.
 */
export function CmsPage({ slug, title, bodyClass, htmlClass }: Props) {
  const [html, setHtml] = useState<string | null>(null);
  const [slots, setSlots] = useState<NativeSlot[]>([]);
  const scriptsRef = useRef<PageScript[]>([]);

  useEffect(() => {
    let alive = true;
    setSlots([]);
    document.title = `${title} – Tabax Construire`;
    window.scrollTo(0, 0);
    if (bodyClass) document.body.className = bodyClass;
    if (htmlClass) document.documentElement.className = htmlClass;

    // styles inline propres à la page
    let styleEl: HTMLStyleElement | null = null;
    const inline = find(inlineLoaders, slug, "css");

    const loadHtml = find(pageLoaders, slug, "html");
    const loadScripts = find(scriptLoaders, slug, "json");

    Promise.all([
      inline ? inline() : Promise.resolve<string | null>(null),
      loadHtml ? loadHtml() : Promise.resolve<string | null>(null),
      loadScripts ? loadScripts() : Promise.resolve<PageScript[]>([]),
    ]).then(([css, raw, scripts]) => {
      if (!alive) return;
      if (css) {
        styleEl = document.createElement("style");
        styleEl.dataset.page = slug;
        styleEl.textContent = css;
        document.head.appendChild(styleEl);
      }
      scriptsRef.current = scripts ?? [];
      setHtml(
        raw ??
          `<div class="container" style="padding:120px 0"><h1>Page introuvable</h1></div>`
      );
    });

    return () => {
      alive = false;
      if (styleEl) document.head.removeChild(styleEl);
    };
  }, [slug, title, bodyClass, htmlClass]);

  if (html === null) return null;
  return (
    <>
      <HtmlFragment
        html={html}
        onMounted={(container) => {
          void runPageScripts(scriptsRef.current);
          const nodes = Array.from(
            container.querySelectorAll<HTMLElement>("[data-native]")
          );
          setSlots(
            nodes.map((node) => ({
              type: node.dataset.native ?? "",
              key: node.dataset.nativeKey ?? node.dataset.native ?? "",
              node,
            }))
          );
        }}
      />
      {slots.map((s) => {
        const el =
          s.type === "gallery" ? (
            <Gallery images={galleries[s.key] ?? []} />
          ) : s.type === "membership" ? (
            <MembershipForm />
          ) : null;
        return el ? createPortal(el, s.node, `${s.type}-${s.key}`) : null;
      })}
    </>
  );
}
