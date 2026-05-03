import { PLAYLIST_COLORS } from "@/constants/colors";
import { ArchiveTrack, Playlist } from "@/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface PlaylistState {
  playlists: Playlist[];
  selectorVisible: boolean;
  trackToSelect: ArchiveTrack | null;
  createPlaylist: (name: string, description?: string) => string;
  deletePlaylist: (id: string) => void;
  addTrackToPlaylist: (playlistId: string, track: ArchiveTrack) => void;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => void;
  updatePlaylist: (id: string, updates: Partial<Playlist>) => void;
  getPlaylist: (id: string) => Playlist | undefined;
  openSelector: (track: ArchiveTrack) => void;
  closeSelector: () => void;
}

export const usePlaylistStore = create<PlaylistState>()(
  persist(
    (set, get) => ({
      playlists: [],
      selectorVisible: false,
      trackToSelect: null,

      createPlaylist: (name, description) => {
        const id = `playlist_${Date.now()}`;
        const color =
          PLAYLIST_COLORS[Math.floor(Math.random() * PLAYLIST_COLORS.length)];

        const newPlaylist: Playlist = {
          id,
          name,
          description,
          tracks: [],
          createdAt: Date.now(),
          color,
          icon: "music",
        };

        set((state) => ({
          playlists: [...state.playlists, newPlaylist],
        }));

        return id;
      },

      deletePlaylist: (id) => {
        set((state) => ({
          playlists: state.playlists.filter((p) => p.id !== id),
        }));
      },

      addTrackToPlaylist: (playlistId, track) => {
        set((state) => ({
          playlists: state.playlists.map((p) => {
            if (p.id === playlistId) {
              if (p.tracks.some((t) => t.id === track.id)) return p;
              return { ...p, tracks: [...p.tracks, track] };
            }
            return p;
          }),
        }));
      },

      removeTrackFromPlaylist: (playlistId, trackId) => {
        set((state) => ({
          playlists: state.playlists.map((p) => {
            if (p.id === playlistId) {
              return { ...p, tracks: p.tracks.filter((t) => t.id !== trackId) };
            }
            return p;
          }),
        }));
      },

      updatePlaylist: (id, updates) => {
        set((state) => ({
          playlists: state.playlists.map((p) =>
            p.id === id ? { ...p, ...updates } : p,
          ),
        }));
      },

      getPlaylist: (id) => {
        return get().playlists.find((p) => p.id === id);
      },

      openSelector: (track) =>
        set({ selectorVisible: true, trackToSelect: track }),
      closeSelector: () => set({ selectorVisible: false, trackToSelect: null }),
    }),
    {
      name: "playlist-storage",
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
      partialize: (state: PlaylistState): any => ({
        playlists: state.playlists,
      }),
    },
  ),
);
