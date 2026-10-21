import type { ReactNode } from 'react';
import { AiMagicIcon, SidebarRightIcon } from '@hugeicons/core-free-icons';
import { useUi } from '@/store/ui';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Kbd } from '@/components/ui/kbd';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export const RIGHT_PANEL_ID = 'panel-right';

export function AssistantHeader({ actions }: { actions?: ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <Icon icon={AiMagicIcon} size={18} className="text-primary" />
      <h2 className="text-sm font-semibold">Assistant</h2>
      <Kbd>⌘J</Kbd>
      {actions}
    </div>
  );
}

/** Panneau de droite : 380 px, ou rail de 52 px. Le contenu reste monté pour ne pas perdre la réponse en cours. */
export function RightPanel({ children }: { children: ReactNode }) {
  const open = useUi((s) => s.rightOpen);
  const toggle = useUi((s) => s.togglePanel);
  const label = open ? "Réduire l'assistant" : "Ouvrir l'assistant";

  return (
    <aside
      id={RIGHT_PANEL_ID}
      aria-label="Assistant"
      className={cn(
        'hidden shrink-0 flex-col border-l border-border bg-background transition-[width] duration-200 motion-reduce:transition-none md:flex',
        open ? 'w-[380px]' : 'w-[52px] items-center',
      )}
    >
      <div className={cn('flex h-[52px] shrink-0 items-center', open ? 'justify-between px-3' : 'justify-center')}>
        {open && <AssistantHeader />}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button type="button" variant="ghost" size="icon" aria-label={label} aria-expanded={open} aria-controls={RIGHT_PANEL_ID} onClick={() => toggle('right')}>
              <Icon icon={open ? SidebarRightIcon : AiMagicIcon} size={18} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">{label} ]</TooltipContent>
        </Tooltip>
      </div>
      <div className={cn('min-h-0 flex-1 flex-col', open ? 'flex' : 'hidden')}>{children}</div>
    </aside>
  );
}
