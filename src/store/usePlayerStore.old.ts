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
  player: AudioPlayer | null;

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

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      player: createAudioPlayer(null, {
        updateInterval: 500,
        keepAudioSessionActive: true,
      }),
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

        get().playFromQueue(startIndex);
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

        // Clean up previous player properly
        if (player) {
          try {
            player.pause();
            player.remove();
          } catch (e) {
            console.error("Player cleanup error:", e);
          }
        }

        // Create fresh player to avoid native SDK 55 'replace' bug
        const newPlayer = createAudioPlayer(
          { uri: track.url },
          {
            updateInterval: 500,
            keepAudioSessionActive: true,
          },
        );

        newPlayer.volume = volume;
        newPlayer.setPlaybackRate(playbackSpeed);

        // Initial Lock Screen setup for the new player instance
        newPlayer.setActiveForLockScreen(
          true,
          {
            title: track.title,
            artist: track.creator || "Unknown Artist",
            albumTitle: track.title || "Unknown Album",
            artworkUrl:
              track.thumbnail ||
              `https://archive.org/services/img/${track.identifier}`,
          },
          {
            showSeekBackward: false,
            showSeekForward: false,
          },
        );

        newPlayer.play();

        set({
          currentIndex: index,
          currentTrack: track,
          player: newPlayer,
        });

        get().preloadNext();
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
          player.remove();
        }
        set({
          player: null,
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

  // useAudioPlayerStatus will automatically re-subscribe when 'player' object changes
  const status = useAudioPlayerStatus(player!);

  // Audio Mode configuration
  useEffect(() => {
    setAudioModeAsync({
      interruptionMode: "doNotMix",
      playsInSilentMode: true,
      shouldRouteThroughEarpiece: false,
    }).catch(console.error);
  }, []);

  // Hydration handling
  useEffect(() => {
    if (!isHydrated.current && currentTrack?.url && player) {
      setTimeout(() => {
        try {
          // Note: Since hydration is first track, we try replace but if it fails we are okay
          // because subsequent track changes will use the 'recreate' logic.
          player.replace({ uri: currentTrack.url });
          player.volume = volume;
          player.setPlaybackRate(playbackSpeed);
        } catch (e) {
          console.error("Initial hydration replace error:", e);
        }
        isHydrated.current = true;
      }, 500);
    } else {
      isHydrated.current = true;
    }
  }, [currentTrack, player, volume, playbackSpeed]);

  // Sync status and handle track finish
  useEffect(() => {
    if (!isHydrated.current || !player) return;

    setPlaybackStatus(status);

    if (status.didJustFinish) {
      usePlayerStore.getState().skipNext();
    }
  }, [status, setPlaybackStatus, player]);

  // Remote Media Controls (Next/Previous) Setup
  useEffect(() => {
    let isMounted = true;
    let nextSub: any;
    let prevSub: any;

    async function initRemoteControls() {
      try {
        await ExpoAudioControls.setupRemoteControls();
        if (!isMounted) return;

        nextSub = ExpoAudioControls.addListener("onNextTrack", () => {
          if (isMounted) usePlayerStore.getState().skipNext();
        });

        prevSub = ExpoAudioControls.addListener("onPreviousTrack", () => {
          if (isMounted) usePlayerStore.getState().skipPrevious();
        });
      } catch (e) {
        console.error("Failed to setup remote controls:", e);
      }
    }

    initRemoteControls();

    return () => {
      isMounted = false;
      nextSub?.remove();
      prevSub?.remove();
    };
  }, []);

  return { player, status };
};
