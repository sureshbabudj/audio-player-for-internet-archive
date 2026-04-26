import { useLibraryStore } from "@/store/useLibraryStore";
import { ArchiveTrack, RepeatMode } from "@/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { type AudioPlayer } from "expo-audio";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface PlayerState {
  // Native Object
  player: AudioPlayer | null;
  setPlayer: (player: AudioPlayer) => void;

  // Track State
  currentTrack: ArchiveTrack | null;
  queue: ArchiveTrack[];
  queueTitle: string;
  currentIndex: number;

  // UI Sync
  isPlaying: boolean;
  isBuffering: boolean;
  position: number;
  duration: number;
  volume: number;
  playbackSpeed: number;
  repeatMode: RepeatMode;
  isShuffled: boolean;

  // Actions
  loadTrack: (
    track: ArchiveTrack,
    queue?: ArchiveTrack[],
    title?: string,
  ) => Promise<void>;
  togglePlayPause: () => void;
  seekTo: (position: number) => Promise<void>;
  skipNext: () => void;
  skipPrevious: () => void;
  playFromQueue: (index: number) => void;
  setRepeatMode: (mode: RepeatMode) => void;
  toggleShuffle: () => void;
  setVolume: (vol: number) => void;
  setPlaybackSpeed: (speed: number) => void;

  // Internal Sync
  setPlaybackStatus: (status: any) => void;
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      player: null,
      currentTrack: null,
      queue: [],
      queueTitle: "",
      currentIndex: 0,
      isPlaying: false,
      isBuffering: false,
      position: 0,
      duration: 0,
      volume: 1,
      playbackSpeed: 1,
      repeatMode: "off",
      isShuffled: false,

      setPlayer: (player) => set({ player }),

      setPlaybackStatus: (status) => {
        set({
          isPlaying: status.playing,
          isBuffering: status.isBuffering,
          position: Math.floor((status.currentTime || 0) * 1000),
          duration: Math.floor((status.duration || 0) * 1000),
        });
      },

      loadTrack: async (track, queue = [], title = "Now Playing") => {
        const newQueue = queue.length > 0 ? queue : [track];
        const trackIndex = newQueue.findIndex((t) => t.id === track.id);
        const targetIndex = trackIndex >= 0 ? trackIndex : 0;

        set({
          currentTrack: track,
          queue: newQueue,
          queueTitle: title,
          currentIndex: targetIndex,
        });

        useLibraryStore.getState().addToRecentlyPlayed(track);
      },

      togglePlayPause: () => {
        const { player } = get();
        if (!player) return;
        if (player.playing) {
          player.pause();
        } else {
          player.play();
        }
      },

      seekTo: async (position) => {
        const { player } = get();
        if (player) {
          player.seekTo(position / 1000);
        }
      },

      skipNext: () => {
        const { queue, currentIndex, loadTrack, queueTitle } = get();
        if (queue.length === 0) return;
        const nextIndex = (currentIndex + 1) % queue.length;
        loadTrack(queue[nextIndex], queue, queueTitle);
      },

      skipPrevious: () => {
        const { queue, currentIndex, loadTrack, queueTitle, position } = get();
        if (queue.length === 0) return;

        if (position > 3000) {
          get().player?.seekTo(0);
          return;
        }

        const prevIndex = (currentIndex - 1 + queue.length) % queue.length;
        loadTrack(queue[prevIndex], queue, queueTitle);
      },

      playFromQueue: (index) => {
        const { queue, loadTrack, queueTitle } = get();
        if (queue[index]) {
          loadTrack(queue[index], queue, queueTitle);
        }
      },

      setRepeatMode: (mode) => set({ repeatMode: mode }),
      toggleShuffle: () => set((state) => ({ isShuffled: !state.isShuffled })),

      setVolume: (vol) => {
        const { player } = get();
        if (player) player.volume = vol;
        set({ volume: vol });
      },

      setPlaybackSpeed: (speed) => {
        const { player } = get();
        if (player) player.setPlaybackRate(speed);
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
