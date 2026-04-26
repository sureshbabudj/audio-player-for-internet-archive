import { useLibraryStore } from "@/store/useLibraryStore";
import { ArchiveTrack, RepeatMode } from "@/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  useAudioPlaylist,
  useAudioPlaylistStatus,
  type AudioPlaylist,
} from "expo-audio";
import { useEffect, useMemo, useRef } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface PlayerState {
  // Native Object
  player: AudioPlaylist | null;
  setPlayer: (player: AudioPlaylist) => void;

  // Track State
  currentTrack: ArchiveTrack | null;
  queue: ArchiveTrack[];
  queueTitle: string;
  currentIndex: number;
  originalQueue: ArchiveTrack[]; // Store original order for un-shuffling

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
  loadQueue: (
    tracks: ArchiveTrack[],
    startIndex?: number,
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
  resetPlayer: () => void;

  // Internal Sync
  setPlaybackStatus: (status: any) => void;
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      player: null,
      currentTrack: null,
      queue: [],
      originalQueue: [],
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

      loadQueue: async (tracks, startIndex = 0, title = "Playlist") => {
        const { player, volume, playbackSpeed, repeatMode } = get();

        set({
          queue: tracks,
          queueTitle: title,
          currentIndex: startIndex,
          currentTrack: tracks[startIndex] || null,
        });

        if (player) {
          player.clear();
          tracks.forEach((t) => {
            player.add({
              uri: t.url,
              name: t.title,
            });
          });

          player.volume = volume;
          player.playbackRate = playbackSpeed;
          
          // Apply repeat mode
          const nativeMode = repeatMode === "off" ? "none" : repeatMode === "one" ? "single" : "all";
          player.loop = nativeMode;

          player.skipTo(startIndex);
          player.play();
        }

        if (tracks[startIndex]) {
          useLibraryStore.getState().addToRecentlyPlayed(tracks[startIndex]);
        }
      },

      loadTrack: async (track, queue = [], title = "Now Playing") => {
        const fullQueue = queue.length > 0 ? queue : [track];
        const trackIndex = fullQueue.findIndex((t) => t.id === track.id);
        const targetIndex = trackIndex >= 0 ? trackIndex : 0;

        await get().loadQueue(fullQueue, targetIndex, title);
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
        const { player } = get();
        player?.next();
      },

      skipPrevious: () => {
        const { player, position } = get();
        if (position > 3000) {
          player?.seekTo(0);
          return;
        }
        player?.previous();
      },

      playFromQueue: (index) => {
        const { player } = get();
        if (player) {
          player.skipTo(index);
          player.play();
        }
      },

      setRepeatMode: (mode) => {
        const { player } = get();
        if (player) {
          const nativeMode =
            mode === "off" ? "none" : mode === "one" ? "single" : "all";
          player.loop = nativeMode;
        }
        set({ repeatMode: mode });
      },

      toggleShuffle: () => {
        const { isShuffled, queue, originalQueue, currentTrack, player } = get();
        const newShuffleState = !isShuffled;

        if (newShuffleState) {
          // Enabling Shuffle
          const currentOrder = [...queue];
          const trackToKeep = currentTrack;
          
          // Create shuffled queue but keep current track at current index to avoid interruption
          const otherTracks = currentOrder.filter(t => t.id !== trackToKeep?.id);
          const shuffledOthers = [...otherTracks].sort(() => Math.random() - 0.5);
          
          // Rebuild queue with current track at its current position if possible
          const currentIndex = queue.findIndex(t => t.id === trackToKeep?.id);
          const newQueue = [...shuffledOthers];
          if (currentIndex >= 0 && trackToKeep) {
            newQueue.splice(currentIndex, 0, trackToKeep);
          }

          set({ 
            isShuffled: true, 
            originalQueue: currentOrder,
            queue: newQueue 
          });

          // Sync with native player
          if (player) {
            player.clear();
            newQueue.forEach(t => player.add({ uri: t.url, name: t.title }));
            if (currentIndex >= 0) player.skipTo(currentIndex);
            player.play();
          }
        } else {
          // Disabling Shuffle - Revert to original order
          const trackToKeep = currentTrack;
          const newIndex = originalQueue.findIndex(t => t.id === trackToKeep?.id);
          
          set({ 
            isShuffled: false, 
            queue: originalQueue,
            currentIndex: newIndex >= 0 ? newIndex : 0
          });

          // Sync with native player
          if (player) {
            player.clear();
            originalQueue.forEach(t => player.add({ uri: t.url, name: t.title }));
            if (newIndex >= 0) player.skipTo(newIndex);
            player.play();
          }
        }
      },

      setVolume: (vol) => {
        const { player } = get();
        if (player) player.volume = vol;
        set({ volume: vol });
      },

      setPlaybackSpeed: (speed) => {
        const { player } = get();
        if (player) player.playbackRate = speed;
        set({ playbackSpeed: speed });
      },

      resetPlayer: () => {
        const { player } = get();
        if (player) {
          player.pause();
          player.clear();
        }
        set({
          currentTrack: null,
          queue: [],
          queueTitle: "",
          currentIndex: 0,
          isPlaying: false,
          position: 0,
          duration: 0,
        });
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

/**
 * Hook to initialize and sync the native player with the store.
 * Call this once in the root layout.
 */
export const useInitializePlayer = () => {
  const setPlayer = usePlayerStore((state) => state.setPlayer);
  const setPlaybackStatus = usePlayerStore((state) => state.setPlaybackStatus);
  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const isHydrated = useRef(false);

  // Get initial sources from persisted queue
  // We use useMemo to ensure this only runs once on mount
  const initialSources = useMemo(() => {
    const queue = usePlayerStore.getState().queue;
    return queue.map((t) => ({
      uri: t.url,
      name: t.title,
    }));
  }, []);

  const player = useAudioPlaylist({
    sources: initialSources,
  });
  const status = useAudioPlaylistStatus(player);

  // Sync player object and handle hydration
  useEffect(() => {
    setPlayer(player);

    if (!isHydrated.current && currentTrack?.url) {
      const targetIndex = usePlayerStore.getState().currentIndex;
      // Small delay to ensure native player is ready
      setTimeout(() => {
        // Apply current settings
      player.volume = usePlayerStore.getState().volume;
      player.playbackRate = usePlayerStore.getState().playbackSpeed;
      const repeatMode = usePlayerStore.getState().repeatMode;
      const nativeMode = repeatMode === "off" ? "none" : repeatMode === "one" ? "single" : "all";
      player.loop = nativeMode;

      player.skipTo(targetIndex);
      }, 100);
      isHydrated.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player]);

  // Sync status and track changes back to store
  useEffect(() => {
    setPlaybackStatus(status);

    const state = usePlayerStore.getState();
    const currentTrackFromQueue = state.queue[status.currentIndex];

    if (
      currentTrackFromQueue &&
      currentTrackFromQueue.id !== state.currentTrack?.id
    ) {
      usePlayerStore.setState({
        currentTrack: currentTrackFromQueue,
        currentIndex: status.currentIndex,
      });
      useLibraryStore.getState().addToRecentlyPlayed(currentTrackFromQueue);

      // Update Lock Screen Metadata if track changed
      if (player && (player as any).updateLockScreenMetadata) {
        (player as any).updateLockScreenMetadata({
          title: currentTrackFromQueue.title,
          artist: currentTrackFromQueue.creator || "Unknown Artist",
          artworkUrl:
            currentTrackFromQueue.thumbnail ||
            `https://archive.org/services/img/${currentTrackFromQueue.identifier}`,
        });
      }
    }
  }, [status, setPlaybackStatus, player]);

  // Initial Lock Screen Activation
  useEffect(() => {
    if (player && currentTrack && (player as any).setActiveForLockScreen) {
      (player as any).setActiveForLockScreen(
        true,
        {
          title: currentTrack.title,
          artist: currentTrack.creator || "Unknown Artist",
          artworkUrl:
            currentTrack.thumbnail ||
            `https://archive.org/services/img/${currentTrack.identifier}`,
        },
        {
          showSeekBackward: true,
          showSeekForward: true,
        },
      );
    }
  }, [player, currentTrack]);

  return { player, status };
};
