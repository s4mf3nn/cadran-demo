import { create } from 'zustand';

type Side = 'left' | 'right';

const key = (side: Side) => `cadran.panel.${side}`;

/** Lecture protégée. Filtres ouverts par défaut ; assistant flottant fermé par défaut (il recouvre le tableau de bord). */
function readOpen(side: Side): boolean {
  const fallback = side === 'left';
  try {
    const v = localStorage.getItem(key(side));
    return v === null ? fallback : v === 'open';
  } catch {
    return fallback;
  }
}

function writeOpen(side: Side, open: boolean) {
  try {
    localStorage.setItem(key(side), open ? 'open' : 'closed');
  } catch {
    // Pas de persistance possible : l'état vaut pour la session.
  }
}

interface UiState {
  leftOpen: boolean;
  rightOpen: boolean;
  helpOpen: boolean;
  searchOpen: boolean;
  /** Mobile : les panneaux deviennent des tiroirs, fermés par défaut et sans persistance. */
  leftDrawer: boolean;
  rightDrawer: boolean;
  setPanel: (side: Side, open: boolean) => void;
  togglePanel: (side: Side) => void;
  setHelpOpen: (open: boolean) => void;
  setSearchOpen: (open: boolean) => void;
  setDrawer: (side: Side, open: boolean) => void;
}

export const useUi = create<UiState>((set, get) => ({
  leftOpen: readOpen('left'),
  rightOpen: readOpen('right'),
  helpOpen: false,
  searchOpen: false,
  leftDrawer: false,
  rightDrawer: false,
  setPanel: (side, open) => {
    writeOpen(side, open);
    set(side === 'left' ? { leftOpen: open } : { rightOpen: open });
  },
  togglePanel: (side) => get().setPanel(side, !(side === 'left' ? get().leftOpen : get().rightOpen)),
  setHelpOpen: (helpOpen) => set({ helpOpen }),
  setSearchOpen: (searchOpen) => set({ searchOpen }),
  setDrawer: (side, open) => set(side === 'left' ? { leftDrawer: open } : { rightDrawer: open }),
}));
