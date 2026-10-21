import { memo, useMemo } from 'react';
import { EChart } from './EChart';
import { CATEGORIES, STATUS_LABEL, STATUSES, type Aggregates, type Country } from '../data/types';
import { useFilters } from '../store/filters';

const nf = new Intl.NumberFormat('fr-FR', { notation: 'compact' });
const axisFr = { axisLabel: { formatter: (v: number) => nf.format(v) } };

const STATUS_COLORS = ['#16a34a', '#2563eb', '#a3a3a3', '#dc2626'];

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm" aria-label={title}>
      <h2 className="mb-2 text-sm font-semibold text-slate-700">{title}</h2>
      {children}
    </section>
  );
}

/** memo : les graphiques ne se recalculent que si les agrégats changent réellement. */
export const Charts = memo(function Charts({ aggregates }: { aggregates: Aggregates }) {
  const toggle = useFilters((s) => s.toggle);

  const statusOption = useMemo(
    () => ({
      tooltip: { trigger: 'item', valueFormatter: (v: number) => v.toLocaleString('fr-FR') },
      legend: { bottom: 0, itemWidth: 10, itemHeight: 10, textStyle: { fontSize: 11 } },
      color: STATUS_COLORS,
      series: [{
        type: 'pie',
        radius: ['40%', '68%'],
        center: ['50%', '42%'],
        label: { show: false },
        data: STATUSES.map((s) => ({ name: STATUS_LABEL[s], value: aggregates.byStatus[s] })),
      }],
    }),
    [aggregates.byStatus],
  );

  const countryOption = useMemo(() => {
    const top = aggregates.byCountry.slice(0, 10).reverse();
    return {
      tooltip: { trigger: 'axis' },
      grid: { left: 110, right: 16, top: 8, bottom: 24 },
      xAxis: { type: 'value', splitNumber: 3, ...axisFr },
      yAxis: { type: 'category', data: top.map((c) => c.country) },
      series: [{ type: 'bar', data: top.map((c) => c.count), itemStyle: { color: '#dc2626', borderRadius: [0, 4, 4, 0] } }],
    };
  }, [aggregates.byCountry]);

  const heatOption = useMemo(() => {
    const heatCountries = aggregates.byCountry.slice(0, 12).map((c) => c.country);
    const values = aggregates.heatmap.filter((h) => heatCountries.includes(h.country)).map((h) => h.count);
    // Échelle bornée sur les valeurs réelles : sinon tout paraît uniforme quand les écarts sont faibles.
    const min = Math.min(...values);
    const max = Math.max(min + 1, ...values);
    return {
      tooltip: { position: 'top' },
      grid: { left: 110, right: 16, top: 8, bottom: 70 },
      xAxis: { type: 'category', data: [...CATEGORIES], axisLabel: { rotate: 35 } },
      yAxis: { type: 'category', data: heatCountries },
      visualMap: { min, max, show: false, inRange: { color: ['#fff7ed', '#fb923c', '#b91c1c'] } },
      series: [{
        type: 'heatmap',
        data: aggregates.heatmap
          .filter((h) => heatCountries.includes(h.country))
          .map((h) => [CATEGORIES.indexOf(h.category), heatCountries.indexOf(h.country), h.count]),
      }],
    };
  }, [aggregates.heatmap, aggregates.byCountry]);

  const deadlineOption = useMemo(
    () => ({
      tooltip: { trigger: 'axis' },
      grid: { left: 48, right: 16, top: 8, bottom: 24 },
      xAxis: { type: 'category', data: aggregates.deadlines.map((d) => d.month) },
      yAxis: { type: 'value', ...axisFr },
      series: [{ type: 'line', smooth: true, areaStyle: { opacity: 0.15 }, data: aggregates.deadlines.map((d) => d.count) }],
    }),
    [aggregates.deadlines],
  );

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <Card title="Répartition par statut">
        <EChart className="h-56" option={statusOption} label="Répartition des exigences par statut de conformité" />
      </Card>
      <Card title="Pays les plus exposés (cliquer pour filtrer)">
        <EChart
          className="h-56"
          option={countryOption}
          label="Top 10 des pays par nombre d'exigences en risque"
          onItemClick={({ name }) => toggle('countries', name as Country)}
        />
      </Card>
      <Card title="Carte de chaleur pays × catégorie">
        <EChart className="h-56" option={heatOption} label="Exigences en risque par pays et catégorie de produit" />
      </Card>
      <Card title="Échéances sur 12 mois">
        <EChart className="h-56" option={deadlineOption} label="Nombre d'échéances réglementaires par mois" />
      </Card>
    </div>
  );
});
