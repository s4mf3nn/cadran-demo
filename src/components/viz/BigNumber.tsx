import { cn } from '@/lib/utils';
import { pctText } from './format';
import { useTween } from './useTween';

/** Grand pourcentage animé : nombre en poids 500, interlettrage serré, « % » à ~45 % de la taille. */
export function BigNumber({ value, size, percentSize = Math.round(size * 0.45), className }: {
  value: number | null;
  size: number;
  percentSize?: number;
  className?: string;
}) {
  const shown = useTween(value ?? 0);
  return (
    <span aria-hidden="true" className={cn('num-tight inline-flex items-baseline whitespace-nowrap', className)} style={{ fontSize: size }}>
      {pctText(value == null ? null : shown)}
      {value != null && <span className="ml-[0.06em] font-medium tracking-normal" style={{ fontSize: percentSize }}>%</span>}
    </span>
  );
}
