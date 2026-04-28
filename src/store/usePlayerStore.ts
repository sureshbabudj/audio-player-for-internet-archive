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
  shuffledIndices: number[]; // Store shuffled order of indices

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
      shuffledIndices: [],
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

        let newPosition = Math.floor((status.currentTime || 0) * 1000);
        const newDuration = Math.floor((status.duration || 0) * 1000);

        if ((status as any).error) {
          console.error(
            "❌ Player status reported error:",
            (status as any).error,
          );
        }
        if ((status as any).status === "error") {
          console.error(
            "❌ Player status is error. Check connection or track format.",
          );
        }

        // Clamp the position to the duration to prevent the progress bar from overflowing
        // This handles cases where the native player miscalculates time after seeking on VBR files.
        if (newDuration > 0 && newPosition > newDuration) {
          newPosition = newDuration;
        }

        if (
          state.isPlaying === status.playing &&
          state.isBuffering === status.isBuffering &&
          state.position === newPosition &&
          state.duration === newDuration
        ) {
          return;
        }

        const updates: Partial<PlayerState> = {
          isPlaying: status.playing,
          isBuffering: status.isBuffering,
          position: newPosition,
          duration: newDuration,
        };

        set(updates);
      },

      loadQueue: async (tracks, startIndex = 0, title = "Playlist") => {
        const track = tracks[startIndex];
        if (!track) return;

        set({
          queue: tracks,
          shuffledIndices: [],
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
          set({ position });
        }
      },

      skipNext: () => {
        const { currentIndex, queue, repeatMode, isShuffled, shuffledIndices } =
          get();
        let nextIndex = currentIndex + 1;

        if (isShuffled && shuffledIndices.length > 0) {
          const currentShufflePos = shuffledIndices.indexOf(currentIndex);
          if (
            currentShufflePos !== -1 &&
            currentShufflePos + 1 < shuffledIndices.length
          ) {
            nextIndex = shuffledIndices[currentShufflePos + 1];
          } else {
            if (repeatMode === "all") {
              nextIndex = shuffledIndices[0];
            } else {
              return;
            }
          }
        } else {
          if (nextIndex >= queue.length) {
            if (repeatMode === "all") {
              nextIndex = 0;
            } else {
              return;
            }
          }
        }
        get().playFromQueue(nextIndex);
      },

      skipPrevious: () => {
        const {
          currentIndex,
          queue,
          position,
          repeatMode,
          isShuffled,
          shuffledIndices,
        } = get();
        if (position > 3000) {
          get().seekTo(0);
          return;
        }

        let prevIndex = currentIndex - 1;

        if (isShuffled && shuffledIndices.length > 0) {
          const currentShufflePos = shuffledIndices.indexOf(currentIndex);
          if (currentShufflePos > 0) {
            prevIndex = shuffledIndices[currentShufflePos - 1];
          } else {
            if (repeatMode === "all") {
              prevIndex = shuffledIndices[shuffledIndices.length - 1];
            } else {
              prevIndex = currentIndex;
            }
          }
        } else {
          if (prevIndex < 0) {
            if (repeatMode === "all") {
              prevIndex = queue.length - 1;
            } else {
              return;
            }
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

        try {
          newPlayer.play();
        } catch (error) {
          console.error(`❌ Failed to play track: ${track.title}`, error);
        }

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
        const { isShuffled, queue } = get();

        if (!isShuffled) {
          const indices = Array.from({ length: queue.length }, (_, i) => i);
          const shuffled = indices.sort(() => Math.random() - 0.5);
          set({
            isShuffled: true,
            shuffledIndices: shuffled,
          });
        } else {
          set({
            isShuffled: false,
            shuffledIndices: [],
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
        const { currentIndex, queue, isShuffled, shuffledIndices, repeatMode } =
          get();
        let nextIndex = currentIndex + 1;

        if (isShuffled && shuffledIndices.length > 0) {
          const currentShufflePos = shuffledIndices.indexOf(currentIndex);
          if (
            currentShufflePos !== -1 &&
            currentShufflePos + 1 < shuffledIndices.length
          ) {
            nextIndex = shuffledIndices[currentShufflePos + 1];
          } else {
            if (repeatMode === "all") {
              nextIndex = shuffledIndices[0];
            } else {
              return;
            }
          }
        } else {
          if (nextIndex >= queue.length) {
            if (repeatMode === "all") {
              nextIndex = 0;
            } else {
              return;
            }
          }
        }

        if (nextIndex >= 0 && nextIndex < queue.length) {
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
        shuffledIndices: state.shuffledIndices,
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
  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const player = usePlayerStore((state) => state.player);
  const setPlaybackStatus = usePlayerStore((state) => state.setPlaybackStatus);
  const volume = usePlayerStore((state) => state.volume);
  const playbackSpeed = usePlayerStore((state) => state.playbackSpeed);
  const isHydrated = useRef(false);
  const lastFinishedPlayerId = useRef<string | null>(null);

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
    if (!isHydrated.current && currentTrack?.url) {
      setTimeout(() => {
        try {
          const newPlayer = createAudioPlayer(
            { uri: currentTrack.url },
            {
              updateInterval: 500,
              keepAudioSessionActive: true,
            },
          );
          newPlayer.volume = volume;
          newPlayer.setPlaybackRate(playbackSpeed);

          usePlayerStore.setState({ player: newPlayer });
        } catch (e) {
          console.error("Initial hydration replace error:", e);
        }
        isHydrated.current = true;
      }, 500);
    } else {
      isHydrated.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync status and handle track finish
  useEffect(() => {
    if (!isHydrated.current || !player) return;

    setPlaybackStatus(status);

    if (status.didJustFinish && status.id !== lastFinishedPlayerId.current) {
      lastFinishedPlayerId.current = status.id;
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
