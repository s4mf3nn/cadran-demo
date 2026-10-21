import type { ReactNode } from 'react';
import { AiMagicIcon, Cancel01Icon } from '@hugeicons/core-free-icons';
import { useUi } from '@/store/ui';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Kbd } from '@/components/ui/kbd';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export const RIGHT_PANEL_ID = 'panel-right';

export function AssistantHeader({ actions, ...props }: { actions?: ReactNode } & React.ComponentProps<'div'>) {
  return (
    <div className="flex items-center gap-2" {...props}>
      <Icon icon={AiMagicIcon} size={18} className="text-primary" />
      <span className="text-sm font-semibold">Assistant</span>
      <Kbd aria-hidden="true">⌘J</Kbd>
      {actions}
    </div>
  );
}

/**
 * Assistant flottant en bas à droite : il se superpose au tableau de bord sans le redimensionner.
 * Le contenu reste monté (masqué) pour ne pas perdre la réponse en cours.
 */
export function RightPanel({ children }: { children: ReactNode }) {
  const open = useUi((s) => s.rightOpen);
  const toggle = useUi((s) => s.togglePanel);
  const label = "Fermer l'assistant";

  return (
    <aside
      id={RIGHT_PANEL_ID}
      aria-label="Assistant"
      className="pointer-events-none fixed inset-y-4 right-4 z-40 hidden flex-col items-end gap-3 md:flex"
    >
      <div
        className={cn(
          'pointer-events-auto h-full w-[400px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-xl border border-border bg-background shadow-xl',
          open ? 'flex' : 'hidden',
        )}
      >
        <div className="flex h-[52px] shrink-0 items-center justify-between border-b border-border px-3">
          <AssistantHeader role="heading" aria-level={2} />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button type="button" variant="ghost" size="icon" aria-label={label} aria-expanded={open} aria-controls={RIGHT_PANEL_ID} onClick={() => toggle('right')}>
                <Icon icon={Cancel01Icon} size={18} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">{label}</TooltipContent>
          </Tooltip>
        </div>
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </div>
    </aside>
  );
}
