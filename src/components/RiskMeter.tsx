import type { Risk } from '../data/types';
import { cn } from '@/lib/utils';

/** Couleur des segments allumés : gris pour 1 et 2, jaune pour 3, rouge pour 4. */
const FILL: Record<Risk, string> = {
  1: 'bg-status-a-evaluer',
  2: 'bg-status-a-evaluer',
  3: 'bg-status-en-cours',
  4: 'bg-status-non-conforme',
};

/** 4 segments verticaux de 6×14 px suivis du chiffre. */
export function RiskMeter({ risk, className }: { risk: Risk; className?: string }) {
  return (
    <span role="img" aria-label={`Risque ${risk} sur 4`} className={cn('inline-flex items-center gap-2', className)}>
      <span aria-hidden="true" className="flex gap-0.5">
        {[1, 2, 3, 4].map((level) => (
          <span key={level} className={cn('h-[14px] w-[6px] rounded-[2px]', level <= risk ? FILL[risk] : 'bg-accent')} />
        ))}
      </span>
      <span aria-hidden="true" className="text-xs tabular-nums">{risk}</span>
    </span>
  );
}
