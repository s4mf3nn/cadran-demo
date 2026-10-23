import { useEffect, useId, useState, type FormEvent } from 'react';
import { PencilEdit01Icon, SparklesIcon } from '@hugeicons/core-free-icons';
import type { AssistantApi } from '../hooks/useAssistant';
import { COUNTRY_CODE, RISK_LABEL } from '@/lib/labels';
import { applyEdit, EDITABLE_KEYS, type Edit } from '../data/edits';
import { useEdits } from '../store/edits';
import { focusIn } from '../lib/focus';
import { useFilters } from '../store/filters';
import {
  CATEGORIES, COUNTRIES, REGULATIONS, RISKS, STATUSES, STATUS_LABEL,
  type Requirement, type Risk, type Status,
} from '../data/types';
import { RiskMeter } from './RiskMeter';
import { StatusTag } from './StatusTag';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from '@/components/ui/drawer';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

const FIELD = 'h-9 w-full min-w-0 rounded-md border border-input-strong bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';
const toDateInput = (ms: number) => new Date(ms).toISOString().slice(0, 10);
const fromDateInput = (v: string) => {
  const ms = Date.parse(`${v}T00:00:00Z`);
  return Number.isNaN(ms) ? null : ms;
};

function Select<T extends string | number>({ label, value, options, onChange }: {
  label: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <select id={id} className={FIELD} value={value} onChange={(e) => onChange(options.find((o) => String(o.value) === e.target.value)!.value)}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

const plain = <T extends string>(list: readonly T[]) => list.map((value) => ({ value, label: value }));

const EDIT_FORM_ID = 'requirement-edit-form';

/** Formulaire d'édition : les champs du référentiel, hors référence. Valide via le bouton « Enregistrer » du pied. */
function EditForm({ r, onSave }: { r: Requirement; onSave: (next: Requirement) => void }) {
  const [draft, setDraft] = useState(r);
  const [due, setDue] = useState(toDateInput(r.dueAt));
  const titleId = useId();
  const dueId = useId();
  const dueAt = fromDateInput(due);
  const titleError = !draft.title.trim();
  const set = <K extends keyof Requirement>(key: K, value: Requirement[K]) => setDraft((d) => ({ ...d, [key]: value }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (titleError || dueAt === null) return;
    onSave({ ...draft, title: draft.title.trim(), dueAt });
  };

  return (
    <form id={EDIT_FORM_ID} onSubmit={submit} className="grid grid-cols-2 gap-x-4 gap-y-3">
      <div className="col-span-2 flex flex-col gap-1.5">
        <Label htmlFor={titleId}>Intitulé</Label>
        <Input id={titleId} value={draft.title} aria-invalid={titleError} onChange={(e) => set('title', e.target.value)} />
        {titleError && <p role="alert" className="text-xs text-destructive">L'intitulé est obligatoire.</p>}
      </div>
      <Select<Status> label="Statut" value={draft.status} options={STATUSES.map((value) => ({ value, label: STATUS_LABEL[value] }))} onChange={(v) => set('status', v)} />
      <Select<Risk> label="Risque" value={draft.risk} options={RISKS.map((value) => ({ value, label: `${value} · ${RISK_LABEL[value]}` }))} onChange={(v) => set('risk', v)} />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={dueId}>Échéance</Label>
        <Input id={dueId} type="date" value={due} aria-invalid={dueAt === null} onChange={(e) => setDue(e.target.value)} />
      </div>
      <Select label="Réglementation" value={draft.regulation} options={plain(REGULATIONS)} onChange={(v) => set('regulation', v)} />
      <Select label="Pays" value={draft.country} options={plain(COUNTRIES)} onChange={(v) => set('country', v)} />
      <Select label="Catégorie" value={draft.category} options={plain(CATEGORIES)} onChange={(v) => set('category', v)} />
    </form>
  );
}

function Body({ r, Title, editing, onSave }: { r: Requirement; Title: typeof DialogTitle; editing: boolean; onSave: (next: Requirement) => void }) {
  return (
    <div className="flex flex-col gap-5 px-4 md:px-0">
      <Header r={r} Title={Title} />
      {editing ? (
        <EditForm r={r} onSave={onSave} />
      ) : (
        <>
          <Signals r={r} />
          <Context r={r} />
        </>
      )}
    </div>
  );
}

const SECONDARY = 'inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full border border-input-strong bg-background px-5 text-body font-medium hover:bg-surface';

/** Détail d'une exigence : boîte de dialogue sur desktop, tiroir sur mobile. */
export function RequirementDetail({ assistant, isMobile }: { assistant: AssistantApi; isMobile: boolean }) {
  const opened = useFilters((s) => s.opened);
  const open = useFilters((s) => s.open);
  const edited = useEdits((s) => (opened ? s.edits[opened.id] : undefined));
  const [editing, setEditing] = useState(false);
  // Une autre fiche, ou la fermeture, quitte le mode édition.
  const openedId = opened?.id;
  useEffect(() => setEditing(false), [openedId]);
  const close = (o: boolean) => { if (!o) open(null); };

  if (!opened && !isMobile) return null;
  const busy = assistant.status === 'thinking' || assistant.status === 'streaming';

  const ask = () => {
    if (!opened || busy || !assistant.ready) return;
    open(null);
    focusIn('right', 'assistant-input');
    assistant.send(`Analyse l'exigence ${opened.ref} (${opened.regulation}, ${opened.country}) : « ${opened.title} ». Que dois-je faire en priorité ?`);
  };

  /** Ne garde que ce qui diffère de la fiche affichée, puis la met à jour sans attendre le recalcul du worker. */
  const save = (next: Requirement) => {
    if (!opened) return;
    const changes: Edit = {};
    for (const key of EDITABLE_KEYS) {
      if (next[key] !== opened[key]) Object.assign(changes, { [key]: next[key] });
    }
    if (Object.keys(changes).length) {
      useEdits.getState().setEdit(opened.id, changes);
      open(applyEdit(opened, changes));
    }
    setEditing(false);
  };

  /** Efface les modifications de l'exigence ; la fiche se ferme, la ligne du tableau retrouve ses valeurs d'origine. */
  const revert = () => {
    if (!opened) return;
    useEdits.getState().revert(opened.id);
    open(null);
  };

  const action = editing ? (
    <>
      <button key="cancel" type="button" onClick={() => setEditing(false)} className={SECONDARY}>Annuler</button>
      <button
        key="save"
        type="submit"
        form={EDIT_FORM_ID}
        className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-foreground px-5 text-body font-medium text-background hover:bg-foreground-soft"
      >
        Enregistrer
      </button>
    </>
  ) : (
    <>
      {edited && <button key="revert" type="button" onClick={revert} className={SECONDARY}>Rétablir l'original</button>}
      <button key="edit" type="button" onClick={() => setEditing(true)} className={SECONDARY}>
        <Icon icon={PencilEdit01Icon} size={20} />
        Modifier
      </button>
      <button
        key="ask"
        type="button"
        disabled={busy || !assistant.ready}
        onClick={ask}
        className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-foreground px-5 text-body font-medium text-background hover:bg-foreground-soft disabled:bg-track disabled:text-muted"
      >
        <Icon icon={SparklesIcon} size={20} />
        Demander à l'assistant
      </button>
    </>
  );

  if (isMobile) {
    return (
      <Drawer open={opened != null} onOpenChange={close}>
        <DrawerContent className="data-[vaul-drawer-direction=bottom]:max-h-[88dvh]">
          <DrawerDescription className="sr-only">Détail de l'exigence</DrawerDescription>
          {opened && <Body r={opened} Title={DrawerTitle as typeof DialogTitle} editing={editing} onSave={save} />}
          <div className="mt-5 flex flex-col gap-2 p-4 [&>button]:w-full">{action}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open onOpenChange={close}>
      <DialogContent>
        <DialogDescription className="sr-only">Détail de l'exigence</DialogDescription>
        <Body r={opened!} Title={DialogTitle} editing={editing} onSave={save} />
        <div className="flex flex-wrap justify-end gap-2 pt-4">{action}</div>
      </DialogContent>
    </Dialog>
  );
}
