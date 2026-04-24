import { ArchiveTrack } from "@/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface LibraryState {
  savedTracks: ArchiveTrack[];
  recentlyPlayed: ArchiveTrack[];
  addToLibrary: (track: ArchiveTrack) => void;
  removeFromLibrary: (trackId: string) => void;
  isInLibrary: (trackId: string) => boolean;
  addToRecentlyPlayed: (track: ArchiveTrack) => void;
  clearRecentlyPlayed: () => void;
}

export const useLibraryStore = create<LibraryState>()(
  persist(
    (set, get) => ({
      savedTracks: [],
      recentlyPlayed: [],

      addToLibrary: (track) => {
        if (!get().isInLibrary(track.id)) {
          set((state) => ({
            savedTracks: [track, ...state.savedTracks],
          }));
        }
      },

      removeFromLibrary: (trackId) => {
        set((state) => ({
          savedTracks: state.savedTracks.filter((t) => t.id !== trackId),
        }));
      },

      isInLibrary: (trackId) => {
        return get().savedTracks.some((t) => t.id === trackId);
      },

      addToRecentlyPlayed: (track) => {
        set((state) => {
          const filtered = state.recentlyPlayed.filter(
            (t) => t.id !== track.id,
          );
          return {
            recentlyPlayed: [track, ...filtered].slice(0, 50),
          };
        });
      },

      clearRecentlyPlayed: () => set({ recentlyPlayed: [] }),
    }),
    {
      name: "library-storage",
      storage: {
        getItem: async (name) => {
          const str = await AsyncStorage.getItem(name);
          return str ? JSON.parse(str) : null;
        },
        setItem: async (name, value) => {
          await AsyncStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: async (name) => {
          await AsyncStorage.removeItem(name);
        },
      },
    },
  ),
);
