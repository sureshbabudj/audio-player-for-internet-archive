import { ArchiveItem, ArchiveTrack } from "@/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface Collection {
  id: string;
  title: string;
  creator: string;
  thumbnail: string;
  tracks: ArchiveTrack[];
  addedAt: number;
}

interface LibraryState {
  collections: Collection[];
  likedTracks: ArchiveTrack[];
  likedTrackIds: string[];
  recentlyPlayed: ArchiveTrack[];
  playCounts: Record<string, number>;

  addCollection: (item: ArchiveItem, tracks: ArchiveTrack[]) => void;
  removeCollection: (collectionId: string) => void;
  addToLibrary: (track: ArchiveTrack) => void; // Single track add (fallback)
  removeFromLibrary: (trackId: string) => void;
  toggleLike: (track: ArchiveTrack) => void;
  isLiked: (trackId: string) => boolean;
  addToRecentlyPlayed: (track: ArchiveTrack) => void;
  clearRecentlyPlayed: () => void;
  clearLibrary: () => void;
}

export const useLibraryStore = create<LibraryState>()(
  persist(
    (set, get) => ({
      collections: [],
      likedTracks: [],
      likedTrackIds: [],
      recentlyPlayed: [],
      playCounts: {},

      addCollection: (item, tracks) => {
        set((state) => {
          const existingIndex = state.collections.findIndex(
            (c) => c.id === item.identifier,
          );
          const newCollection: Collection = {
            id: item.identifier,
            title: item.title,
            creator: item.creator,
            thumbnail: item.thumbnail || "",
            tracks: tracks,
            addedAt: Date.now(),
          };

          if (existingIndex >= 0) {
            const newCollections = [...state.collections];
            newCollections[existingIndex] = newCollection;
            return { collections: newCollections };
          }
          return { collections: [newCollection, ...state.collections] };
        });
      },

      removeCollection: (collectionId) => {
        set((state) => ({
          collections: state.collections.filter((c) => c.id !== collectionId),
        }));
      },

      addToLibrary: (track) => {
        // Find existing collection or create a dummy one for the track
        const { collections } = get();
        const existing = collections.find((c) => c.id === track.identifier);

        if (existing) {
          if (!existing.tracks.some((t) => t.id === track.id)) {
            const updated = {
              ...existing,
              tracks: [...existing.tracks, track],
            };
            set((state) => ({
              collections: state.collections.map((c) =>
                c.id === track.identifier ? updated : c,
              ),
            }));
          }
        } else {
          get().addCollection(
            {
              identifier: track.identifier,
              title: track.title, // Use track title as collection title if unknown
              creator: track.creator,
              thumbnail: track.thumbnail || "",
            } as any,
            [track],
          );
        }
      },

      removeFromLibrary: (trackId) => {
        set((state) => ({
          collections: state.collections
            .map((c) => ({
              ...c,
              tracks: c.tracks.filter((t) => t.id !== trackId),
            }))
            .filter((c) => c.tracks.length > 0),
          likedTrackIds: state.likedTrackIds.filter((id) => id !== trackId),
          likedTracks: state.likedTracks.filter((t) => t.id !== trackId),
        }));
      },

      toggleLike: (track) => {
        set((state) => {
          const isLiked = state.likedTrackIds.includes(track.id);
          if (isLiked) {
            return {
              likedTrackIds: state.likedTrackIds.filter(
                (id) => id !== track.id,
              ),
              likedTracks: state.likedTracks.filter(
                (t) => t.id !== track.id,
              ),
            };
          } else {
            return {
              likedTrackIds: [...state.likedTrackIds, track.id],
              likedTracks: [track, ...state.likedTracks],
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

      clearLibrary: () =>
        set({
          collections: [],
          likedTracks: [],
          likedTrackIds: [],
          recentlyPlayed: [],
          playCounts: {},
        }),
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
