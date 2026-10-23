/** Registre unique des raccourcis : alimente le hook global ET la boîte d'aide (?), pour qu'ils ne divergent pas. */
export type ShortcutId =
  | 'search' | 'toggleLeft' | 'focusAssistant'
  | 'suggestion1' | 'suggestion2' | 'suggestion3' | 'escape' | 'help';

export interface Shortcut {
  id: ShortcutId;
  /** Valeur de KeyboardEvent.key, en minuscules pour les lettres. */
  key: string;
  /** Combinaison avec ⌘ (macOS) ou Ctrl. */
  mod?: boolean;
  label: string;
  group: 'Navigation' | 'Assistant' | 'Général';
}

export const SHORTCUTS: Shortcut[] = [
  { id: 'search', key: '/', label: 'Rechercher', group: 'Général' },
  { id: 'help', key: '?', label: "Afficher l'aide des raccourcis", group: 'Général' },
  { id: 'escape', key: 'Escape', label: 'Arrêter la réponse ou fermer', group: 'Général' },
  { id: 'toggleLeft', key: '(', label: 'Réduire ou rouvrir le panneau de gauche', group: 'Navigation' },
  { id: 'focusAssistant', key: 'j', mod: true, label: "Poser une question à l'assistant", group: 'Assistant' },
  { id: 'suggestion1', key: '1', label: 'Lancer la suggestion 1', group: 'Assistant' },
  { id: 'suggestion2', key: '2', label: 'Lancer la suggestion 2', group: 'Assistant' },
  { id: 'suggestion3', key: '3', label: 'Lancer la suggestion 3', group: 'Assistant' },
];

/** Raccourcis propres à la table : gérés par la grille elle-même (focus requis), listés ici pour l'aide. */
export const TABLE_SHORTCUTS: { keys: string[]; label: string }[] = [
  { keys: ['↑', '↓'], label: 'Naviguer dans la table' },
  { keys: ['Espace'], label: 'Ouvrir la ligne' },
  { keys: ['↵'], label: 'Ouvrir la ligne' },
];

export const isMac = () => typeof navigator !== 'undefined' && /mac|iphone|ipad/i.test(navigator.platform);

export const keyLabel = (s: Shortcut): string[] => {
  const k = s.key === 'Escape' ? 'Échap' : s.key.length === 1 ? s.key.toUpperCase() : s.key;
  return s.mod ? [isMac() ? '⌘' : 'Ctrl', k] : [k];
};

const FIELD = 'input, textarea, select, [contenteditable=""], [contenteditable="true"], [role="combobox"]';

/** Raccourci à une touche caractère, au sens de WCAG 2.1.4 (lettre, chiffre, ponctuation, sans ⌘/Ctrl). */
export const isCharKey = (s: Shortcut) => !s.mod && s.key.length === 1;

/**
 * Renvoie le raccourci correspondant à l'événement, ou undefined. Ignore les touches simples dans un champ (sauf Échap),
 * et partout quand `charKeys` est faux (réglage utilisateur).
 */
export function matchShortcut(e: KeyboardEvent, { charKeys = true }: { charKeys?: boolean } = {}): Shortcut | undefined {
  if (e.defaultPrevented || e.isComposing || e.altKey) return undefined;
  const mod = e.metaKey || e.ctrlKey;
  const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  const s = SHORTCUTS.find((c) => c.key === key && !!c.mod === mod);
  if (!s || (!charKeys && isCharKey(s))) return undefined;
  const inField = e.target instanceof Element && e.target.closest(FIELD) != null;
  if (inField && !s.mod && s.key !== 'Escape') return undefined;
  return s;
}
