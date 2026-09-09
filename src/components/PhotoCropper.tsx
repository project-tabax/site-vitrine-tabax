import { useCallback, useEffect, useRef, useState } from "react";
import "./PhotoCropper.css";

interface Props {
  /** Renvoie l'image cadrée (JPEG dataURL) ou null si aucune. */
  onChange: (dataUrl: string | null) => void;
}

// Cadre photo d'identité (portrait 3:4).
const W = 240;
const H = 320;
const DPR = 2;

/**
 * Module d'importation et de cadrage de la photo d'identité :
 * import fichier, zoom (curseur), déplacement (glisser), prévisualisation
 * dynamique dans le cadre, puis export de l'image cadrée.
 */
export function PhotoCropper({ onChange }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  const baseScale = img ? Math.max(W / img.width, H / img.height) : 1;

  const clampOffset = useCallback(
    (o: { x: number; y: number }, s: number) => {
      if (!img) return { x: 0, y: 0 };
      const dw = img.width * s;
      const dh = img.height * s;
      const mx = Math.max(0, (dw - W) / 2);
      const my = Math.max(0, (dh - H) / 2);
      return {
        x: Math.min(mx, Math.max(-mx, o.x)),
        y: Math.min(my, Math.max(-my, o.y)),
      };
    },
    [img]
  );

  // (re)dessine + exporte à chaque changement
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = W * DPR;
    canvas.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.clearRect(0, 0, W, H);
    if (!img) {
      onChange(null);
      return;
    }
    const s = baseScale * scale;
    const dw = img.width * s;
    const dh = img.height * s;
    const x = (W - dw) / 2 + offset.x;
    const y = (H - dh) / 2 + offset.y;
    ctx.drawImage(img, x, y, dw, dh);
    onChange(canvas.toDataURL("image/jpeg", 0.9));
  }, [img, scale, offset, baseScale, onChange]);

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      setScale(1);
      setOffset({ x: 0, y: 0 });
      setImg(image);
      URL.revokeObjectURL(url);
    };
    image.src = url;
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (!img) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current || !img) return;
    const nx = drag.current.ox + (e.clientX - drag.current.x);
    const ny = drag.current.oy + (e.clientY - drag.current.y);
    setOffset(clampOffset({ x: nx, y: ny }, baseScale * scale));
  };
  const onPointerUp = () => {
    drag.current = null;
  };
  const onScale = (e: React.ChangeEvent<HTMLInputElement>) => {
    const s = parseFloat(e.target.value);
    setScale(s);
    setOffset((o) => clampOffset(o, baseScale * s));
  };

  return (
    <div className="tx-cropper">
      <div
        className="tx-cropper__frame"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{ cursor: img ? "grab" : "default" }}
      >
        <canvas ref={canvasRef} style={{ width: W, height: H }} />
        {!img && (
          <span className="tx-cropper__placeholder">Aperçu de la photo</span>
        )}
      </div>

      <div className="tx-cropper__controls">
        <label className="tx-cropper__file">
          {img ? "Changer la photo" : "Importer une photo"}
          <input type="file" accept="image/*" onChange={onFile} hidden />
        </label>
        {img && (
          <label className="tx-cropper__zoom">
            Zoom
            <input type="range" min={1} max={3} step={0.01} value={scale} onChange={onScale} />
          </label>
        )}
        <p className="tx-cropper__hint">
          {img ? "Glissez pour recadrer, ajustez le zoom." : "Format portrait (photo d'identité)."}
        </p>
      </div>
    </div>
  );
}
