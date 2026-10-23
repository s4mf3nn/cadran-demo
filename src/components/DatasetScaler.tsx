import { RadioGroup as RadioGroupPrimitive } from 'radix-ui';
import { DATASET_SIZES, useDatasetSize, type DatasetSize } from '../store/dataset';
import { cn } from '@/lib/utils';
import { nf } from './viz/format';

const SHORT: Record<DatasetSize, string> = { 150_000: '150 k', 1_000_000: '1 M' };

/**
 * Montée en charge en un clic : sélecteur à deux segments, 150 000 ou 1 000 000 d'exigences
 * régénérées dans le worker. Groupe radio : flèches pour changer de palier au clavier.
 */
export function DatasetScaler({ isScaling, className }: { isScaling: boolean; className?: string }) {
  const size = useDatasetSize((s) => s.size);
  const setSize = useDatasetSize((s) => s.setSize);

  return (
    <RadioGroupPrimitive.Root
      aria-label="Volume du référentiel"
      aria-busy={isScaling}
      orientation="horizontal"
      value={String(size)}
      onValueChange={(v) => setSize(Number(v) as DatasetSize)}
      className={cn('flex items-center gap-1 rounded-full border-2 border-card-border bg-background p-1.5', className)}
    >
      {DATASET_SIZES.map((s) => (
        <RadioGroupPrimitive.Item
          key={s}
          value={String(s)}
          aria-label={`${nf.format(s)} exigences`}
          className={cn(
            'h-11 min-w-16 rounded-full px-4 text-body font-medium tabular-nums text-muted hover:bg-surface hover:text-foreground',
            'data-[state=checked]:bg-foreground data-[state=checked]:text-background data-[state=checked]:hover:bg-foreground',
            isScaling && 'data-[state=checked]:animate-pulse',
          )}
        >
          {SHORT[s]}
        </RadioGroupPrimitive.Item>
      ))}
    </RadioGroupPrimitive.Root>
  );
}
