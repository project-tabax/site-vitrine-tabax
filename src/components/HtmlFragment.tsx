import { useEffect, useRef } from "react";

interface Props {
  html: string;
  className?: string;
  /** Appelé après l'injection du HTML, avec le conteneur DOM (réinit, slots natifs). */
  onMounted?: (container: HTMLElement) => void;
}

/**
 * Rend un fragment HTML d'origine (issu du miroir) tout en conservant ses
 * classes et sa structure — indispensable pour réutiliser le CSS d'origine.
 * Les liens internes sont interceptés par le layout (navigation client).
 */
export function HtmlFragment({ html, className, onMounted }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) onMounted?.(ref.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [html]);

  return (
    <div
      ref={ref}
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
