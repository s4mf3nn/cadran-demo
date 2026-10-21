import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const nf = new Intl.NumberFormat('fr-FR');
const pf = new Intl.NumberFormat('fr-FR', { style: 'percent', maximumFractionDigits: 1 });

export function Kpi({ label, value, total, tone }: { label: string; value: number; total: number; tone?: string }) {
  return (
    <Card size="sm">
      <CardContent>
        <dl className="flex flex-col gap-1">
          <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
          <dd className="flex items-baseline gap-2">
            <span className={cn('text-2xl font-semibold tabular-nums', tone)}>{nf.format(value)}</span>
            <span className="text-xs text-muted-foreground tabular-nums">{total > 0 ? pf.format(value / total) : '—'}</span>
          </dd>
        </dl>
      </CardContent>
    </Card>
  );
}
