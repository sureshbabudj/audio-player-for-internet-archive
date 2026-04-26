import { useLibraryStore } from "@/store/useLibraryStore";
import { ArchiveTrack, RepeatMode } from "@/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createAudioPlayer,
  preload,
  setAudioModeAsync,
  useAudioPlayerStatus,
  type AudioPlayer,
} from "expo-audio";
import { useEffect, useRef } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import ExpoAudioControls from "../../modules/expo-audio-controls";

interface PlayerState {
  // Native Object
  player: AudioPlayer;

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
  isInternalStateChange: boolean; // Flag to prevent sync flickers during reordering

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
  preloadNext: () => void;

  // Internal Sync
  setPlaybackStatus: (status: any) => void;
}

// Global Player Singleton for stability
const globalPlayer = createAudioPlayer(null, {
  updateInterval: 500,
  keepAudioSessionActive: true,
});

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      player: globalPlayer,
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
      isInternalStateChange: false,

      setPlaybackStatus: (status) => {
        const state = get();
        if (!state.player || state.isInternalStateChange) return;

        const updates: Partial<PlayerState> = {
          isPlaying: status.playing,
          isBuffering: status.isBuffering,
          position: Math.floor((status.currentTime || 0) * 1000),
          duration: Math.floor((status.duration || 0) * 1000),
        };

        set(updates);
      },

      loadQueue: async (tracks, startIndex = 0, title = "Playlist") => {
        const { player, volume, playbackSpeed } = get();
        const track = tracks[startIndex];
        if (!track) return;

        set({
          queue: tracks,
          originalQueue: [...tracks],
          currentIndex: startIndex,
          currentTrack: track,
          queueTitle: title,
          isShuffled: false,
        });

        if (player) {
          try {
            player.replace(track.url);
          } catch (e) {
            console.error("Replace error", e);
          }
          player.play();
          player.volume = volume;
          player.setPlaybackRate(playbackSpeed);
          get().preloadNext();
        }

        useLibraryStore.getState().addToRecentlyPlayed(track);
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
        const { currentIndex, queue, repeatMode } = get();
        let nextIndex = currentIndex + 1;

        if (nextIndex >= queue.length) {
          if (repeatMode === "all") {
            nextIndex = 0;
          } else {
            return;
          }
        }
        get().playFromQueue(nextIndex);
      },

      skipPrevious: () => {
        const { currentIndex, queue, position, repeatMode } = get();
        if (position > 3000) {
          get().seekTo(0);
          return;
        }

        let prevIndex = currentIndex - 1;
        if (prevIndex < 0) {
          if (repeatMode === "all") {
            prevIndex = queue.length - 1;
          } else {
            return;
          }
        }
        get().playFromQueue(prevIndex);
      },

      playFromQueue: async (index) => {
        const { player, queue, volume, playbackSpeed } = get();
        const track = queue[index];
        if (!track) return;

        set({ currentIndex: index, currentTrack: track });

        if (player) {
          try {
            player.replace(track.url);
          } catch (e) {
            console.error("Replace error", e);
          }
          player.play();
          player.volume = volume;
          player.setPlaybackRate(playbackSpeed);
          get().preloadNext();
        }

        useLibraryStore.getState().addToRecentlyPlayed(track);
      },

      setRepeatMode: (mode) => {
        const { player } = get();
        if (player) {
          player.loop = mode === "one";
        }
        set({ repeatMode: mode });
      },

      toggleShuffle: () => {
        const { isShuffled, queue, originalQueue, currentTrack } = get();
        const newShuffleState = !isShuffled;

        if (newShuffleState) {
          // Enabling Shuffle
          const currentOrder = [...queue];
          const trackToKeep = currentTrack;

          const otherTracks = currentOrder.filter(
            (t) => t.id !== trackToKeep?.id,
          );
          const shuffledOthers = [...otherTracks].sort(
            () => Math.random() - 0.5,
          );

          const newQueue = trackToKeep
            ? [trackToKeep, ...shuffledOthers]
            : shuffledOthers;

          set({
            isShuffled: true,
            originalQueue: currentOrder,
            queue: newQueue,
            currentIndex: 0,
          });
        } else {
          // Disabling Shuffle - Revert to original order
          const trackToKeep = currentTrack;
          const newIndex = originalQueue.findIndex(
            (t) => t.id === trackToKeep?.id,
          );
          const targetIndex = newIndex >= 0 ? newIndex : 0;

          set({
            isShuffled: false,
            queue: [...originalQueue],
            currentIndex: targetIndex,
          });
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
      preloadNext: () => {
        const { currentIndex, queue } = get();
        const nextIndex = currentIndex + 1;
        if (nextIndex < queue.length) {
          const nextTrack = queue[nextIndex];
          preload(nextTrack.url);
        }
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
  const { currentTrack, player, setPlaybackStatus, volume, playbackSpeed } =
    usePlayerStore();
  const isHydrated = useRef(false);

  // Use the singleton status
  const status = useAudioPlayerStatus(player);

  // Sync player object and handle hydration
  useEffect(() => {
    // Configure audio mode for lock screen
    setAudioModeAsync({
      interruptionMode: "doNotMix",
      playsInSilentMode: true,
      shouldRouteThroughEarpiece: false,
    }).catch(console.error);

    if (!isHydrated.current && currentTrack?.url) {
      // Small delay to ensure native player is ready
      setTimeout(() => {
        player.replace(currentTrack.url);
        player.volume = volume;
        player.setPlaybackRate(playbackSpeed);
        isHydrated.current = true;
      }, 500);
    } else {
      isHydrated.current = true;
    }

    // Initialize native listeners
    let nextSub: any;
    let prevSub: any;

    try {
      if (ExpoAudioControls) {
        ExpoAudioControls.setupRemoteControls();
        nextSub = ExpoAudioControls.addListener("onNextTrack", () => {
          usePlayerStore.getState().skipNext();
        });
        prevSub = ExpoAudioControls.addListener("onPreviousTrack", () => {
          usePlayerStore.getState().skipPrevious();
        });
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      console.warn("Custom AudioControls module not found, skipping setup.");
    }

    return () => {
      nextSub?.remove();
      prevSub?.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync status and handle finish/lockscreen
  useEffect(() => {
    if (!isHydrated.current) return;
    setPlaybackStatus(status);

    // Update Lock Screen
    if (player && currentTrack && status.isLoaded) {
      player.setActiveForLockScreen(
        true,
        {
          title: currentTrack.title,
          artist: currentTrack.creator || "Unknown Artist",
          artworkUrl:
            currentTrack.thumbnail ||
            `https://archive.org/services/img/${currentTrack.identifier}`,
        },
        {
          showSeekBackward: false,
          showSeekForward: false,
        },
      );
    }

    if (status.didJustFinish) {
      usePlayerStore.getState().skipNext();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, setPlaybackStatus, currentTrack]);

  // Setup Remote Media Controls (Next/Previous)
  useEffect(() => {
    let isMounted = true;

    async function initRemoteControls() {
      try {
        await ExpoAudioControls.setupRemoteControls();
      } catch (e) {
        console.error("Failed to setup remote controls:", e);
      }
    }

    initRemoteControls();

    const nextSub = ExpoAudioControls.addListener("onNextTrack", () => {
      if (isMounted) {
        usePlayerStore.getState().skipNext();
      }
    });

    const prevSub = ExpoAudioControls.addListener("onPreviousTrack", () => {
      if (isMounted) {
        usePlayerStore.getState().skipPrevious();
      }
    });

    return () => {
      isMounted = false;
      nextSub.remove();
      prevSub.remove();
    };
  }, []);

  return { player, status };
};
