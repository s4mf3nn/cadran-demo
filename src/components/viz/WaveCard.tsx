import type { ReactNode } from 'react';
import type { IconSvgElement } from '@hugeicons/react';
import { Icon } from '@/components/ui/icon';
import { BigNumber } from './BigNumber';
import { HelpTip } from './HelpTip';
import { pctLabel } from './format';

/** Profils d'ondulation : chaque carte a sa propre vague (amplitude, fréquence, phase). */
const WAVES = [
  { amp: 2.6, freq: 0.9, phase: 0.6 },
  { amp: 2.2, freq: 1.25, phase: 2.1 },
  { amp: 3, freq: 0.75, phase: 3.6 },
  { amp: 2.4, freq: 1.1, phase: 5 },
] as const;

/**
 * Crête ondulée dans un repère 100 × 100 : somme de deux sinus échantillonnée puis lissée
 * (Catmull-Rom vers Bézier cubiques). Renvoie la crête seule et la forme fermée vers le bas.
 */
function wavePaths(top: number, variant: number) {
  const { amp, freq, phase } = WAVES[variant % WAVES.length]!;
  const pts = Array.from({ length: 13 }, (_, i) => {
    const x = (i / 12) * 100;
    const t = (x / 100) * Math.PI * 2 * freq + phase;
    return [x, top + amp * Math.sin(t) + amp * 0.35 * Math.sin(2.3 * t + 1)] as const;
  });
  let crest = `M ${pts[0]![0]} ${pts[0]![1].toFixed(2)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)]!;
    const p1 = pts[i]!;
    const p2 = pts[i + 1]!;
    const p3 = pts[Math.min(pts.length - 1, i + 2)]!;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    crest += ` C ${c1[0]!.toFixed(2)} ${c1[1]!.toFixed(2)} ${c2[0]!.toFixed(2)} ${c2[1]!.toFixed(2)} ${p2[0]} ${p2[1].toFixed(2)}`;
  }
  return { crest, fill: `${crest} L 100 100 L 0 100 Z` };
}

/**
 * Carte remplie en vague : la hauteur du remplissage vaut 14 % + valeur × 0,9 de la carte.
 * SVG statique en preserveAspectRatio="none", crête en non-scaling-stroke (trait constant de 1,6 px).
 */
export function WaveCard({ icon, title, detail, help, value, variant = 0 }: {
  icon: IconSvgElement;
  title: string;
  /** Ce sur quoi porte le pourcentage, ex. « 1 750 non conformes ». */
  detail: ReactNode;
  help: string;
  value: number | null;
  variant?: number;
}) {
  const height = 14 + (value ?? 0) * 100 * 0.9;
  const { crest, fill } = wavePaths(100 - height, variant);

  return (
    <div className="relative flex min-h-0 flex-col overflow-hidden rounded-wave border-2 border-card-border bg-background">
      <svg aria-hidden="true" className="absolute inset-0 size-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path d={fill} fill="var(--surface)" />
        <path d={crest} fill="none" stroke="var(--track)" strokeWidth={1.6} vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="relative flex items-start gap-2.5 px-5 pt-[18px]">
        <Icon icon={icon} size={20} className="mt-px shrink-0 text-muted" />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <h3 className="line-clamp-2 text-body leading-5 font-normal text-foreground-soft">{title}</h3>
          <p className="line-clamp-2 text-caption leading-4 text-muted">{detail}</p>
        </div>
        <HelpTip label={title} text={help} className="-mt-0.5 -mr-1.5" />
      </div>
      <p className="relative mt-auto px-5 pb-3" aria-label={pctLabel(title, value)} role="img">
        <BigNumber value={value} size={50} percentSize={22} />
      </p>
    </div>
  );
}
