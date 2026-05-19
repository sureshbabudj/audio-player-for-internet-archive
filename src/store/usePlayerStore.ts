import { useLibraryStore } from "@/store/useLibraryStore";
import { ArchiveTrack, RepeatMode } from "@/types";
import { analytics } from "@/utils/analytics";
import { getTrackEmbeddedArtAsync } from "@/utils/trackArtworkResolver";
import { maybeRequestReview, recordTrackPlayed } from "@/utils/storeReview";
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
  shuffledIndices: number[];
  shufflePointer: number;
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
  preloadNextTrack: () => void;

  // Internal Sync
  setPlaybackStatus: (status: any) => void;
}

/**
 * Activates the native lock screen for a player on BOTH platforms.
 * - Android: Uses expo-audio's built-in MediaSession via setActiveForLockScreen
 * - iOS:     Uses our custom MPNowPlayingInfoCenter module
 */
const activateLockScreen = async (
  player: AudioPlayer,
  track: ArchiveTrack,
  title: string,
) => {
  // Automatically add the track to recently played lists
  useLibraryStore.getState().addToRecentlyPlayed(track);

  const metadata = {
    title: track.title,
    artist: track.creator || "Unknown Artist",
    albumTitle: title,
    artworkUrl:
      track.thumbnail || `https://archive.org/services/img/${track.identifier}`,
    duration: 0, // Will be updated during playback
  };

  analytics.track("song_played", {
    track_id: track.id,
    track_title: track.title,
    artist: track.creator || "Unknown Artist",
    album: title,
    source:
      track.url &&
      (track.url.startsWith("file://") || track.url.startsWith("/"))
        ? "local"
        : "archive",
  });

  // 1. Setup immediately using initial metadata
  if (Platform.OS === "android" || Platform.OS === "ios") {
    // Both iOS and Android now use our custom module for metadata and controls.
    // This gives us 100% control over the MPRemoteCommandCenter and Android MediaSession.
    try {
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
    } catch {
      // Ignore
    }
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
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        /* Action not supported */
      }
    });
  }

  // 2. Fetch ID3 metadata asynchronously
  try {
    const artworkUrl = await getTrackEmbeddedArtAsync(track);
    if (artworkUrl) {
      const enrichedMetadata = {
        title: track.title,
        artist: track.creator || "Unknown Artist",
        albumTitle: title,
        artworkUrl: artworkUrl,
      };

      // Update Native Controls with enriched ID3 metadata
      if (Platform.OS === "android" || Platform.OS === "ios") {
        try {
          ExpoAudioControls.updateNowPlaying({
            title: enrichedMetadata.title,
            artist: enrichedMetadata.artist,
            album: enrichedMetadata.albumTitle,
            artworkUrl: enrichedMetadata.artworkUrl,
            isPlaying: true,
            position: 0,
            duration: 0,
          });
        } catch {}
      } else if (
        Platform.OS === "web" &&
        typeof navigator !== "undefined" &&
        "mediaSession" in navigator
      ) {
        // @ts-ignore
        navigator.mediaSession.metadata = new MediaMetadata({
          title: enrichedMetadata.title,
          artist: enrichedMetadata.artist,
          album: enrichedMetadata.albumTitle,
          artwork: enrichedMetadata.artworkUrl
            ? [{ src: enrichedMetadata.artworkUrl }]
            : [],
        });
      }

      // Update the Zustand store's currentTrack to automatically update the React UI
      const state = usePlayerStore.getState();
      if (state.currentTrack && state.currentTrack.id === track.id) {
        if (Platform.OS !== "web") {
          usePlayerStore.setState({
            currentTrack: {
              ...state.currentTrack,
              thumbnail: enrichedMetadata.artworkUrl,
            },
          });

          // ALSO update recently played, liked tracks, etc. in useLibraryStore!
          useLibraryStore.getState().updateTrackMetadata(track.id, {
            thumbnail: enrichedMetadata.artworkUrl,
          });
        } else {
          // On Web, we simply trigger a store state notification without writing the Blob URL to storage
          usePlayerStore.setState({
            currentTrack: {
              ...state.currentTrack,
            },
          });
        }
      }
    }
  } catch (e) {
    console.warn("Failed to fetch ID3 tags via MusicInfo:", e);
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
      shuffledIndices: [],
      shufflePointer: -1,
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

        // Native lock screen metadata update
        if (Platform.OS === "ios" || Platform.OS === "android") {
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
          shuffledIndices: [],
          shufflePointer: -1,
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

        get().preloadNextTrack();
      },

      loadTrack: async (track, queue = [], title = "Now Playing") => {
        const fullQueue = queue.length > 0 ? queue : [track];
        const trackIndex = fullQueue.findIndex((t) => t.id === track.id);
        const targetIndex = trackIndex >= 0 ? trackIndex : 0;
        await get().loadQueue(fullQueue, targetIndex, title);

        // Fire-and-forget: record play count & maybe prompt for review
        recordTrackPlayed().then(() => maybeRequestReview()).catch(() => {});
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
          analytics.track("song_paused", {
            track_id: currentTrack?.id,
            track_title: currentTrack?.title,
            artist: currentTrack?.creator,
          });
        } else {
          player.play();
          analytics.track("song_resumed", {
            track_id: currentTrack?.id,
            track_title: currentTrack?.title,
            artist: currentTrack?.creator,
          });
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
          isShuffled,
          shuffledIndices,
          shufflePointer,
          currentTrack,
        } = get();

        analytics.track("song_skipped", {
          track_id: currentTrack?.id,
          track_title: currentTrack?.title,
          artist: currentTrack?.creator,
          direction: "next",
        });

        let nextIndex: number;

        if (isShuffled && shuffledIndices.length > 0) {
          let nextPointer = shufflePointer + 1;
          if (nextPointer >= shuffledIndices.length) {
            if (repeatMode === "all") {
              nextPointer = 0;
            } else {
              return;
            }
          }
          nextIndex = shuffledIndices[nextPointer];
          set({ shufflePointer: nextPointer });
        } else {
          nextIndex = currentIndex + 1;
          if (nextIndex >= queue.length) {
            if (repeatMode === "all") {
              nextIndex = 0;
            } else {
              return;
            }
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

        get().preloadNextTrack();
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
          isShuffled,
          shuffledIndices,
          shufflePointer,
          currentTrack,
        } = get();

        analytics.track("song_skipped", {
          track_id: currentTrack?.id,
          track_title: currentTrack?.title,
          artist: currentTrack?.creator,
          direction: "previous",
        });

        if (position > 3000) {
          player?.seekTo(0);
          return;
        }

        let prevIndex: number;

        if (isShuffled && shuffledIndices.length > 0) {
          let prevPointer = shufflePointer - 1;
          if (prevPointer < 0) {
            if (repeatMode === "all") {
              prevPointer = shuffledIndices.length - 1;
            } else {
              return;
            }
          }
          prevIndex = shuffledIndices[prevPointer];
          set({ shufflePointer: prevPointer });
        } else {
          prevIndex = currentIndex - 1;
          if (prevIndex < 0) {
            if (repeatMode === "all") {
              prevIndex = queue.length - 1;
            } else {
              return;
            }
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

        get().preloadNextTrack();
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
          isShuffled,
          shuffledIndices,
        } = get();
        const track = queue[index];
        if (!track) return;

        if (isShuffled) {
          const pointer = shuffledIndices.indexOf(index);
          if (pointer !== -1) {
            set({ shufflePointer: pointer });
          }
        }

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

        get().preloadNextTrack();
      },

      setRepeatMode: (mode) => {
        const { player } = get();
        if (player) {
          player.loop = mode === "one";
        }
        set({ repeatMode: mode });
        get().preloadNextTrack();
      },

      toggleShuffle: () => {
        const { isShuffled, queue, currentIndex } = get();

        if (!isShuffled) {
          // Enable shuffle: create a random sequence of indices
          const indices = Array.from({ length: queue.length }, (_, i) => i);
          // Standard Fisher-Yates shuffle
          for (let i = indices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [indices[i], indices[j]] = [indices[j], indices[i]];
          }
          // Move the current track's index to the front so the sequence starts from now
          const currentInIndices = indices.indexOf(currentIndex);
          if (currentInIndices !== -1) {
            indices.splice(currentInIndices, 1);
            indices.unshift(currentIndex);
          }

          set({
            isShuffled: true,
            shuffledIndices: indices,
            shufflePointer: 0,
          });
        } else {
          // Disable shuffle: return to normal sequential order
          set({
            isShuffled: false,
            shuffledIndices: [],
            shufflePointer: -1,
          });
        }

        get().preloadNextTrack();
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
        analytics.track("sleep_timer_set", {
          duration_minutes: minutes,
        });
      },

      resetPlayer: () => {
        const { player } = get();
        if (player) {
          player.clearLockScreenControls?.();
          player.pause();
          player.remove();
          try {
            if (typeof ExpoAudioControls?.removeControls === "function") {
              ExpoAudioControls.removeControls();
            }
          } catch {}
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

      preloadNextTrack: () => {
        const {
          queue,
          currentIndex,
          isShuffled,
          shuffledIndices,
          shufflePointer,
          repeatMode,
        } = get();

        if (queue.length === 0) return;

        let nextIndex: number | null = null;

        if (isShuffled && shuffledIndices.length > 0) {
          let nextPointer = shufflePointer + 1;
          if (nextPointer >= shuffledIndices.length) {
            if (repeatMode === "all" || repeatMode === "one") {
              nextPointer = 0;
            } else {
              nextPointer = -1;
            }
          }
          if (nextPointer !== -1) {
            nextIndex = shuffledIndices[nextPointer];
          }
        } else {
          let tempNextIndex = currentIndex + 1;
          if (tempNextIndex >= queue.length) {
            if (repeatMode === "all" || repeatMode === "one") {
              tempNextIndex = 0;
            } else {
              tempNextIndex = -1;
            }
          }
          if (tempNextIndex !== -1) {
            nextIndex = tempNextIndex;
          }
        }

        if (nextIndex !== null && nextIndex !== undefined) {
          const nextTrack = queue[nextIndex];
          if (nextTrack && nextTrack.url) {
            preload({ uri: nextTrack.url });
          }
        }
      },
    }),
    {
      name: "player-storage",
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
              if (data.state.currentTrack) {
                const cleaned = cleanWebTrack(data.state.currentTrack);
                if (cleaned !== data.state.currentTrack) {
                  data.state.currentTrack = cleaned;
                  changed = true;
                }
              }
              if (Array.isArray(data.state.queue)) {
                data.state.queue = data.state.queue.map((t: any) => {
                  const cleaned = cleanWebTrack(t);
                  if (cleaned !== t) changed = true;
                  return cleaned;
                });
              }
              if (Array.isArray(data.state.originalQueue)) {
                data.state.originalQueue = data.state.originalQueue.map(
                  (t: any) => {
                    const cleaned = cleanWebTrack(t);
                    if (cleaned !== t) changed = true;
                    return cleaned;
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

  // Native Remote Media Controls Setup via custom module (iOS & Android)
  useEffect(() => {
    if (Platform.OS === "web") return;

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
        subs.push(
          ExpoAudioControls.addListener("onSeekForward", () => {
            if (isMounted) {
              const { player } = usePlayerStore.getState();
              if (player) player.seekTo(player.currentTime + 10);
            }
          }),
        );
        subs.push(
          ExpoAudioControls.addListener("onSeekBackward", () => {
            if (isMounted) {
              const { player } = usePlayerStore.getState();
              if (player) player.seekTo(player.currentTime - 10);
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

  // Removed separate Android effect as it's now handled with iOS logic above

  return { player };
};
