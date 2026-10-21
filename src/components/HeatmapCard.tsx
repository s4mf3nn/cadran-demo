import { useMemo } from 'react';
import { EChart } from './EChart';
import { useChartTheme } from './useChartTheme';
import { CATEGORIES, type Aggregates, type Category } from '../data/types';
import { useFilters } from '../store/filters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const nf = new Intl.NumberFormat('fr-FR');
const CELL = 22; // 20 px de cellule + 2 px d'écart
const SIZE = CELL * 10;

/** En-têtes de colonnes abrégés (le nom complet est porté par `title`). */
const ABBR: Record<Category, string> = {
  Textile: 'Tex', Chaussures: 'Cha', Vélo: 'Vél', 'Vélo électrique': 'VAE', Escalade: 'Esc',
  Nautique: 'Nau', Camping: 'Cam', Fitness: 'Fit', Électronique: 'Élé', Nutrition: 'Nut',
};

/** Top 10 pays × 10 catégories en cellules carrées sans texte, avec une barre de total cliquable par pays. */
export function HeatmapCard({ aggregates }: { aggregates: Aggregates }) {
  const t = useChartTheme();
  const selected = useFilters((s) => s.filters.countries);
  const toggle = useFilters((s) => s.toggle);

  const top = useMemo(() => aggregates.byCountry.slice(0, 10), [aggregates.byCountry]);
  const cells = useMemo(() => {
    const byKey = new Map(aggregates.heatmap.map((h) => [`${h.country}|${h.category}`, h.count]));
    return top.flatMap((c, row) => CATEGORIES.map((cat, col) => ({ row, col, country: c.country, category: cat, count: byKey.get(`${c.country}|${cat}`) ?? 0 })));
  }, [aggregates.heatmap, top]);

  const min = Math.min(...cells.map((c) => c.count));
  const max = Math.max(min + 1, ...cells.map((c) => c.count));
  const maxTotal = Math.max(1, ...top.map((c) => c.count));

  const option = useMemo(() => ({
    tooltip: {
      position: 'top',
      backgroundColor: t.popover,
      borderColor: t.border,
      textStyle: { color: t.popoverForeground, fontSize: 12 },
      formatter: (p: { dataIndex: number }) => {
        const c = cells[p.dataIndex]!;
        return `${c.country}, ${c.category} : ${nf.format(c.count)} exigences en risque`;
      },
    },
    grid: { left: 0, top: 0, width: SIZE, height: SIZE },
    xAxis: { type: 'category', show: false, data: [...CATEGORIES] },
    yAxis: { type: 'category', show: false, inverse: true, data: top.map((c) => c.country) },
    visualMap: { min, max, show: false, dimension: 2, inRange: { color: t.heat } },
    series: [{
      type: 'heatmap',
      data: cells.map((c) => [c.col, c.row, c.count]),
      itemStyle: { borderColor: t.background, borderWidth: 1, borderRadius: 4 },
      emphasis: { itemStyle: { borderColor: t.foreground, borderWidth: 1 } },
      animation: false,
    }],
  }), [cells, top, min, max, t]);

  // Résumé textuel : la grille est un canvas sans texte, on décrit donc les cellules les plus exposées.
  const label = useMemo(() => {
    const best = [...cells].sort((a, b) => b.count - a.count).slice(0, 5)
      .map((c) => `${c.country}, ${c.category} : ${nf.format(c.count)}`).join(' ; ');
    return `Exigences en risque par pays et catégorie, top 10 pays. Cellules les plus exposées : ${best}.`;
  }, [cells]);

  return (
    <Card size="sm" role="region" aria-label="Exposition pays par catégorie" className="w-full shrink-0 lg:w-[486px]">
      <CardHeader className="grid-cols-[1fr_auto]">
        <CardTitle role="heading" aria-level={2}>Exposition pays × catégorie</CardTitle>
        <span className="text-xs text-muted-foreground">top 10 · risque ≥ 3</span>
      </CardHeader>
      <CardContent className="gap-2">
        <div className="flex gap-2.5">
          <ul className="flex w-[84px] shrink-0 flex-col pt-[18px]" aria-hidden="true">
            {top.map((c) => <li key={c.country} className="flex items-center justify-end whitespace-nowrap text-[12.5px]" style={{ height: CELL }}>{c.country}</li>)}
          </ul>
          <div className="shrink-0">
            <div className="grid h-[18px]" style={{ gridTemplateColumns: `repeat(10, ${CELL}px)` }}>
              {CATEGORIES.map((c) => (
                <abbr key={c} title={c} className="text-center text-[10px] text-muted-foreground no-underline">{ABBR[c]}</abbr>
              ))}
            </div>
            <EChart option={option} label={label} className="shrink-0" style={{ width: SIZE, height: SIZE }} />
          </div>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="h-[18px] text-[10px] text-muted-foreground">Total</span>
            {top.map((c) => {
              const pressed = selected.includes(c.country);
              return (
                <button
                  key={c.country}
                  type="button"
                  aria-pressed={pressed}
                  aria-label={`Filtrer sur ${c.country}, ${nf.format(c.count)} exigences en risque`}
                  onClick={() => toggle('countries', c.country)}
                  style={{ height: CELL }}
                  className={cn('group grid grid-cols-[minmax(0,1fr)_40px] items-center gap-1.5 rounded-md px-1 text-left hover:bg-accent', pressed && 'bg-accent ring-1 ring-primary')}
                >
                  <span className="h-2 overflow-hidden rounded-full bg-accent group-hover:bg-border">
                    <span className="block h-full rounded-full bg-primary" style={{ width: `${(c.count / maxTotal) * 100}%` }} />
                  </span>
                  <span className="text-right text-[11px] tabular-nums">{nf.format(c.count)}</span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <span>{nf.format(min)}</span>
          <span aria-hidden="true" className="h-1.5 w-28 rounded-full" style={{ background: `linear-gradient(to right, ${t.heat[0]}, ${t.heat[1]})` }} />
          <span>{nf.format(max)}</span>
          <span className="ml-auto">Clic : filtrer le pays</span>
        </div>
      </CardContent>
    </Card>
  );
}
