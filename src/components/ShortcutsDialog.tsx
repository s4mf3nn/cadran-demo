import { SHORTCUTS, TABLE_SHORTCUTS, isCharKey, keyLabel, type Shortcut } from '../lib/shortcuts';
import { useUi } from '../store/ui';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Kbd } from '@/components/ui/kbd';
import { cn } from '@/lib/utils';

function Row({ keys, label, disabled = false }: { keys: string[]; label: string; disabled?: boolean }) {
  return (
    <li className={cn('flex items-center justify-between gap-4 py-1.5', disabled && 'text-muted')}>
      <span>{label}{disabled && ' (désactivé)'}</span>
      <span className="flex shrink-0 gap-1">
        {keys.map((k) => <Kbd key={k}>{k}</Kbd>)}
      </span>
    </li>
  );
}

function Group({ group }: { group: Shortcut['group'] }) {
  const charKeys = useUi((s) => s.charKeys);
  return (
    <section aria-label={group}>
      <h3 className="mb-1 text-xs font-medium text-muted-foreground">{group}</h3>
      <ul className="divide-y divide-border">
        {SHORTCUTS.filter((s) => s.group === group).map((s) => <Row key={s.id} keys={keyLabel(s)} label={s.label} disabled={!charKeys && isCharKey(s)} />)}
      </ul>
    </section>
  );
}

export function ShortcutsDialog() {
  const open = useUi((s) => s.helpOpen);
  const setOpen = useUi((s) => s.setHelpOpen);
  const charKeys = useUi((s) => s.charKeys);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Raccourcis clavier</DialogTitle>
          <DialogDescription>
            {charKeys
              ? 'Les touches simples sont ignorées quand le focus est dans un champ de saisie. Elles peuvent être désactivées partout depuis le menu Réglages.'
              : 'Les touches simples sont désactivées. Elles peuvent être réactivées depuis le menu Réglages.'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
          <div className="space-y-5">
            <Group group="Général" />
            <Group group="Navigation" />
          </div>
          <div className="space-y-5">
            <Group group="Assistant" />
            <section aria-label="Table">
              <h3 className="mb-1 text-xs font-medium text-muted-foreground">Table (focus sur la grille)</h3>
              <ul className="divide-y divide-border">
                {TABLE_SHORTCUTS.map((s) => <Row key={s.keys.join()} keys={s.keys} label={s.label} />)}
              </ul>
            </section>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
