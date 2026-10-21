import { STATUS_LABEL, STATUSES, type Aggregates } from '../data/types';
import { STATUS_DOT, StatusTag } from './StatusTag';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const nf = new Intl.NumberFormat('fr-FR');
const pf = new Intl.NumberFormat('fr-FR', { style: 'percent', maximumFractionDigits: 1 });

/** Répartition par statut : barre empilée à 100 % puis légende (libellé, volume, pourcentage). */
export function StatusBar({ aggregates }: { aggregates: Aggregates }) {
  const total = aggregates.total;
  const summary = STATUSES.map((s) => `${STATUS_LABEL[s]} ${total ? pf.format(aggregates.byStatus[s] / total) : '0 %'}`).join(', ');

  return (
    <Card size="sm" role="region" aria-label="Répartition par statut">
      <CardHeader>
        <CardTitle role="heading" aria-level={2}>Répartition par statut</CardTitle>
      </CardHeader>
      <CardContent className="gap-3">
        <div role="img" aria-label={`Répartition par statut : ${summary}`} className="flex h-3 gap-0.5 overflow-hidden rounded-full bg-accent">
          {STATUSES.map((s) => {
            const n = aggregates.byStatus[s];
            return n > 0 ? <span key={s} className={STATUS_DOT[s]} style={{ width: `${(n / total) * 100}%` }} /> : null;
          })}
        </div>
        <ul className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          {STATUSES.map((s) => (
            <li key={s} className="flex flex-col gap-1.5 rounded-lg border p-2.5">
              <StatusTag status={s} className="w-fit rounded-full" />
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-lg leading-none font-semibold tabular-nums">{nf.format(aggregates.byStatus[s])}</span>
                <span className="text-muted-foreground text-sm tabular-nums">{total ? pf.format(aggregates.byStatus[s] / total) : '0 %'}</span>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
