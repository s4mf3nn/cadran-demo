import { SparklesIcon } from '@hugeicons/core-free-icons';
import type { AssistantApi } from '../hooks/useAssistant';
import { COUNTRY_CODE, RISK_LABEL } from '@/lib/labels';
import { focusIn } from '../lib/focus';
import { useFilters } from '../store/filters';
import type { Requirement } from '../data/types';
import { RiskMeter } from './RiskMeter';
import { StatusTag } from './StatusTag';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from '@/components/ui/drawer';
import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/utils';

const dateFmt = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' });
const DAY = 86_400_000;

/** Échéance lisible : « dans 12 jours », « aujourd'hui », « dépassée de 3 jours ». */
export function dueLabel(dueAt: number, now = Date.now()): string {
  const days = Math.round((dueAt - now) / DAY);
  if (days === 0) return "aujourd'hui";
  const n = Math.abs(days);
  const unit = n > 1 ? 'jours' : 'jour';
  return days > 0 ? `dans ${n} ${unit}` : `dépassée de ${n} ${unit}`;
}

function Header({ r, Title }: { r: Requirement; Title: typeof DialogTitle }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="font-mono text-xs text-muted-foreground">{r.ref}</span>
        <StatusTag status={r.status} />
      </div>
      <Title className="text-lg leading-snug font-semibold text-balance">{r.title}</Title>
    </div>
  );
}

function Signals({ r }: { r: Requirement }) {
  return (
    <div className="grid grid-cols-2 divide-x divide-border rounded-lg border bg-surface">
      <div className="flex flex-col gap-1 p-3">
        <span className="text-micro font-medium tracking-wide text-muted-foreground uppercase">Échéance</span>
        <span className="text-sm font-semibold">{dateFmt.format(r.dueAt)}</span>
        <span className="text-xs text-muted-foreground">{dueLabel(r.dueAt)}</span>
      </div>
      <div className="flex flex-col gap-1 p-3">
        <span className="text-micro font-medium tracking-wide text-muted-foreground uppercase">Risque</span>
        <RiskMeter risk={r.risk} />
        <span className="text-xs text-muted-foreground">{RISK_LABEL[r.risk]}</span>
      </div>
    </div>
  );
}

function Context({ r }: { r: Requirement }) {
  const rows: [string, string][] = [
    ['Réglementation', r.regulation],
    ['Pays', `${r.country} (${COUNTRY_CODE[r.country]})`],
    ['Catégorie', r.category],
  ];
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
      {rows.map(([label, value], i) => (
        <div key={label} className={cn('flex flex-col gap-0.5', i === 0 && 'col-span-2')}>
          <dt className="text-micro font-medium tracking-wide text-muted-foreground uppercase">{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function Body({ r, Title }: { r: Requirement; Title: typeof DialogTitle }) {
  return (
    <div className="flex flex-col gap-5 px-4 md:px-0">
      <Header r={r} Title={Title} />
      <Signals r={r} />
      <Context r={r} />
    </div>
  );
}

/** Détail d'une exigence : boîte de dialogue sur desktop, tiroir sur mobile. */
export function RequirementDetail({ assistant, isMobile }: { assistant: AssistantApi; isMobile: boolean }) {
  const opened = useFilters((s) => s.opened);
  const open = useFilters((s) => s.open);
  const close = (o: boolean) => { if (!o) open(null); };

  if (!opened && !isMobile) return null;
  const busy = assistant.status === 'thinking' || assistant.status === 'streaming';

  const ask = () => {
    if (!opened || busy || !assistant.ready) return;
    open(null);
    focusIn('right', 'assistant-input');
    assistant.send(`Analyse l'exigence ${opened.ref} (${opened.regulation}, ${opened.country}) : « ${opened.title} ». Que dois-je faire en priorité ?`);
  };

  const action = (
    <Button type="button" disabled={busy || !assistant.ready} onClick={ask} className="h-11 gap-2 md:h-9">
      <Icon icon={SparklesIcon} size={16} />
      Demander à l'assistant
    </Button>
  );

  if (isMobile) {
    return (
      <Drawer open={opened != null} onOpenChange={close}>
        <DrawerContent className="data-[vaul-drawer-direction=bottom]:max-h-[88dvh]">
          <DrawerDescription className="sr-only">Détail de l'exigence</DrawerDescription>
          {opened && <Body r={opened} Title={DrawerTitle as typeof DialogTitle} />}
          <div className="mt-5 border-t p-4 [&>button]:w-full">{action}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open onOpenChange={close}>
      <DialogContent>
        <DialogDescription className="sr-only">Détail de l'exigence</DialogDescription>
        <Body r={opened!} Title={DialogTitle} />
        <div className="flex justify-end border-t pt-4">{action}</div>
      </DialogContent>
    </Dialog>
  );
}
