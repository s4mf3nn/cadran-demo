import { useCallback, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent, type RefObject } from 'react';
import { Add01Icon, CenterFocusIcon, MapsIcon, MinusSignIcon } from '@hugeicons/core-free-icons';
import { COUNTRY_COORDS, type Aggregates, type Country } from '../../data/types';
import { clusterPoints, LAND_PATH, MAP_H, MAP_TOP, MAP_W, projection, zoomToSplit, type MapCluster, type MapPoint } from '../../lib/geo';
import { useFilters } from '../../store/filters';
import { HelpTip } from './HelpTip';
import { nf } from './format';
import { easeOutCubic, reducedMotion } from './useTween';
import { Icon } from '@/components/ui/icon';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

/** Distance de regroupement, en pixels d'écran. */
const CLUSTER_RADIUS = 32;
const MAX_ZOOM = 8;
const SEG_FILL = ['fill-seg-1', 'fill-seg-2', 'fill-seg-3', 'fill-seg-4', 'fill-seg-5'] as const;
const SEG_STROKE = ['stroke-seg-1', 'stroke-seg-2', 'stroke-seg-3', 'stroke-seg-4', 'stroke-seg-5'] as const;

/** Pas de la trame de points des continents, en pixels d'écran (constant quel que soit le zoom). */
const DOT_PITCH = 6.5;

const POSITIONS = Object.fromEntries(
  Object.entries(COUNTRY_COORDS).map(([c, lonLat]) => [c, projection([lonLat[0], lonLat[1]])!]),
) as Record<Country, [number, number]>;

interface View { k: number; cx: number; cy: number }
const HOME: View = { k: 1, cx: MAP_W / 2, cy: MAP_TOP + MAP_H / 2 };

/** Garde la fenêtre dans la carte. */
function clamp(v: View): View {
  const k = Math.min(MAX_ZOOM, Math.max(1, v.k));
  const hw = MAP_W / 2 / k;
  const hh = MAP_H / 2 / k;
  return {
    k,
    cx: Math.min(MAP_W - hw, Math.max(hw, v.cx)),
    cy: Math.min(MAP_TOP + MAP_H - hh, Math.max(MAP_TOP + hh, v.cy)),
  };
}

/** Fenêtre affichée : `go` l'anime (zoom géométrique, même courbe que les jauges), `jump` la place aussitôt (glisser). */
function useView() {
  const [view, setView] = useState(HOME);
  const current = useRef(HOME);
  const raf = useRef(0);
  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const jump = useCallback((next: View) => {
    cancelAnimationFrame(raf.current);
    current.current = clamp(next);
    setView(current.current);
  }, []);

  const go = useCallback((next: View) => {
    const to = clamp(next);
    if (reducedMotion()) return jump(to);
    cancelAnimationFrame(raf.current);
    const from = current.current;
    const t0 = performance.now();
    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / 500);
      const e = easeOutCubic(p);
      current.current = { k: from.k * (to.k / from.k) ** e, cx: from.cx + (to.cx - from.cx) * e, cy: from.cy + (to.cy - from.cy) * e };
      setView(current.current);
      if (p < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
  }, [jump]);

  return { view, go, jump, current };
}

/** Largeur affichée d'un élément (1 px par unité tant qu'elle n'est pas mesurée). */
function useWidth(ref: RefObject<Element | null>, fallback: number) {
  const [width, setWidth] = useState(fallback);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(([entry]) => entry && setWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return width;
}

/** Couleur de l'échelle vert vers rose selon la part du pays le plus exposé (comme DotGauge). */
const segOf = (v: number) => Math.min(4, Math.floor(v * 5));

const activate = (fn: () => void) => (e: KeyboardEvent) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    fn();
  }
};

/**
 * Carte du monde en points : continents en grille de points, un point par pays dont la taille
 * et la couleur suivent le volume d'exigences en risque. Les pays proches à l'échelle courante
 * se regroupent ; cliquer un groupe zoome jusqu'à le séparer, cliquer un pays filtre dessus.
 */
