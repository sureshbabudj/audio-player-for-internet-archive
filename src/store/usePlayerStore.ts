import { useLibraryStore } from "@/store/useLibraryStore";
import { ArchiveTrack, RepeatMode } from "@/types";
import { AudioService } from "@/utils/audioService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { type AudioPlaylist } from "expo-audio";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface PlayerState {
  // Native Object
  playlist: AudioPlaylist | null;
  setPlaylist: (playlist: AudioPlaylist) => void;

  // Track State
  currentTrack: ArchiveTrack | null;
  queue: ArchiveTrack[];
  queueTitle: string;
  currentIndex: number;
  
  // UI Sync (for non-hook access)
  isPlaying: boolean;
  isShuffled: boolean;
  volume: number;
  playbackSpeed: number;
  repeatMode: RepeatMode;

  // Actions
  loadTrack: (
    track: ArchiveTrack,
    queue?: ArchiveTrack[],
    title?: string,
  ) => Promise<void>;
  togglePlayPause: () => void;
  toggleShuffle: () => void;
  seekTo: (position: number) => Promise<void>;
  skipNext: () => void;
  skipPrevious: () => void;
  playFromQueue: (index: number) => void;
  setRepeatMode: (mode: RepeatMode) => void;
  setVolume: (vol: number) => void;
  setPlaybackSpeed: (speed: number) => void;
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      playlist: null,
      currentTrack: null,
      queue: [],
      queueTitle: "",
      currentIndex: 0,
      isPlaying: false,
      isShuffled: false,
      volume: 1,
      playbackSpeed: 1,
      repeatMode: "off",

      setPlaylist: (playlist) => {
        set({ playlist });
        // Auto-sync saved state to the new native playlist instance on cold start
        const state = get();
        if (state.queue.length > 0 && playlist.sources.length === 0) {
          playlist.clear();
          state.queue.forEach((t) => {
            playlist.add({
              uri: t.url,
              name: `${t.title} - ${t.creator}`,
            });
          });
          playlist.volume = state.volume;
          playlist.playbackRate = state.playbackSpeed;
          playlist.skipTo(state.currentIndex);
          playlist.loop = state.repeatMode === "all" ? "all" : state.repeatMode === "one" ? "single" : "none";
        }
      },

      loadTrack: async (track, queue = [], title = "Now Playing") => {
        const { playlist, volume, playbackSpeed, isShuffled } = get();
        if (!playlist) return;

        let newQueue = queue.length > 0 ? queue : [track];
        
        // Handle Shuffle on load if enabled
        if (isShuffled) {
          // Keep current track at index 0 or similar logic?
          // For now just shuffle the rest.
        }

        const trackIndex = newQueue.findIndex((t) => t.id === track.id);
        const targetIndex = trackIndex >= 0 ? trackIndex : 0;

        set({
          currentTrack: track,
          queue: newQueue,
          queueTitle: title,
          currentIndex: targetIndex,
        });

        // Sync to native playlist
        playlist.clear();
        newQueue.forEach(t => {
          playlist.add({
            uri: t.url,
            name: `${t.title} - ${t.creator}`
          });
        });

        playlist.volume = volume;
        playlist.playbackRate = playbackSpeed;
        playlist.skipTo(targetIndex);
        playlist.play();

        useLibraryStore.getState().addToRecentlyPlayed(track);
      },

      togglePlayPause: () => {
        const { playlist } = get();
        if (!playlist) return;
        if (playlist.playing) {
          playlist.pause();
        } else {
          playlist.play();
        }
      },

      toggleShuffle: () => set((state) => ({ isShuffled: !state.isShuffled })),

      seekTo: async (position) => {
        const { playlist } = get();
        if (playlist) {
          await playlist.seekTo(position / 1000);
        }
      },

      skipNext: () => {
        const { playlist } = get();
        playlist?.next();
      },

      skipPrevious: () => {
        const { playlist } = get();
        playlist?.previous();
      },

      playFromQueue: (index) => {
        const { playlist, queue } = get();
        if (!playlist || !queue[index]) return;
        
        set({ 
          currentIndex: index,
          currentTrack: queue[index]
        });
        playlist.skipTo(index);
        playlist.play();
      },

      setRepeatMode: (mode) => {
        const { playlist } = get();
        if (playlist) {
          playlist.loop = mode === "all" ? "all" : mode === "one" ? "single" : "none";
        }
        set({ repeatMode: mode });
      },

      setVolume: (vol) => {
        const { playlist } = get();
        if (playlist) playlist.volume = vol;
        set({ volume: vol });
      },

      setPlaybackSpeed: (speed) => {
        const { playlist } = get();
        if (playlist) playlist.playbackRate = speed;
        set({ playbackSpeed: speed });
      },
    }),
    {
      name: "player-storage",
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
      partialize: (state: PlayerState): any => ({
        currentTrack: state.currentTrack,
        queue: state.queue,
        queueTitle: state.queueTitle,
        currentIndex: state.currentIndex,
        repeatMode: state.repeatMode,
        isShuffled: state.isShuffled,
        volume: state.volume,
        playbackSpeed: state.playbackSpeed,
      }),
    },
  ),
);
