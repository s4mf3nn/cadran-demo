import { BigNumber } from './BigNumber';
import { pctLabel, SEG_VAR } from './format';
import { useTween } from './useTween';

const START = 150;
const SWEEP = 240;
const SEGMENTS = 5;
const rad = (deg: number) => (deg * Math.PI) / 180;

/**
 * Jauge de 240° (de 150° à 30°, ouverte en bas) découpée en 5 segments de même longueur.
 * Chaque segment réutilise le même arc avec un couple dasharray/dashoffset ; le segment n
 * s'allume à clamp(valeur × 5 − n, 0, 1), le dernier allumé pouvant l'être partiellement.
 * `reversed` inverse l'échelle (rose vers vert) quand une valeur haute est une bonne nouvelle.
 */
export function SegmentedGauge({ value, label, radius = 48, thickness = 10, valueSize = 25, reversed = false }: {
  /** Part entre 0 et 1, ou null si non calculable. */
  value: number | null;
  label: string;
  radius?: number;
  thickness?: number;
  valueSize?: number;
  reversed?: boolean;
}) {
  const pad = thickness / 2;
  const cx = radius + pad;
  const cy = radius + pad;
  const width = 2 * cx;
  // Point le plus bas de l'arc : à 30° sous l'horizontale, soit r / 2 sous le centre.
  const height = cy + radius * Math.sin(rad(30)) + pad;
  const at = (deg: number) => [cx + radius * Math.cos(rad(deg)), cy + radius * Math.sin(rad(deg))] as const;
  const [x0, y0] = at(START);
  const [x1, y1] = at(START + SWEEP);
  const d = `M ${x0} ${y0} A ${radius} ${radius} 0 1 1 ${x1} ${y1}`;

  const length = radius * rad(SWEEP);
  // Écart entre bouts de tracé : l'épaisseur (absorbée par les bouts arrondis) + 10 % du rayon d'espace visible.
  const gap = thickness + radius * 0.1;
  const seg = (length - (SEGMENTS - 1) * gap) / SEGMENTS;
  const dash = (len: number, i: number) => ({ strokeDasharray: `${len} ${length * 2}`, strokeDashoffset: -i * (seg + gap) });
  const v = useTween(value ?? 0);

  return (
    <div role="img" aria-label={pctLabel(label, value)} className="relative" style={{ width, height }}>
      <svg aria-hidden="true" width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none" strokeWidth={thickness} strokeLinecap="round">
        {Array.from({ length: SEGMENTS }, (_, i) => (
          <path key={`t${i}`} d={d} stroke="var(--track)" style={dash(seg, i)} />
        ))}
        {Array.from({ length: SEGMENTS }, (_, i) => {
          const fill = Math.min(1, Math.max(0, v * SEGMENTS - i));
          if (fill <= 0) return null;
          return <path key={`s${i}`} d={d} stroke={SEG_VAR[reversed ? SEGMENTS - 1 - i : i]} style={dash(seg * fill, i)} />;
        })}
      </svg>
      <span className="absolute inset-x-0 flex justify-center" style={{ top: cy, transform: 'translateY(-50%)' }}>
        <BigNumber value={value} size={valueSize} />
      </span>
    </div>
  );
}
