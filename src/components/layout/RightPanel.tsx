import type { ReactNode } from 'react';
import { useUi } from '@/store/ui';
import { cn } from '@/lib/utils';

export const RIGHT_PANEL_ID = 'panel-right';

/**
 * Assistant docké à droite (carte de 372 px). Fermé, il libère la place pour le tableau de bord ;
 * le contenu reste monté (masqué) pour ne pas perdre la réponse en cours.
 */
export function RightPanel({ children }: { children: ReactNode }) {
  const open = useUi((s) => s.rightOpen);
  return (
    <aside
      id={RIGHT_PANEL_ID}
      aria-label="Assistant"
      className={cn('hidden w-[372px] shrink-0 flex-col overflow-hidden rounded-card border-2 border-card-border bg-background', open && 'md:flex')}
    >
      {children}
    </aside>
  );
}