export function WorldMap({ a, className }: { a: Aggregates; className?: string }) {
  const selected = useFilters((s) => s.filters.countries);
  const toggle = useFilters((s) => s.toggle);
  const { view, go, jump, current } = useView();
  const svgRef = useRef<SVGSVGElement>(null);
  const patternId = useId();
  // Pixels d'écran par unité de carte : repères, trame et regroupement gardent leur taille à l'écran.
  const px = useWidth(svgRef, MAP_W) / MAP_W;
  const drag = useRef<{ x: number; y: number; from: View; moved: boolean } | null>(null);

  const points = useMemo<MapPoint<Country>[]>(
    () => a.byCountry
      .filter((c) => c.count > 0 || selected.includes(c.country))
      .map((c) => ({ x: POSITIONS[c.country][0], y: POSITIONS[c.country][1], count: c.count, item: c.country })),
    [a.byCountry, selected],
  );
  const max = a.countryMax;
  // Groupes dessinés d'abord : les noms des pays passent au-dessus.
  const clusters = clusterPoints(points, CLUSTER_RADIUS / (view.k * px)).sort((a, b) => b.members.length - a.members.length);

  const { k, cx, cy } = view;
  const viewBox = `${cx - MAP_W / 2 / k} ${cy - MAP_H / 2 / k} ${MAP_W / k} ${MAP_H / k}`;

  const zoomInto = (c: MapCluster<Country>) =>
    go({ k: zoomToSplit(c.members, CLUSTER_RADIUS / px, current.current.k, MAX_ZOOM), cx: c.x, cy: c.y });

  // Glisser pour se déplacer une fois zoomé. La capture ne commence qu'au-delà de 3 px,
  // sinon le clic serait redirigé vers le <svg> et n'atteindrait plus le point.
  const onPointerDown = (e: PointerEvent<SVGSVGElement>) => {
    if (e.button !== 0) return;
    drag.current = { x: e.clientX, y: e.clientY, from: current.current, moved: false };
  };
  const onPointerMove = (e: PointerEvent<SVGSVGElement>) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (!d.moved && Math.hypot(dx, dy) < 3) return;
    if (!d.moved) {
      d.moved = true;
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    const scale = MAP_W / d.from.k / e.currentTarget.clientWidth;
    jump({ k: d.from.k, cx: d.from.cx - dx * scale, cy: d.from.cy - dy * scale });
  };
  const onPointerUp = () => {
    // Laisse passer le clic qui suit un simple appui ; l'annule après un glissé.
    const moved = drag.current?.moved;
    drag.current = null;
    if (moved) svgRef.current?.addEventListener('click', (ev) => ev.stopPropagation(), { capture: true, once: true });
  };

  const countries = clusters.reduce((n, c) => n + c.members.length, 0);

  return (
    <section aria-labelledby="world-map-title" className={cn('flex flex-col overflow-hidden rounded-card border-2 border-card-border bg-background', className)}>
      <div className="flex shrink-0 items-center gap-3 px-6 pt-4 pb-2">
        <Icon icon={MapsIcon} size={22} className="hidden shrink-0 text-muted sm:block" />
        <h2 id="world-map-title" className="text-title font-medium whitespace-nowrap">Carte des expositions</h2>
        <p className="hidden min-w-0 flex-1 truncate text-sm text-muted sm:block">
          {nf.format(a.atRisk)} exigences en risque · {countries} pays
        </p>
        <div className="ml-auto flex items-center gap-1">
          <MapButton label="Zoom avant" icon={Add01Icon} disabled={k >= MAX_ZOOM - 0.01} onClick={() => go({ ...current.current, k: current.current.k * 2 })} />
          <MapButton label="Zoom arrière" icon={MinusSignIcon} disabled={k <= 1.01} onClick={() => go({ ...current.current, k: current.current.k / 2 })} />
          {/* Mobile : masqué faute de place ; le zoom arrière jusqu'à 1 recentre de toute façon. */}
          <MapButton label="Recentrer la carte" icon={CenterFocusIcon} disabled={k <= 1.01} onClick={() => go(HOME)} className="hidden sm:grid" />
          <HelpTip
            label="Carte des expositions"
            text="Exigences en risque (non conformes ou de risque 4 ou 5) par pays : plus le point est grand et rose, plus le pays est exposé. Cliquez un groupe pour zoomer, un pays pour filtrer."
            className="-mr-1.5"
          />
        </div>
      </div>

      <div className="relative px-3 pb-3">
        <svg
          ref={svgRef}
          viewBox={viewBox}
          role="group"
          aria-label="Carte du monde des exigences en risque"
          className={cn('block h-auto w-full touch-none select-none', k > 1.01 && 'cursor-grab active:cursor-grabbing')}
          style={{ aspectRatio: `${MAP_W} / ${MAP_H}` }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {/* Continents : leur tracé rempli d'une trame de points. La trame est mise à l'échelle 1/k pour
              garder le même pas à l'écran, si bien qu'un zoom ajoute des points au lieu de les grossir. */}
          <defs>
            <pattern id={patternId} width={DOT_PITCH} height={DOT_PITCH} patternUnits="userSpaceOnUse" patternTransform={`scale(${1 / (k * px)})`}>
              <circle cx={DOT_PITCH / 2} cy={DOT_PITCH / 2} r={1.4} className="fill-track" />
            </pattern>
          </defs>
          <path d={LAND_PATH} fill={`url(#${patternId})`} aria-hidden="true" />
          {clusters.map((c) => c.members.length > 1
            ? <ClusterMark key={c.members.map((m) => m.item).join()} c={c} scale={k * px} total={a.atRisk} max={max} selected={selected} onActivate={() => zoomInto(c)} />
            : <CountryMark key={c.members[0]!.item} p={c.members[0]!} scale={k * px} labels={k >= 1.8} max={max} pressed={selected.includes(c.members[0]!.item)} onActivate={() => toggle('countries', c.members[0]!.item)} />)}
        </svg>
        {points.length === 0 && (
          <p className="absolute inset-0 grid place-items-center text-sm text-muted">Aucune exigence en risque.</p>
        )}
      </div>
    </section>
  );
}

function MapButton({ label, icon, disabled, onClick, className }: { label: string; icon: typeof Add01Icon; disabled: boolean; onClick: () => void; className?: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn('grid size-7 place-items-center rounded-full text-muted hover:bg-surface hover:text-foreground disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-muted', className)}
    >
      <Icon icon={icon} size={16} />
    </button>
  );
}

