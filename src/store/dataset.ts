import { create } from 'zustand';

/** Paliers de la montée en charge (sélecteur flottant) : le contraste suffit, pas de palier intermédiaire. */
export const DATASET_SIZES = [150_000, 1_000_000] as const;
export type DatasetSize = (typeof DATASET_SIZES)[number];

interface DatasetState {
  size: DatasetSize;
  setSize: (size: DatasetSize) => void;
}

/** Pas de persistance : la démo repart toujours de 150 000 exigences. */
export const useDatasetSize = create<DatasetState>((set) => ({
  size: DATASET_SIZES[0],
  setSize: (size) => set({ size }),
}));
