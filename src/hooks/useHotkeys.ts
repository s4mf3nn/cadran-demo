import { useEffect, useRef } from 'react';
import { matchShortcut, type ShortcutId } from '../lib/shortcuts';
import { useUi } from '../store/ui';

export type HotkeyHandlers = Partial<Record<ShortcutId, () => void>>;

/**
 * Écoute globale des raccourcis. Les touches simples sont ignorées quand le focus est dans un champ,
 * sauf Échap et les combinaisons avec ⌘/Ctrl, et partout si l'utilisateur les a désactivées ou si `charKeys` est faux. Les handlers sont lus via une ref : pas de réabonnement à chaque rendu.
 */
export function useHotkeys(handlers: HotkeyHandlers, { charKeys = true }: { charKeys?: boolean } = {}) {
  const ref = useRef(handlers);
  ref.current = handlers;
  const charKeysRef = useRef(charKeys);
  charKeysRef.current = charKeys;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const s = matchShortcut(e, { charKeys: charKeysRef.current && useUi.getState().charKeys });
      const fn = s && ref.current[s.id];
      if (!fn) return;
      // Échap reste libre pour fermer les dialogues Radix (qui le gèrent avant, en phase de capture/bulle sur leur contenu).
      if (s.id !== 'escape') e.preventDefault();
      fn();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
}