/** Repère dessiné en pixels d'écran : l'échelle inverse annule celle de la viewBox. */
const at = (x: number, y: number, scale: number) => `translate(${x} ${y}) scale(${1 / scale})`;
const MARK = 'group outline-none';
const FOCUS_RING = 'fill-none stroke-foreground opacity-0 group-focus-visible:opacity-100';

function CountryMark({ p, scale, labels, max, pressed, onActivate }: { p: MapPoint<Country>; scale: number; labels: boolean; max: number; pressed: boolean; onActivate: () => void }) {
  const v = max ? p.count / max : 0;
  const r = p.count > 0 ? 3.5 + 8.5 * Math.sqrt(v) : 3;
  const fill = p.count > 0 ? SEG_FILL[segOf(v)] : 'fill-track';
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <g
          role="button"
          tabIndex={0}
          aria-pressed={pressed}
          aria-label={`Filtrer sur ${p.item} : ${nf.format(p.count)} exigences en risque`}
          transform={at(p.x, p.y, scale)}
          className={cn(MARK, 'cursor-pointer')}
          onClick={onActivate}
          onKeyDown={activate(onActivate)}
        >
          <circle r={r * 1.9} className={cn(fill, 'opacity-20 transition-opacity group-hover:opacity-35')} />
          <circle r={r} className={fill} />
          {pressed && <circle r={r + 3} className="fill-none stroke-foreground" strokeWidth={2} />}
          <circle r={r * 1.9 + 3} className={FOCUS_RING} strokeWidth={2} />
          {labels && (
            <text x={r * 1.9 + 4} dy="0.35em" className="pointer-events-none fill-muted-soft text-caption">{p.item}</text>
          )}
        </g>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-caption">
        {p.item} · {nf.format(p.count)} en risque
      </TooltipContent>
    </Tooltip>
  );
}

function ClusterMark({ c, scale, total, max, selected, onActivate }: { c: MapCluster<Country>; scale: number; total: number; max: number; selected: Country[]; onActivate: () => void }) {
  const r = 12 + 10 * Math.sqrt(total ? c.count / total : 0);
  // Couleur du membre le plus exposé (les membres sont triés par volume décroissant).
  const seg = segOf(max ? c.members[0]!.count / max : 0);
  const names = c.members.map((m) => m.item);
  const hasSelected = names.some((n) => selected.includes(n));
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <g
          role="button"
          tabIndex={0}
          aria-label={`Zoomer sur ${names.length} pays (${names.join(', ')}) : ${nf.format(c.count)} exigences en risque`}
          transform={at(c.x, c.y, scale)}
          className={cn(MARK, 'cursor-zoom-in')}
          onClick={onActivate}
          onKeyDown={activate(onActivate)}
        >
          <circle r={r + 5} className={cn(SEG_FILL[seg], 'opacity-15 transition-opacity group-hover:opacity-30')} />
          <circle r={r} className={cn('fill-background', SEG_STROKE[seg])} strokeWidth={2} />
          {hasSelected && <circle r={r + 3} className="fill-none stroke-foreground" strokeWidth={2} />}
          <circle r={r + 8} className={FOCUS_RING} strokeWidth={2} />
          <text textAnchor="middle" dy="0.35em" className="pointer-events-none fill-foreground text-body font-semibold">{names.length}</text>
        </g>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-64 text-caption leading-snug">
        {names.join(', ')} · {nf.format(c.count)} en risque
      </TooltipContent>
    </Tooltip>
  );
}
