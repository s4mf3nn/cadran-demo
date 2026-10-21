import { useEffect, useRef } from 'react';
import { matchShortcut, type ShortcutId } from '../lib/shortcuts';

export type HotkeyHandlers = Partial<Record<ShortcutId, () => void>>;

/**
 * Écoute globale des raccourcis. Les touches simples sont ignorées quand le focus est dans un champ,
 * sauf Échap et les combinaisons avec ⌘/Ctrl. Les handlers sont lus via une ref : pas de réabonnement à chaque rendu.
 */
export function useHotkeys(handlers: HotkeyHandlers) {
  const ref = useRef(handlers);
  ref.current = handlers;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const s = matchShortcut(e);
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
