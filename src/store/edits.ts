import { create } from 'zustand';
import { sanitizeEdits, type Edit, type Edits } from '../data/edits';
import { readJson, writeJson } from '../lib/storage';

const KEY = 'cadran:edits';

interface EditsState {
  edits: Edits;
  /** Incrémenté à chaque changement : clé de requête et marqueur d'état pour le worker. */
  version: number;
  setEdit: (id: number, changes: Edit) => void;
  revert: (id: number) => void;
}

/**
 * Modifications locales posées sur le référentiel généré, persistées dans le navigateur.
 * Les ids sont stables (jeu déterministe, et les 150 000 premières lignes sont communes aux deux paliers).
 */
export const useEdits = create<EditsState>((set) => ({
  edits: sanitizeEdits(readJson(KEY)),
  version: 0,
  setEdit: (id, changes) =>
    set((s) => commit(s, { ...s.edits, [id]: { ...s.edits[id], ...changes } })),
  revert: (id) =>
    set((s) => {
      const { [id]: _, ...rest } = s.edits;
      return commit(s, rest);
    }),
}));

function commit(s: EditsState, edits: Edits) {
  writeJson(KEY, edits);
  return { edits, version: s.version + 1 };
}
