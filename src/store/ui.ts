import { create } from 'zustand';

type Side = 'left' | 'right';

const key = (side: Side) => `cadran.panel.${side}`;

/** Lecture protégée : stockage indisponible (navigation privée, données bloquées) => panneau ouvert. */
function readOpen(side: Side): boolean {
  try {
    return localStorage.getItem(key(side)) !== 'closed';
  } catch {
    return true;
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
  quickOpen: boolean;
  /** Mobile : les panneaux deviennent des tiroirs, fermés par défaut et sans persistance. */
  leftDrawer: boolean;
  rightDrawer: boolean;
  setPanel: (side: Side, open: boolean) => void;
  togglePanel: (side: Side) => void;
  setHelpOpen: (open: boolean) => void;
  setQuickOpen: (open: boolean) => void;
  setDrawer: (side: Side, open: boolean) => void;
}

export const useUi = create<UiState>((set, get) => ({
  leftOpen: readOpen('left'),
  rightOpen: readOpen('right'),
  helpOpen: false,
  quickOpen: false,
  leftDrawer: false,
  rightDrawer: false,
  setPanel: (side, open) => {
    writeOpen(side, open);
    set(side === 'left' ? { leftOpen: open } : { rightOpen: open });
  },
  togglePanel: (side) => get().setPanel(side, !(side === 'left' ? get().leftOpen : get().rightOpen)),
  setHelpOpen: (helpOpen) => set({ helpOpen }),
  setQuickOpen: (quickOpen) => set({ quickOpen }),
  setDrawer: (side, open) => set(side === 'left' ? { leftDrawer: open } : { rightDrawer: open }),
}));
