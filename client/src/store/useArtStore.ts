import { create } from "zustand";

export type TPoint = {
  x: number;
  y: number;
};

export type TLine = {
  color: string;
  decay: Date;
  positions: TPoint[];
};

type Store = {
  arts: TLine[];
  setArts: (arts: TLine[]) => void;
};

export const useArtStore = create<Store>((set) => ({
  arts: [],
  setArts: (arts) => set(() => ({ arts })),
}));
