import type { ReactNode } from 'react';
import { Alert02Icon, Calendar03Icon, FireIcon, Globe02Icon, HourglassIcon } from '@hugeicons/core-free-icons';
import type { Aggregates } from '../data/types';
import { useFilters } from '../store/filters';
import { DotGauge } from './viz/DotGauge';
import { HelpTip } from './viz/HelpTip';
import { SegmentedGauge } from './viz/SegmentedGauge';
import { WaveCard } from './viz/WaveCard';
import { nf, ratio } from './viz/format';
import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/utils';

const CARD = 'rounded-card border-2 border-card-border bg-background';

/** Les cinq jauges, toutes calculées sur le périmètre filtré. */
export function GaugeRow({ a, className }: { a: Aggregates; className?: string }) {
  const gauges = [
    { title: 'Risque critique', value: ratio(a.byRisk[5], a.total), help: 'Part des exigences au niveau de risque 5 (Critique).' },
    { title: 'En risque', value: ratio(a.atRisk, a.total), help: 'Part des exigences non conformes ou de risque 4 (Élevé) ou 5 (Critique).' },
    { title: 'Non conformes', value: ratio(a.byStatus.non_conforme, a.total), help: 'Part des exigences au statut Non conforme.' },
    { title: 'Conformes', value: ratio(a.byStatus.conforme, a.total), help: 'Part des exigences au statut Conforme. Échelle inversée : une valeur haute est une bonne nouvelle.', reversed: true },
    { title: 'À évaluer', value: ratio(a.byStatus.a_evaluer, a.total), help: 'Part des exigences au statut À évaluer.' },
  ];
  return (
    <ul aria-label="Jauges" className={cn('grid gap-3', className)}>
      {gauges.map((g) => (
        <li key={g.title} className={cn(CARD, 'relative flex flex-col items-center justify-center gap-2.5 px-2 pt-2')}>
          <HelpTip label={g.title} text={g.help} className="absolute top-2.5 right-2.5" />
          <SegmentedGauge value={g.value} label={g.title} reversed={g.reversed} />
          <h3 className="text-center text-body leading-5 font-semibold">{g.title}</h3>
        </li>
      ))}
    </ul>
  );
}

/**
 * Section « Indicateurs clés » (jauges, vagues, pays exposés) : son h2 masqué coiffe toutes les cartes en h3,
 * qui ne sautent ainsi pas de niveau après le h1 et ne se retrouvent pas sous un autre titre.
 */
export function KeyIndicators({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <section aria-labelledby="key-indicators-title" className={className}>
      <h2 id="key-indicators-title" className="sr-only">Indicateurs clés</h2>
      {children}
    </section>
  );
}

/** Les quatre cartes en vague (grille 2×2). */
export function WaveGrid({ a, className }: { a: Aggregates; className?: string }) {
  const risk45 = a.byRisk[4] + a.byRisk[5];
  return (
    <div className={cn('grid grid-cols-2 grid-rows-2 gap-3', className)}>
      <WaveCard
        variant={0} icon={Alert02Icon} title="En retard"
        detail={`${nf.format(a.overdueNonConforme)} non conformes`}
        value={ratio(a.overdueNonConforme, a.byStatus.non_conforme)}
        help="Part des exigences non conformes dont l'échéance est passée."
      />
      <WaveCard
        variant={1} icon={Calendar03Icon} title="Échéance < 90 j"
        detail={`${nf.format(a.dueWithin90)} exigences`}
        value={ratio(a.dueWithin90, a.total)}
        help="Part des exigences dont l'échéance tombe dans les 90 prochains jours."
      />
      <WaveCard
        variant={2} icon={FireIcon} title="Risque 4 ou 5"
        detail={`${nf.format(risk45)} exigences`}
        value={ratio(risk45, a.total)}
        help="Part des exigences de risque 4 (Élevé) ou 5 (Critique)."
      />
      <WaveCard
        variant={3} icon={HourglassIcon} title="En cours"
        detail={`${nf.format(a.byStatus.en_cours)} exigences`}
        value={ratio(a.byStatus.en_cours, a.total)}
        help="Part des exigences au statut En cours."
      />
    </div>
  );
}

/** Les 6 pays qui concentrent le plus d'exigences en risque ; chaque ligne filtre sur son pays. */
export function TopCountries({ a, className }: { a: Aggregates; className?: string }) {
  const selected = useFilters((s) => s.filters.countries);
  const toggle = useFilters((s) => s.toggle);
  const top = a.byCountry.filter((c) => c.count > 0 || selected.includes(c.country)).slice(0, 6);
  const max = a.countryMax;

  return (
    <section aria-labelledby="top-countries-title" className={cn(CARD, 'flex min-h-0 flex-col px-5 pt-3.5 pb-2', className)}>
      <div className="flex items-center gap-2.5 pb-1.5">
        <Icon icon={Globe02Icon} size={22} className="text-muted" />
        <h3 id="top-countries-title" className="flex-1 text-title text-foreground-soft">Pays les plus exposés</h3>
        <HelpTip label="Pays les plus exposés" text="Nombre d'exigences en risque (non conformes ou de risque 4 ou 5) par pays. Cliquez sur un pays pour filtrer." className="-mr-1.5" />
      </div>
      {top.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted">Aucune exigence en risque.</p>
      ) : (
        <ul className="flex flex-col">
          {top.map(({ country, count }) => {
            const pressed = selected.includes(country);
            return (
              <li key={country} className="border-b border-line last:border-b-0">
                <button
                  type="button"
                  aria-pressed={pressed}
                  onClick={() => toggle('countries', country)}
                  className={cn('-mx-2 flex h-10 w-[calc(100%+1rem)] items-center gap-3 rounded-xl px-2 text-left hover:bg-surface', pressed && 'bg-surface')}
                >
                  {/* Nom accessible construit autour du texte visible (WCAG 2.5.3) : « Filtrer sur France 1 234 exigences en risque ». */}
                  <span className="min-w-0 flex-1 truncate text-body"><span className="sr-only">Filtrer sur </span>{country}</span>
                  <DotGauge value={max ? count / max : 0} />
                  <span className="w-14 text-right text-body tabular-nums">{nf.format(count)}<span className="sr-only"> exigences en risque</span></span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/** Centre du tableau de bord : rangée de jauges, puis vagues (colonnes 1 à 3) et pays (colonnes 4 et 5). */
export function Dashboard({ a, isRefreshing }: { a: Aggregates; isRefreshing: boolean }) {
  return (
    <KeyIndicators className={cn('flex flex-col gap-3.5 transition-opacity', isRefreshing && 'opacity-60')}>
      <GaugeRow a={a} className="h-[168px] grid-cols-5" />
      <div className="grid h-[300px] grid-cols-5 gap-3">
        <WaveGrid a={a} className="col-span-3" />
        <TopCountries a={a} className="col-span-2" />
      </div>
    </KeyIndicators>
  );
}
