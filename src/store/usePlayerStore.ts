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
import { create } from "zustand";
import { persist } from "zustand/middleware";
import ExpoAudioControls from "../../modules/expo-audio-controls";

interface PlayerState {
  // Native Object
  player: AudioPlayer | null;

  // Track State
  currentTrack: ArchiveTrack | null;
  queue: ArchiveTrack[];
  originalQueue: ArchiveTrack[]; // Keep sequential order for un-shuffling
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
  sleepTimer: number | null; // Remaining minutes

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

      setPlayer: (player) => {
        // Setup listeners if a new player is provided
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
          isPlaying: isPlaying,
          isBuffering: status.isBuffering && !isPlaying,
          position: newPosition,
          duration: newDuration,
        });

        // Handle auto-advance when track finishes
        if (status.didJustFinish && !state.player.loop) {
          state.skipNext();
        }

        // Update native module metadata if significant change
        const track = state.currentTrack;
        if (track && (isPlaying !== state.isPlaying || Math.abs(newPosition - state.position) > 5000)) {
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
                isPlaying: isPlaying,
              });
            }
          } catch {
            // Ignore
          }
        }
      },

      loadQueue: async (tracks, startIndex = 0, title = "Playlist") => {
        const state = get();
        
        // Clean up current player
        if (state.player) {
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
        newPlayer.playbackSpeed = state.playbackSpeed;
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

        newPlayer.play();

        // Preload next track
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
        const { queue, currentIndex, repeatMode, volume, playbackSpeed, setPlayer, player } = get();
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

        // Create new player for next track
        if (player) {
          player.pause();
          player.remove();
        }

        const newPlayer = createAudioPlayer({
          uri: nextTrack.url,
          name: nextTrack.title,
        });
        newPlayer.volume = volume;
        newPlayer.playbackSpeed = playbackSpeed;
        newPlayer.loop = repeatMode === "one";
        
        setPlayer(newPlayer);
        set({ currentIndex: nextIndex, currentTrack: nextTrack });
        newPlayer.play();

        // Preload track after the next one
        const afterNext = queue[nextIndex + 1];
        if (afterNext) {
          preload({ uri: afterNext.url });
        }
      },

      skipPrevious: () => {
        const { queue, currentIndex, position, volume, playbackSpeed, setPlayer, player, repeatMode } = get();
        
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
          player.pause();
          player.remove();
        }

        const newPlayer = createAudioPlayer({
          uri: prevTrack.url,
          name: prevTrack.title,
        });
        newPlayer.volume = volume;
        newPlayer.playbackSpeed = playbackSpeed;
        newPlayer.loop = repeatMode === "one";

        setPlayer(newPlayer);
        set({ currentIndex: prevIndex, currentTrack: prevTrack });
        newPlayer.play();
      },

      playFromQueue: async (index) => {
        const { queue, volume, playbackSpeed, setPlayer, player, repeatMode } = get();
        const track = queue[index];
        if (!track) return;

        if (player) {
          player.pause();
          player.remove();
        }

        const newPlayer = createAudioPlayer({
          uri: track.url,
          name: track.title,
        });
        newPlayer.volume = volume;
        newPlayer.playbackSpeed = playbackSpeed;
        newPlayer.loop = repeatMode === "one";

        setPlayer(newPlayer);
        set({ currentIndex: index, currentTrack: track });
        newPlayer.play();
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
          // Shuffle
          const currentTrack = queue[currentIndex];
          const otherTracks = queue.filter((_, i) => i !== currentIndex);
          
          for (let i = otherTracks.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [otherTracks[i], otherTracks[j]] = [otherTracks[j], otherTracks[i]];
          }
          
          const newQueue = [currentTrack, ...otherTracks];
          set({
            queue: newQueue,
            currentIndex: 0,
            isShuffled: true,
          });
        } else {
          // Un-shuffle
          const currentTrack = queue[currentIndex];
          const newIndex = originalQueue.findIndex(t => t.id === currentTrack.id);
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
        if (player) player.playbackSpeed = speed;
        set({ playbackSpeed: speed });
      },
      
      setSleepTimer: (minutes) => {
        set({ sleepTimer: minutes });
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
 */
export const useInitializePlayer = () => {
  const { 
    currentTrack, 
    player, 
    volume, 
    playbackSpeed, 
    sleepTimer, 
    setSleepTimer, 
    setPlayer 
  } = usePlayerStore();
  
  const isHydrated = useRef(false);

  useEffect(() => {
    setAudioModeAsync({
      interruptionMode: "doNotMix",
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      shouldRouteThroughEarpiece: false,
    }).catch(() => {});
  }, []);

  // Hydration and initial sources setup
  useEffect(() => {
    if (!isHydrated.current && !player && currentTrack) {
      const initPlayer = async () => {
        const newPlayer = createAudioPlayer({
          uri: currentTrack.url,
          name: currentTrack.title,
        });
        newPlayer.volume = volume;
        newPlayer.playbackSpeed = playbackSpeed;
        setPlayer(newPlayer);
        isHydrated.current = true;
      };
      initPlayer();
    } else if (!currentTrack) {
      isHydrated.current = true;
    }
  }, [currentTrack, player, volume, playbackSpeed, setPlayer]);

  // Sleep Timer logic
  useEffect(() => {
    if (sleepTimer === null || sleepTimer <= 0) return;

    const interval = setInterval(() => {
      const currentTimer = usePlayerStore.getState().sleepTimer;
      if (currentTimer !== null) {
        if (currentTimer <= 1) {
          player?.pause();
          setSleepTimer(null);
          clearInterval(interval);
        } else {
          setSleepTimer(currentTimer - 1);
        }
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [sleepTimer, player, setSleepTimer]);

  // Remote Media Controls Setup
  useEffect(() => {
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

  return { player };
};
