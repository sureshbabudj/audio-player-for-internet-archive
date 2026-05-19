/* eslint-disable @typescript-eslint/no-require-imports */
import { ArchiveItem, ArchiveTrack, Collection } from "@/types";
import { analytics } from "@/utils/analytics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface LibraryState {
  collections: Collection[];
  likedTracks: ArchiveTrack[];
  likedTrackIds: string[];
  recentlyPlayed: ArchiveTrack[];
  playCounts: Record<string, number>;
  hasCompletedOnboarding?: boolean;

  addCollection: (item: ArchiveItem, tracks: ArchiveTrack[]) => void;
  removeCollection: (collectionId: string) => void;
  addToLibrary: (track: ArchiveTrack) => void; // Single track add (fallback)
  removeFromLibrary: (trackId: string) => void;
  toggleLike: (track: ArchiveTrack) => void;
  isLiked: (trackId: string) => boolean;
  addToRecentlyPlayed: (track: ArchiveTrack) => void;
  clearRecentlyPlayed: () => void;
  clearLibrary: () => void;
  importLibrary: (data: any) => void;
  updateTrackMetadata: (
    trackId: string,
    updates: Partial<ArchiveTrack>,
  ) => void;
  setHasCompletedOnboarding: (val: boolean) => void;
}

export const useLibraryStore = create<LibraryState>()(
  persist(
    (set, get) => ({
      collections: [],
      likedTracks: [],
      likedTrackIds: [],
      recentlyPlayed: [],
      playCounts: {},
      hasCompletedOnboarding: false,
      setHasCompletedOnboarding: (val) => set({ hasCompletedOnboarding: val }),

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
            analytics.track("track_unliked", {
              track_id: track.id,
              track_title: track.title,
              artist: track.creator,
            });
            return {
              likedTrackIds: state.likedTrackIds.filter(
                (id) => id !== track.id,
              ),
              likedTracks: state.likedTracks.filter((t) => t.id !== track.id),
            };
          } else {
            analytics.track("track_liked", {
              track_id: track.id,
              track_title: track.title,
              artist: track.creator,
            });
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

      importLibrary: (data) => {
        if (!data || typeof data !== "object") return;
        set({
          collections: data.collections || [],
          likedTracks: data.likedTracks || [],
          likedTrackIds:
            data.likedTrackIds ||
            (data.likedTracks || []).map((t: any) => t.id),
          recentlyPlayed: data.recentlyPlayed || [],
          playCounts: data.playCounts || {},
        });
      },

      updateTrackMetadata: (trackId, updates) => {
        set((state) => {
          const updateTrack = (t: ArchiveTrack) =>
            t.id === trackId ? { ...t, ...updates } : t;

          return {
            recentlyPlayed: state.recentlyPlayed.map(updateTrack),
            likedTracks: state.likedTracks.map(updateTrack),
            collections: state.collections.map((c) => ({
              ...c,
              tracks: c.tracks.map(updateTrack),
            })),
          };
        });

        // 2. Update Playlist Store (using require to avoid circular dependencies)
        try {
          const { usePlaylistStore } = require("./usePlaylistStore");
          usePlaylistStore.setState((state: any) => ({
            playlists: state.playlists.map((p: any) => ({
              ...p,
              tracks: p.tracks.map((t: any) =>
                t.id === trackId ? { ...t, ...updates } : t,
              ),
            })),
          }));
        } catch (e) {
          console.warn("Failed to update playlists metadata:", e);
        }

        // 3. Update Player Store (using require to avoid circular dependencies)
        try {
          const { usePlayerStore } = require("./usePlayerStore");
          usePlayerStore.setState((state: any) => {
            const updateTrack = (t: any) =>
              t && t.id === trackId ? { ...t, ...updates } : t;

            return {
              currentTrack:
                state.currentTrack && state.currentTrack.id === trackId
                  ? { ...state.currentTrack, ...updates }
                  : state.currentTrack,
              queue: state.queue ? state.queue.map(updateTrack) : [],
            };
          });
        } catch (e) {
          console.warn("Failed to update player metadata:", e);
        }
      },
    }),
    {
      name: "library-storage",
      storage: {
        getItem: async (name) => {
          const str = await AsyncStorage.getItem(name);
          if (!str) return null;
          try {
            const data = JSON.parse(str);
            if (Platform.OS === "web" && data?.state) {
              const cleanWebTrack = (track: any) => {
                if (!track) return track;
                if (
                  track.thumbnail &&
                  (track.thumbnail.startsWith("data:") ||
                    track.thumbnail.startsWith("blob:"))
                ) {
                  return {
                    ...track,
                    thumbnail: `https://archive.org/services/img/${track.identifier}`,
                  };
                }
                return track;
              };

              let changed = false;
              if (Array.isArray(data.state.likedTracks)) {
                data.state.likedTracks = data.state.likedTracks.map(
                  (t: any) => {
                    const cleaned = cleanWebTrack(t);
                    if (cleaned !== t) changed = true;
                    return cleaned;
                  },
                );
              }
              if (Array.isArray(data.state.recentlyPlayed)) {
                data.state.recentlyPlayed = data.state.recentlyPlayed.map(
                  (t: any) => {
                    const cleaned = cleanWebTrack(t);
                    if (cleaned !== t) changed = true;
                    return cleaned;
                  },
                );
              }
              if (Array.isArray(data.state.collections)) {
                data.state.collections = data.state.collections.map(
                  (col: any) => {
                    if (Array.isArray(col.tracks)) {
                      const tracksCleaned = col.tracks.map((t: any) => {
                        const cleaned = cleanWebTrack(t);
                        if (cleaned !== t) changed = true;
                        return cleaned;
                      });
                      return { ...col, tracks: tracksCleaned };
                    }
                    return col;
                  },
                );
              }
              if (changed) {
                await AsyncStorage.setItem(name, JSON.stringify(data));
              }
            }
            return data;
          } catch {
            return null;
          }
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
