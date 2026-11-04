import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CATALOGUE } from "@/data/catalogue";
import type { School } from "@/lib/model";

type AtlasState = {
  added: School[];
  overrides: Record<string, School>;
  addSchool: (school: School) => void;
  updateAdded: (school: School) => void;
  setOverride: (school: School) => void;
  removeAdded: (id: string) => void;
  clearOverride: (id: string) => void;
  resetAll: () => void;
};

export const useAtlas = create<AtlasState>()(
  persist(
    (set, get) => ({
      added: [],
      overrides: {},
      addSchool: (school) => set({ added: [...get().added, school] }),
      updateAdded: (school) =>
        set({ added: get().added.map((item) => (item.id === school.id ? school : item)) }),
      setOverride: (school) => set({ overrides: { ...get().overrides, [school.id]: school } }),
      removeAdded: (id) => set({ added: get().added.filter((item) => item.id !== id) }),
      clearOverride: (id) => {
        const next = { ...get().overrides };
        delete next[id];
        set({ overrides: next });
      },
      resetAll: () => set({ added: [], overrides: {} }),
    }),
    {
      name: "shule-atlas-v1",
      skipHydration: true,
      partialize: (state) => ({ added: state.added, overrides: state.overrides }),
    },
  ),
);

export function mergeSchools(added: School[], overrides: Record<string, School>) {
  const catalogue = CATALOGUE.map((school) => overrides[school.id] ?? school);
  return [...catalogue, ...added];
}
