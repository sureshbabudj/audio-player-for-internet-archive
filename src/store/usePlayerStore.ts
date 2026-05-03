import { useLibraryStore } from "@/store/useLibraryStore";
import { ArchiveTrack, RepeatMode } from "@/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createAudioPlaylist,
  setAudioModeAsync,
  useAudioPlaylistStatus,
  type AudioPlaylist,
} from "expo-audio";
import { useEffect, useRef } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import ExpoAudioControls from "../../modules/expo-audio-controls";

interface PlayerState {
  // Native Object
  playlist: AudioPlaylist | null;

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

  // Internal Sync
  setPlaylistStatus: (status: any) => void;
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      playlist: createAudioPlaylist({
        sources: [],
        updateInterval: 500,
        loop: "none",
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

      setPlaylistStatus: (status) => {
        const state = get();
        if (!state.playlist || state.isInternalStateChange) return;

        let newPosition = Math.floor((status.currentTime || 0) * 1000);
        const newDuration = Math.floor((status.duration || 0) * 1000);
        const newIndex = status.currentIndex;

        // Clamp the position to the duration
        if (newDuration > 0 && newPosition > newDuration) {
          newPosition = newDuration;
        }

        // Map native index back to queue index if shuffled
        const mappedIndex =
          state.isShuffled && state.shuffledIndices.length > 0
            ? state.shuffledIndices[newIndex]
            : newIndex;

        const currentTrack = state.queue[mappedIndex] || null;
        const prevIndex = state.currentIndex;
        const prevPlaying = state.isPlaying;
        const prevPosition = state.position;

        const updates: Partial<PlayerState> = {
          isPlaying: status.playing,
          isBuffering: status.isBuffering && !status.playing,
          position: newPosition,
          duration: newDuration,
          currentIndex: mappedIndex,
          currentTrack: currentTrack,
        };

        set(updates);

        // Update custom native module for lock screen / notifications
        // We only update if:
        // 1. The track changed
        // 2. The playing state changed
        // 3. A significant seek occurred (> 2s difference from expected position)
        const trackChanged = newIndex !== prevIndex;
        const playingChanged = status.playing !== prevPlaying;
        const seekOccurred =
          Math.abs(newPosition - (prevPosition + 500)) > 2000;

        if (currentTrack && (trackChanged || playingChanged || seekOccurred)) {
          try {
            if (typeof ExpoAudioControls?.updateNowPlaying === "function") {
              ExpoAudioControls.updateNowPlaying({
                title: currentTrack.title,
                artist: currentTrack.creator || "Unknown Artist",
                album: state.queueTitle || "ArchiPlay",
                artworkUrl:
                  currentTrack.thumbnail ||
                  `https://archive.org/services/img/${currentTrack.identifier}`,
                duration: newDuration,
                position: newPosition,
                isPlaying: status.playing,
              });
            }
          } catch (e) {
            console.warn("Failed to update native media controls:", e);
          }
        }
      },

      loadQueue: async (tracks, startIndex = 0, title = "Playlist") => {
        const { playlist, volume, playbackSpeed, repeatMode } = get();
        if (!playlist) return;

        const sources = tracks.map((t) => ({
          uri: t.url,
          name: t.title,
        }));

        // Reset playlist with new sources
        playlist.pause();
        playlist.clear();
        sources.forEach((s) => playlist.add(s));

        playlist.volume = volume;
        playlist.playbackRate = playbackSpeed;
        playlist.loop =
          repeatMode === "all"
            ? "all"
            : repeatMode === "one"
              ? "single"
              : "none";

        set({
          queue: tracks,
          shuffledIndices: [],
          currentIndex: startIndex,
          currentTrack: tracks[startIndex],
          queueTitle: title,
          isShuffled: false,
        });

        playlist.skipTo(startIndex);
        playlist.play();

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
        const { playlist } = get();
        if (!playlist) return;
        if (playlist.playing) {
          playlist.pause();
        } else {
          playlist.play();
        }
      },

      seekTo: async (position) => {
        const { playlist } = get();
        if (playlist) {
          playlist.seekTo(position / 1000);
          set({ position });
        }
      },

      skipNext: () => {
        const { playlist } = get();
        if (playlist) playlist.next();
      },

      skipPrevious: () => {
        const { playlist, position } = get();
        if (!playlist) return;

        if (position > 3000) {
          playlist.seekTo(0);
        } else {
          playlist.previous();
        }
      },

      playFromQueue: async (index) => {
        const { playlist, isShuffled, shuffledIndices } = get();
        if (playlist) {
          if (isShuffled && shuffledIndices.length > 0) {
            // Find where this original index is in the shuffled playlist
            const nativeIndex = shuffledIndices.indexOf(index);
            if (nativeIndex >= 0) {
              playlist.skipTo(nativeIndex);
            }
          } else {
            playlist.skipTo(index);
          }
          playlist.play();
        }
      },

      setRepeatMode: (mode) => {
        const { playlist } = get();
        if (playlist) {
          playlist.loop =
            mode === "all" ? "all" : mode === "one" ? "single" : "none";
        }
        set({ repeatMode: mode });
      },

      toggleShuffle: () => {
        const { isShuffled, queue, playlist, currentIndex } = get();
        if (!playlist || queue.length === 0) return;

        if (!isShuffled) {
          // Shuffle logic: reorder native playlist but keep store queue intact
          const indices = Array.from({ length: queue.length }, (_, i) => i);
          const otherIndices = indices.filter((i) => i !== currentIndex);

          for (let i = otherIndices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [otherIndices[i], otherIndices[j]] = [
              otherIndices[j],
              otherIndices[i],
            ];
          }

          const shuffledIndices = [currentIndex, ...otherIndices];
          const shuffledQueue = shuffledIndices.map((i) => queue[i]);

          const sources = shuffledQueue.map((t) => ({
            uri: t.url,
            name: t.title,
          }));

          set({ isInternalStateChange: true });
          playlist.pause();
          playlist.clear();
          sources.forEach((s) => playlist.add(s));
          playlist.skipTo(0);
          playlist.play();

          set({
            isShuffled: true,
            shuffledIndices,
            // currentIndex remains originalIndex of current track
          });

          setTimeout(() => set({ isInternalStateChange: false }), 1000);
        } else {
          // Un-shuffle logic: Restore sequential order to native playlist
          const sources = queue.map((t) => ({
            uri: t.url,
            name: t.title,
          }));

          set({ isInternalStateChange: true });
          playlist.pause();
          playlist.clear();
          sources.forEach((s) => playlist.add(s));
          playlist.skipTo(currentIndex);
          playlist.play();

          set({
            isShuffled: false,
            shuffledIndices: [],
          });

          setTimeout(() => set({ isInternalStateChange: false }), 1000);
        }
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

      resetPlayer: () => {
        const { playlist } = get();
        if (playlist) {
          playlist.pause();
          playlist.clear();
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
 */
export const useInitializePlayer = () => {
  const queue = usePlayerStore((state) => state.queue);
  const playlist = usePlayerStore((state) => state.playlist);
  const setPlaylistStatus = usePlayerStore((state) => state.setPlaylistStatus);
  const volume = usePlayerStore((state) => state.volume);
  const playbackSpeed = usePlayerStore((state) => state.playbackSpeed);
  const isHydrated = useRef(false);

  const status = useAudioPlaylistStatus(playlist!);

  useEffect(() => {
    setAudioModeAsync({
      interruptionMode: "doNotMix",
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      shouldRouteThroughEarpiece: false,
    }).catch(console.error);
  }, []);

  // Hydration and initial sources setup
  useEffect(() => {
    if (!isHydrated.current && playlist && queue.length > 0) {
      setTimeout(() => {
        playlist.clear();
        queue.forEach((t) => playlist.add({ uri: t.url, name: t.title }));
        playlist.volume = volume;
        playlist.playbackRate = playbackSpeed;

        const index = usePlayerStore.getState().currentIndex;
        playlist.skipTo(index);

        isHydrated.current = true;
      }, 500);
    } else {
      isHydrated.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isHydrated.current || !playlist) return;
    setPlaylistStatus(status);
  }, [status, setPlaylistStatus, playlist]);

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
              const { playlist } = usePlayerStore.getState();
              playlist?.play();
            }
          }),
        );
        subs.push(
          ExpoAudioControls.addListener("onPause", () => {
            if (isMounted) {
              const { playlist } = usePlayerStore.getState();
              playlist?.pause();
            }
          }),
        );
      } catch (e) {
        console.error("Failed to setup remote controls:", e);
      }
    }

    initRemoteControls();

    return () => {
      isMounted = false;
      subs.forEach((s) => s.remove());
    };
  }, []);

  return { playlist, status };
};
