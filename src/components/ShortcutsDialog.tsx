import { SHORTCUTS, TABLE_SHORTCUTS, keyLabel, type Shortcut } from '../lib/shortcuts';
import { useUi } from '../store/ui';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Kbd } from '@/components/ui/kbd';

const GROUPS: Shortcut['group'][] = ['Général', 'Navigation', 'Filtres', 'Assistant'];

function Row({ keys, label }: { keys: string[]; label: string }) {
  return (
    <li className="flex items-center justify-between gap-4 py-1.5">
      <span>{label}</span>
      <span className="flex shrink-0 gap-1">
        {keys.map((k) => <Kbd key={k}>{k}</Kbd>)}
      </span>
    </li>
  );
}

export function ShortcutsDialog() {
  const open = useUi((s) => s.helpOpen);
  const setOpen = useUi((s) => s.setHelpOpen);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Raccourcis clavier</DialogTitle>
          <DialogDescription>Les touches simples sont désactivées quand le focus est dans un champ de saisie.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-5 sm:grid-cols-2">
          {GROUPS.map((g) => (
            <section key={g} aria-label={g}>
              <h3 className="mb-1 text-xs font-medium text-muted-foreground">{g}</h3>
              <ul className="divide-y divide-border">
                {SHORTCUTS.filter((s) => s.group === g).map((s) => <Row key={s.id} keys={keyLabel(s)} label={s.label} />)}
              </ul>
            </section>
          ))}
          <section aria-label="Table" className="sm:col-span-2">
            <h3 className="mb-1 text-xs font-medium text-muted-foreground">Table (focus sur la grille)</h3>
            <ul className="divide-y divide-border">
              {TABLE_SHORTCUTS.map((s) => <Row key={s.label} keys={s.keys} label={s.label} />)}
            </ul>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
