import { ArchiveTrack } from "@/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface LibraryState {
  savedTracks: ArchiveTrack[];
  likedTrackIds: string[];
  recentlyPlayed: ArchiveTrack[];
  playCounts: Record<string, number>;
  addToLibrary: (track: ArchiveTrack) => void;
  removeFromLibrary: (trackId: string) => void;
  isInLibrary: (trackId: string) => boolean;
  toggleLike: (track: ArchiveTrack) => void;
  isLiked: (trackId: string) => boolean;
  addToRecentlyPlayed: (track: ArchiveTrack) => void;
  clearRecentlyPlayed: () => void;
}

export const useLibraryStore = create<LibraryState>()(
  persist(
    (set, get) => ({
      savedTracks: [],
      likedTrackIds: [],
      recentlyPlayed: [],
      playCounts: {},

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
          likedTrackIds: state.likedTrackIds.filter((id) => id !== trackId),
        }));
      },

      isInLibrary: (trackId) => {
        return get().savedTracks.some((t) => t.id === trackId);
      },

      toggleLike: (track) => {
        set((state) => {
          const isLiked = state.likedTrackIds.includes(track.id);
          if (isLiked) {
            return {
              likedTrackIds: state.likedTrackIds.filter((id) => id !== track.id),
            };
          } else {
            // Also ensure track metadata is saved so it shows up in "Liked" tab
            const inLibrary = state.savedTracks.some((t) => t.id === track.id);
            return {
              likedTrackIds: [...state.likedTrackIds, track.id],
              savedTracks: inLibrary ? state.savedTracks : [track, ...state.savedTracks],
            };
          }
        });
      },

      isLiked: (trackId) => {
        return get().likedTrackIds.includes(trackId);
      },

      addToRecentlyPlayed: (track) => {
        set((state) => {
          const filtered = state.recentlyPlayed.filter(
            (t) => t.id !== track.id,
          );
          const newCounts = { ...state.playCounts };
          newCounts[track.id] = (newCounts[track.id] || 0) + 1;

          return {
            recentlyPlayed: [track, ...filtered].slice(0, 50),
            playCounts: newCounts,
          };
        });
      },

      clearRecentlyPlayed: () => set({ recentlyPlayed: [], playCounts: {} }),
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
