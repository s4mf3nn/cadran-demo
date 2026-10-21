import { create } from 'zustand';

interface UiState {
  helpOpen: boolean;
  quickOpen: boolean;
  setHelpOpen: (open: boolean) => void;
  setQuickOpen: (open: boolean) => void;
}

export const useUi = create<UiState>((set) => ({
  helpOpen: false,
  quickOpen: false,
  setHelpOpen: (helpOpen) => set({ helpOpen }),
  setQuickOpen: (quickOpen) => set({ quickOpen }),
}));
