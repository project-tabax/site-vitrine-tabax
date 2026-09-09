import { useCallback, useEffect, useState } from "react";
import type { GalleryImage } from "@/generated/natives";
import "./Gallery.css";

interface Props {
  images: GalleryImage[];
}

/**
 * Galerie native : grille responsive + lightbox (précédent/suivant, Échap).
 * Remplace le bloc galerie WordPress dont la mise en page dépendait du JS.
 */
export function Gallery({ images }: Props) {
  const [open, setOpen] = useState<number | null>(null);

  const close = useCallback(() => setOpen(null), []);
  const go = useCallback(
    (d: number) =>
      setOpen((i) => (i === null ? i : (i + d + images.length) % images.length)),
    [images.length]
  );

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close, go]);

  return (
    <div className="tx-gallery">
      <div className="tx-gallery__grid">
        {images.map((img, i) => (
          <button
            key={img.src + i}
            type="button"
            className="tx-gallery__item"
            onClick={() => setOpen(i)}
            aria-label={`Agrandir l'image ${i + 1}`}
          >
            <img src={img.src} alt={img.alt} loading="lazy" />
          </button>
        ))}
      </div>

      {open !== null && (
        <div className="tx-lightbox" role="dialog" aria-modal="true" onClick={close}>
          <button className="tx-lightbox__close" aria-label="Fermer" onClick={close}>
            ×
          </button>
          <button
            className="tx-lightbox__nav tx-lightbox__prev"
            aria-label="Précédent"
            onClick={(e) => {
              e.stopPropagation();
              go(-1);
            }}
          >
            ‹
          </button>
          <img
            className="tx-lightbox__img"
            src={images[open].src}
            alt={images[open].alt}
            onClick={(e) => e.stopPropagation()}
          />
          <button
            className="tx-lightbox__nav tx-lightbox__next"
            aria-label="Suivant"
            onClick={(e) => {
              e.stopPropagation();
              go(1);
            }}
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}
