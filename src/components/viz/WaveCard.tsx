import { useEffect, useRef, type ReactNode } from 'react';
import type { IconSvgElement } from '@hugeicons/react';
import { Icon } from '@/components/ui/icon';
import { BigNumber } from './BigNumber';
import { HelpTip } from './HelpTip';
import { pctLabel } from './format';
import { reducedMotion, useTween } from './useTween';

/**
 * Une couche de vague : sinusoïde régulière A(t) · sin(2πx / len + phase + φ(t)).
 * Les crêtes oscillent sur place, φ(t) = sway · sin(w · t + phase), sans jamais défiler,
 * et la hauteur respire, A(t) = amp · (0,8 + 0,2 · sin(breathe · t + phase)). Longueurs en px, pulsations en rad/s.
 */
type Layer = { len: number; amp: number; sway: number; w: number; breathe: number; phase: number };

/**
 * Profils par carte : la couche arrière, plus pâle, a la même longueur d'onde, décalée d'une
 * demi-période (phase + π) et oscillant à contretemps.
 */
const WAVES: readonly { front: Layer; back: Layer }[] = [
  { front: { len: 130, amp: 7, sway: 0.9, w: 1.1, breathe: 0.7, phase: 0 }, back: { len: 130, amp: 6, sway: -0.9, w: 0.8, breathe: 0.5, phase: Math.PI } },
  { front: { len: 140, amp: 6.5, sway: 0.8, w: 0.95, breathe: 0.6, phase: 1.3 }, back: { len: 140, amp: 5.5, sway: -0.8, w: 0.75, breathe: 0.55, phase: 1.3 + Math.PI } },
  { front: { len: 120, amp: 7.5, sway: 1, w: 1.2, breathe: 0.8, phase: 2.6 }, back: { len: 120, amp: 6.5, sway: -1, w: 0.85, breathe: 0.45, phase: 2.6 + Math.PI } },
  { front: { len: 135, amp: 7, sway: 0.85, w: 1.05, breathe: 0.65, phase: 4 }, back: { len: 135, amp: 6, sway: -0.85, w: 0.7, breathe: 0.5, phase: 4 + Math.PI } },
];

const STEP = 8; // px entre deux échantillons de la crête
const r = (n: number) => +n.toFixed(2);

/** Hauteur de la surface en x à l'instant t (s), centrée sur `mid`. */
function surface(l: Layer, mid: number, x: number, t: number) {
  const amp = l.amp * (0.8 + 0.2 * Math.sin(l.breathe * t + l.phase));
  const phi = l.sway * Math.sin(l.w * t + l.phase);
  return mid + amp * Math.sin((2 * Math.PI * x) / l.len + l.phase + phi);
}

/** Crête échantillonnée puis lissée (Catmull-Rom vers Bézier cubiques), et forme fermée vers le bas. */
function wavePaths(layer: Layer, mid: number, width: number, t: number) {
  const n = Math.max(2, Math.ceil(width / STEP));
  const pts = Array.from({ length: n + 1 }, (_, i) => {
    const x = (i / n) * width;
    return [x, surface(layer, mid, x, t)] as const;
  });
  let crest = `M 0 ${r(pts[0]![1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[Math.max(0, i - 1)]!;
    const p1 = pts[i]!;
    const p2 = pts[i + 1]!;
    const p3 = pts[Math.min(n, i + 2)]!;
    crest += ` C ${r(p1[0] + (p2[0] - p0[0]) / 6)} ${r(p1[1] + (p2[1] - p0[1]) / 6)}`
      + ` ${r(p2[0] - (p3[0] - p1[0]) / 6)} ${r(p2[1] - (p3[1] - p1[1]) / 6)} ${r(p2[0])} ${r(p2[1])}`;
  }
  return { crest, fill: `${crest} V 4000 H 0 Z` };
}

/**
 * Surface d'eau en deux couches, redessinée à chaque image (requestAnimationFrame, sans re-rendu React).
 * L'animation s'arrête hors écran et reste figée si l'utilisateur demande moins d'animations.
 */
function WaterSurface({ variant }: { variant: number }) {
  const { front, back } = WAVES[variant % WAVES.length]!;
  const pad = Math.ceil(Math.max(front.amp, back.amp)) + 4;
  const svgRef = useRef<SVGSVGElement>(null);
  const backRef = useRef<SVGPathElement>(null);
  const frontRef = useRef<SVGPathElement>(null);
  const crestRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    const svg = svgRef.current!;
    let width = svg.clientWidth;
    let raf = 0;
    let visible = true;
    const draw = (t: number) => {
      const b = wavePaths(back, pad - 4, width, t);
      const f = wavePaths(front, pad, width, t);
      backRef.current!.setAttribute('d', b.fill);
      frontRef.current!.setAttribute('d', f.fill);
      crestRef.current!.setAttribute('d', f.crest);
    };
    const still = reducedMotion();
    const loop = (now: number) => {
      draw(now / 1000);
      if (visible) raf = requestAnimationFrame(loop);
    };
    const start = () => {
      cancelAnimationFrame(raf);
      if (still) draw(0);
      else raf = requestAnimationFrame(loop);
    };
    const resize = new ResizeObserver(() => {
      width = svg.clientWidth;
      if (still || !visible) draw(performance.now() / 1000);
    });
    const io = new IntersectionObserver(([entry]) => {
      visible = entry!.isIntersecting;
      if (visible) start();
    });
    resize.observe(svg);
    io.observe(svg);
    start();
    return () => {
      cancelAnimationFrame(raf);
      resize.disconnect();
      io.disconnect();
    };
  }, [front, back, pad]);

  return (
    <svg ref={svgRef} className="absolute inset-x-0 w-full overflow-hidden" style={{ top: -pad, height: `calc(100% + ${pad}px)` }}>
      <path ref={backRef} fill="var(--surface)" opacity={0.5} />
      <path ref={frontRef} fill="var(--surface)" />
      <path ref={crestRef} fill="none" stroke="var(--track)" strokeWidth={1.6} />
    </svg>
  );
}

/**
 * Carte remplie en vague : la hauteur du remplissage vaut 14 % + valeur × 0,9 de la carte.
 * La surface ondule sur place en continu (figée si l'utilisateur demande moins d'animations).
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
  const height = 14 + useTween(value ?? 0) * 100 * 0.9;

  return (
    <div className="relative flex min-h-0 flex-col overflow-hidden rounded-wave border-2 border-card-border bg-background">
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0"
        style={{ height: `${height}%` }}
      >
        <WaterSurface variant={variant} />
      </div>
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
