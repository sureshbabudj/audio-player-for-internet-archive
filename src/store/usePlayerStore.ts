import { useLibraryStore } from "@/store/useLibraryStore";
import { ArchiveTrack, RepeatMode } from "@/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createAudioPlayer,
  preload,
  setAudioModeAsync,
  type AudioPlayer,
} from "expo-audio";
import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import ExpoAudioControls from "../../modules/expo-audio-controls";

interface PlayerState {
  // Native Object
  player: AudioPlayer | null;

  // Track State
  currentTrack: ArchiveTrack | null;
  queue: ArchiveTrack[];
  originalQueue: ArchiveTrack[];
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
  sleepTimer: number | null; // Remaining minutes (UI display)
  sleepTimerEndTime: number | null; // Exact epoch ms to stop

  // Actions
  setPlayer: (player: AudioPlayer | null) => void;
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
  setSleepTimer: (minutes: number | null) => void;
  resetPlayer: () => void;

  // Internal Sync
  setPlaybackStatus: (status: any) => void;
}

/**
 * Activates the native lock screen for a player on BOTH platforms.
 * - Android: Uses expo-audio's built-in MediaSession via setActiveForLockScreen
 * - iOS:     Uses our custom MPNowPlayingInfoCenter module
 */
const activateLockScreen = (
  player: AudioPlayer,
  track: ArchiveTrack,
  title: string,
) => {
  const metadata = {
    title: track.title,
    artist: track.creator || "Unknown Artist",
    albumTitle: title,
    artworkUrl:
      track.thumbnail || `https://archive.org/services/img/${track.identifier}`,
    duration: 0, // Will be updated during playback
  };

  if (Platform.OS === "android") {
    player.setActiveForLockScreen(true, metadata);
  } else if (Platform.OS === "ios") {
    // On iOS, we use our custom module for BOTH metadata and controls.
    // This gives us 100% control over the MPRemoteCommandCenter.
    ExpoAudioControls.setupRemoteControls();
    ExpoAudioControls.updateNowPlaying({
      title: metadata.title,
      artist: metadata.artist,
      album: metadata.albumTitle,
      artworkUrl: metadata.artworkUrl,
      isPlaying: true,
      position: 0,
      duration: 0,
    });
  } else if (
    Platform.OS === "web" &&
    typeof navigator !== "undefined" &&
    "mediaSession" in navigator
  ) {
    // @ts-ignore
    navigator.mediaSession.metadata = new MediaMetadata({
      title: metadata.title,
      artist: metadata.artist,
      album: metadata.albumTitle,
      artwork: [{ src: metadata.artworkUrl }],
    });

    const store = usePlayerStore.getState();
    const handlers = [
      ["play", () => store.togglePlayPause()],
      ["pause", () => store.togglePlayPause()],
      ["nexttrack", () => store.skipNext()],
      ["previoustrack", () => store.skipPrevious()],
      [
        "seekbackward",
        () => {
          const { player: p } = usePlayerStore.getState();
          if (p) p.seekTo(p.currentTime - 10);
        },
      ],
      [
        "seekforward",
        () => {
          const { player: p } = usePlayerStore.getState();
          if (p) p.seekTo(p.currentTime + 10);
        },
      ],
    ];

    handlers.forEach(([action, handler]) => {
      try {
        // @ts-ignore
        navigator.mediaSession.setActionHandler(action, handler);
      } catch (error) {
        /* Action not supported */
      }
    });
  }
};

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
      sleepTimer: null,
      sleepTimerEndTime: null,

      setPlayer: (player) => {
        if (player) {
          player.addListener("playbackStatusUpdate", (status) => {
            get().setPlaybackStatus(status);
          });
        }
        set({ player });
      },

      setPlaybackStatus: (status) => {
        const state = get();
        if (!state.player) return;

        const newPosition = Math.floor((status.currentTime || 0) * 1000);
        const newDuration = Math.floor((status.duration || 0) * 1000);
        const isPlaying = status.playing;

        set({
          isPlaying,
          isBuffering: status.isBuffering && !isPlaying,
          position: newPosition,
          duration: newDuration,
        });

        // Auto-advance when track ends
        if (status.didJustFinish && !state.player.loop) {
          state.skipNext();
        }

        // iOS lock screen metadata update (Android is handled natively via setActiveForLockScreen)
        if (Platform.OS === "ios") {
          const track = state.currentTrack;
          if (
            track &&
            (isPlaying !== state.isPlaying ||
              Math.abs(newPosition - state.position) > 5000)
          ) {
            try {
              if (typeof ExpoAudioControls?.updateNowPlaying === "function") {
                ExpoAudioControls.updateNowPlaying({
                  title: track.title,
                  artist: track.creator || "Unknown Artist",
                  album: state.queueTitle || "ArchiPlay",
                  artworkUrl:
                    track.thumbnail ||
                    `https://archive.org/services/img/${track.identifier}`,
                  duration: newDuration,
                  position: newPosition,
                  isPlaying,
                });
              }
            } catch {
              // Ignore
            }
          }
        }
      },

      loadQueue: async (tracks, startIndex = 0, title = "Playlist") => {
        const state = get();

        if (state.player) {
          state.player.clearLockScreenControls?.();
          state.player.pause();
          state.player.remove();
        }

        const track = tracks[startIndex];
        if (!track) return;

        const newPlayer = createAudioPlayer({
          uri: track.url,
          name: track.title,
        });

        newPlayer.volume = state.volume;
        newPlayer.setPlaybackRate(state.playbackSpeed);
        newPlayer.loop = state.repeatMode === "one";

        state.setPlayer(newPlayer);

        set({
          queue: tracks,
          originalQueue: [...tracks],
          currentIndex: startIndex,
          currentTrack: track,
          queueTitle: title,
          isShuffled: false,
        });

        // Play first on Android to satisfy foreground service requirements
        newPlayer.play();

        if (Platform.OS === "android") {
          setTimeout(() => {
            activateLockScreen(newPlayer, track, title);
          }, 100);
        } else {
          activateLockScreen(newPlayer, track, title);
        }

        const nextTrack = tracks[startIndex + 1];
        if (nextTrack) {
          preload({ uri: nextTrack.url });
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
        const {
          player,
          currentTrack,
          volume,
          playbackSpeed,
          repeatMode,
          setPlayer,
          queueTitle,
        } = get();

        // If no player but we have a track (e.g. after reload), initialize it
        if (Platform.OS === "web" && !player && currentTrack) {
          const newPlayer = createAudioPlayer({
            uri: currentTrack.url,
            name: currentTrack.title,
          });
          newPlayer.volume = volume;
          newPlayer.setPlaybackRate(playbackSpeed);
          newPlayer.loop = repeatMode === "one";

          setPlayer(newPlayer);
          newPlayer.play();

          activateLockScreen(newPlayer, currentTrack, queueTitle);
          return;
        }

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
        const {
          queue,
          currentIndex,
          repeatMode,
          volume,
          playbackSpeed,
          setPlayer,
          player,
          queueTitle,
        } = get();
        let nextIndex = currentIndex + 1;

        if (nextIndex >= queue.length) {
          if (repeatMode === "all") {
            nextIndex = 0;
          } else {
            return;
          }
        }

        const nextTrack = queue[nextIndex];
        if (!nextTrack) return;

        if (player) {
          player.clearLockScreenControls?.();
          player.pause();
          player.remove();
        }

        const newPlayer = createAudioPlayer({
          uri: nextTrack.url,
          name: nextTrack.title,
        });
        newPlayer.volume = volume;
        newPlayer.setPlaybackRate(playbackSpeed);
        newPlayer.loop = repeatMode === "one";

        setPlayer(newPlayer);
        set({ currentIndex: nextIndex, currentTrack: nextTrack });

        // Play first on Android to satisfy foreground service requirements
        newPlayer.play();

        if (Platform.OS === "android") {
          setTimeout(() => {
            activateLockScreen(newPlayer, nextTrack, queueTitle);
          }, 100);
        } else {
          activateLockScreen(newPlayer, nextTrack, queueTitle);
        }

        const afterNext = queue[nextIndex + 1];
        if (afterNext) {
          preload({ uri: afterNext.url });
        }
      },

      skipPrevious: () => {
        const {
          queue,
          currentIndex,
          position,
          volume,
          playbackSpeed,
          setPlayer,
          player,
          repeatMode,
          queueTitle,
        } = get();

        if (position > 3000) {
          player?.seekTo(0);
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

        const prevTrack = queue[prevIndex];
        if (!prevTrack) return;

        if (player) {
          player.clearLockScreenControls?.();
          player.pause();
          player.remove();
        }

        const newPlayer = createAudioPlayer({
          uri: prevTrack.url,
          name: prevTrack.title,
        });
        newPlayer.volume = volume;
        newPlayer.setPlaybackRate(playbackSpeed);
        newPlayer.loop = repeatMode === "one";

        setPlayer(newPlayer);
        set({ currentIndex: prevIndex, currentTrack: prevTrack });

        // Play first on Android to satisfy foreground service requirements
        newPlayer.play();

        if (Platform.OS === "android") {
          setTimeout(() => {
            activateLockScreen(newPlayer, prevTrack, queueTitle);
          }, 100);
        } else {
          activateLockScreen(newPlayer, prevTrack, queueTitle);
        }
      },

      playFromQueue: async (index) => {
        const {
          queue,
          volume,
          playbackSpeed,
          setPlayer,
          player,
          repeatMode,
          queueTitle,
        } = get();
        const track = queue[index];
        if (!track) return;

        if (player) {
          player.clearLockScreenControls?.();
          player.pause();
          player.remove();
        }

        const newPlayer = createAudioPlayer({
          uri: track.url,
          name: track.title,
        });
        newPlayer.volume = volume;
        newPlayer.setPlaybackRate(playbackSpeed);
        newPlayer.loop = repeatMode === "one";

        setPlayer(newPlayer);
        set({ currentIndex: index, currentTrack: track });

        // Play first on Android to satisfy foreground service requirements
        newPlayer.play();

        if (Platform.OS === "android") {
          setTimeout(() => {
            activateLockScreen(newPlayer, track, queueTitle);
          }, 100);
        } else {
          activateLockScreen(newPlayer, track, queueTitle);
        }
      },

      setRepeatMode: (mode) => {
        const { player } = get();
        if (player) {
          player.loop = mode === "one";
        }
        set({ repeatMode: mode });
      },

      toggleShuffle: () => {
        const { isShuffled, queue, originalQueue, currentIndex } = get();

        if (!isShuffled) {
          const currentTrack = queue[currentIndex];
          const otherTracks = queue.filter((_, i) => i !== currentIndex);

          for (let i = otherTracks.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [otherTracks[i], otherTracks[j]] = [otherTracks[j], otherTracks[i]];
          }

          const newQueue = [currentTrack, ...otherTracks];
          set({ queue: newQueue, currentIndex: 0, isShuffled: true });
        } else {
          const currentTrack = queue[currentIndex];
          const newIndex = originalQueue.findIndex(
            (t) => t.id === currentTrack.id,
          );
          set({
            queue: [...originalQueue],
            currentIndex: newIndex >= 0 ? newIndex : 0,
            isShuffled: false,
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
        if (player) player.setPlaybackRate(speed);
        set({ playbackSpeed: speed });
      },

      setSleepTimer: (minutes) => {
        const endTime = minutes !== null ? Date.now() + minutes * 60000 : null;
        set({ sleepTimer: minutes, sleepTimerEndTime: endTime });
      },

      resetPlayer: () => {
        const { player } = get();
        if (player) {
          player.clearLockScreenControls?.();
          player.pause();
          player.remove();
        }
        set({
          player: null,
          currentTrack: null,
          queue: [],
          originalQueue: [],
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
        originalQueue: state.originalQueue,
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
 * Must be called once at the app root level.
 */
export const useInitializePlayer = () => {
  const {
    currentTrack,
    player,
    volume,
    playbackSpeed,
    sleepTimerEndTime,
    setPlayer,
  } = usePlayerStore();

  const isHydrated = useRef(false);

  // Configure audio session once on mount
  useEffect(() => {
    setAudioModeAsync({
      // doNotMix is required for lock screen controls to work on both platforms
      interruptionMode: "doNotMix",
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      shouldRouteThroughEarpiece: false,
    }).catch(() => {});
  }, []);

  // Hydrate player from persisted state on app start
  useEffect(() => {
    if (!isHydrated.current && !player && currentTrack) {
      const initPlayer = async () => {
        const { queueTitle } = usePlayerStore.getState();
        const newPlayer = createAudioPlayer({
          uri: currentTrack.url,
          name: currentTrack.title,
        });
        newPlayer.volume = volume;
        newPlayer.setPlaybackRate(playbackSpeed);
        setPlayer(newPlayer);
        // Restore lock screen registration after app restart
        activateLockScreen(newPlayer, currentTrack, queueTitle);
        isHydrated.current = true;
      };
      initPlayer();
    } else if (!currentTrack) {
      isHydrated.current = true;
    }
  }, [currentTrack, player, volume, playbackSpeed, setPlayer]);

  // Sleep Timer — timestamp-based to survive background JS throttling
  useEffect(() => {
    if (!sleepTimerEndTime) return;

    // Poll every 5 seconds rather than every minute so the timer fires
    // accurately even after Android throttles background JS timers.
    const interval = setInterval(() => {
      const state = usePlayerStore.getState();
      if (!state.sleepTimerEndTime) {
        clearInterval(interval);
        return;
      }

      const now = Date.now();
      if (now >= state.sleepTimerEndTime) {
        // Timer expired — stop playback and clear timer atomically
        state.player?.pause();
        // Use setState directly (we are outside the store creator)
        usePlayerStore.setState({ sleepTimer: null, sleepTimerEndTime: null });
      } else {
        // Update UI countdown
        const remainingMins = Math.ceil(
          (state.sleepTimerEndTime - now) / 60000,
        );
        if (state.sleepTimer !== remainingMins) {
          usePlayerStore.setState({ sleepTimer: remainingMins });
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [sleepTimerEndTime]);

  // iOS Remote Media Controls Setup via custom module
  // On Android, expo-audio's AudioControlsService + ExpoAudioControlsModule
  // BroadcastReceiver already handles next/previous via setActiveForLockScreen.
  useEffect(() => {
    if (Platform.OS !== "ios") return;

    let isMounted = true;
    let subs: any[] = [];

    async function initRemoteControls() {
      try {
        await ExpoAudioControls.setupRemoteControls();
        if (!isMounted) return;

        subs.push(
          ExpoAudioControls.addListener("onNextTrack", () => {
            if (isMounted) usePlayerStore.getState().skipNext();
          }),
        );
        subs.push(
          ExpoAudioControls.addListener("onPreviousTrack", () => {
            if (isMounted) usePlayerStore.getState().skipPrevious();
          }),
        );
        subs.push(
          ExpoAudioControls.addListener("onPlay", () => {
            if (isMounted) {
              const { player } = usePlayerStore.getState();
              player?.play();
            }
          }),
        );
        subs.push(
          ExpoAudioControls.addListener("onPause", () => {
            if (isMounted) {
              const { player } = usePlayerStore.getState();
              player?.pause();
            }
          }),
        );
      } catch {
        // Ignore
      }
    }

    initRemoteControls();

    return () => {
      isMounted = false;
      subs.forEach((s) => s.remove());
    };
  }, []);

  // Android: Listen for next/previous events from our BroadcastReceiver module
  // These are broadcast by expo-audio's AudioMediaSessionCallback when the
  // lock screen next/previous buttons are tapped.
  useEffect(() => {
    if (Platform.OS !== "android") return;

    let isMounted = true;
    const subs: any[] = [];

    try {
      subs.push(
        ExpoAudioControls.addListener("onNextTrack", () => {
          if (isMounted) usePlayerStore.getState().skipNext();
        }),
      );
      subs.push(
        ExpoAudioControls.addListener("onPreviousTrack", () => {
          if (isMounted) usePlayerStore.getState().skipPrevious();
        }),
      );
    } catch {
      // Ignore if module not available
    }

    return () => {
      isMounted = false;
      subs.forEach((s) => s.remove());
    };
  }, []);

  return { player };
};
