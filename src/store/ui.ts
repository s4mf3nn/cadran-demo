import { create } from 'zustand';
import { readFlag, writeFlag, type FlagValues } from '../lib/storage';

type Side = 'left' | 'right';

const key = (side: Side) => `cadran.panel.${side}`;
const PANEL: FlagValues = ['open', 'closed'];

/** Les deux panneaux sont ouverts par défaut (assistant docké à droite). */
const readOpen = (side: Side) => readFlag(key(side), PANEL, true);

const CHAR_KEYS = 'cadran.charKeys';
const ON_OFF: FlagValues = ['on', 'off'];

interface UiState {
  leftOpen: boolean;
  rightOpen: boolean;
  helpOpen: boolean;
  searchOpen: boolean;
  /** Mobile : les panneaux deviennent des tiroirs, fermés par défaut et sans persistance. */
  leftDrawer: boolean;
  rightDrawer: boolean;
  /** Raccourcis à une touche (WCAG 2.1.4) : actifs par défaut, désactivables dans Réglages. */
  charKeys: boolean;
  setPanel: (side: Side, open: boolean) => void;
  togglePanel: (side: Side) => void;
  setHelpOpen: (open: boolean) => void;
  setSearchOpen: (open: boolean) => void;
  setDrawer: (side: Side, open: boolean) => void;
  setCharKeys: (on: boolean) => void;
}

export const useUi = create<UiState>((set, get) => ({
  leftOpen: readOpen('left'),
  rightOpen: readOpen('right'),
  helpOpen: false,
  searchOpen: false,
  leftDrawer: false,
  rightDrawer: false,
  charKeys: readFlag(CHAR_KEYS, ON_OFF, true),
  setPanel: (side, open) => {
    writeFlag(key(side), PANEL, open);
    set(side === 'left' ? { leftOpen: open } : { rightOpen: open });
  },
  togglePanel: (side) => get().setPanel(side, !(side === 'left' ? get().leftOpen : get().rightOpen)),
  setHelpOpen: (helpOpen) => set({ helpOpen }),
  setSearchOpen: (searchOpen) => set({ searchOpen }),
  setDrawer: (side, open) => set(side === 'left' ? { leftDrawer: open } : { rightDrawer: open }),
  setCharKeys: (charKeys) => {
    writeFlag(CHAR_KEYS, ON_OFF, charKeys);
    set({ charKeys });
  },
}));
