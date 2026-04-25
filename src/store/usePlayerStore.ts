import { useLibraryStore } from "@/store/useLibraryStore";
import { ArchiveTrack, RepeatMode } from "@/types";
import { createAudioPlayer, type AudioPlayer } from "expo-audio";
import { create } from "zustand";

interface PlayerState {
  player: AudioPlayer | null;
  currentTrack: ArchiveTrack | null;
  queue: ArchiveTrack[];
  queueTitle: string;
  currentIndex: number;
  isPlaying: boolean;
  isBuffering: boolean;
  isLoaded: boolean;
  position: number;
  duration: number;
  repeatMode: RepeatMode;
  isShuffled: boolean;
  volume: number;
  playbackSpeed: number;

  loadTrack: (
    track: ArchiveTrack,
    queue?: ArchiveTrack[],
    title?: string,
  ) => Promise<void>;
  togglePlayPause: () => Promise<void>;
  seekTo: (position: number) => Promise<void>;
  skipNext: () => Promise<void>;
  skipPrevious: () => Promise<void>;
  setRepeatMode: (mode: RepeatMode) => void;
  toggleShuffle: () => void;
  setVolume: (vol: number) => Promise<void>;
  setPlaybackSpeed: (speed: number) => Promise<void>;
  addToQueue: (track: ArchiveTrack) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  playFromQueue: (index: number) => Promise<void>;
}

let statusSubscription: { remove: () => void } | null = null;

export const usePlayerStore = create<PlayerState>((set, get) => ({
  player: null,
  currentTrack: null,
  queue: [],
  queueTitle: "",
  currentIndex: 0,
  isPlaying: false,
  isBuffering: false,
  isLoaded: false,
  position: 0,
  duration: 0,
  repeatMode: "off",
  isShuffled: false,
  volume: 1,
  playbackSpeed: 1,

  loadTrack: async (track, queue = [], title = "Now Playing") => {
    const { player: currentPlayer } = get();
    const newQueue = queue.length > 0 ? queue : [track];
    const trackIndex = newQueue.findIndex((t) => t.id === track.id);

    const setupStatusListener = (p: AudioPlayer) => {
      if (statusSubscription) {
        statusSubscription.remove();
      }
      statusSubscription = p.addListener("playbackStatusUpdate", (status) => {
        set({
          isPlaying: status.playing,
          isBuffering: status.isBuffering,
          isLoaded: status.isLoaded,
          position: Math.floor((status.currentTime || 0) * 1000),
          duration: Math.floor((status.duration || 0) * 1000),
        });

        if (status.didJustFinish) {
          get().skipNext();
        }
      });
    };

    // If player already exists, use replace() to avoid re-creating native objects
    // This often resolves FigFilePlayer errors on iOS
    if (currentPlayer) {
      try {
        currentPlayer.pause();
        currentPlayer.replace({ uri: track.url });
        setupStatusListener(currentPlayer);
        set({
          currentTrack: track,
          queue: newQueue,
          queueTitle: title,
          currentIndex: trackIndex >= 0 ? trackIndex : 0,
          isPlaying: false,
          isBuffering: true,
          isLoaded: false,
          position: 0,
          duration: 0,
        });
        currentPlayer.play();
        useLibraryStore.getState().addToRecentlyPlayed(track);
        return;
      } catch (e) {
        console.error("Error replacing source, falling back to re-creation:", e);
        if (statusSubscription) {
          statusSubscription.remove();
          statusSubscription = null;
        }
        currentPlayer.remove();
      }
    }

    set({
      currentTrack: track,
      isPlaying: false,
      isBuffering: true,
      isLoaded: false,
      position: 0,
      duration: 0,
    });

    try {
      const player = createAudioPlayer(
        { uri: track.url },
        { updateInterval: 250 },
      );

      player.volume = get().volume;
      player.setPlaybackRate(get().playbackSpeed);

      setupStatusListener(player);

      player.play();
      useLibraryStore.getState().addToRecentlyPlayed(track);

      set({
        player,
        queue: newQueue,
        queueTitle: title,
        currentIndex: trackIndex >= 0 ? trackIndex : 0,
        isPlaying: true,
        isBuffering: false,
        isLoaded: player.isLoaded,
      });
    } catch (error) {
      console.error("Error loading track:", error);
      set({ isBuffering: false, isLoaded: false });
    }
  },

  togglePlayPause: async () => {
    const { player, isPlaying } = get();
    if (!player) return;

    if (isPlaying) {
      player.pause();
    } else {
      player.play();
    }
  },

  seekTo: async (position) => {
    const { player, isLoaded } = get();
    if (player && isLoaded) {
      try {
        await player.seekTo(position / 1000);
      } catch (e) {
        console.error("Seek error:", e);
      }
    }
  },

  skipNext: async () => {
    const { queue, currentIndex, repeatMode, isShuffled } = get();
    if (queue.length === 0) return;

    let nextIndex: number;

    if (repeatMode === "one") {
      await get().seekTo(0);
      return;
    }

    if (isShuffled) {
      nextIndex = Math.floor(Math.random() * queue.length);
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

    set({ currentIndex: nextIndex });
    await get().loadTrack(queue[nextIndex], queue);
  },

  skipPrevious: async () => {
    const { queue, currentIndex, position, repeatMode } = get();

    if (position > 3000) {
      await get().seekTo(0);
      return;
    }

    if (queue.length === 0) return;

    let prevIndex = currentIndex - 1;
    if (prevIndex < 0) {
      if (repeatMode === "all") {
        prevIndex = queue.length - 1;
      } else {
        return;
      }
    }

    set({ currentIndex: prevIndex });
    await get().loadTrack(queue[prevIndex], queue);
  },

  setRepeatMode: (mode) => set({ repeatMode: mode }),
  toggleShuffle: () => set((state) => ({ isShuffled: !state.isShuffled })),

  setVolume: async (vol) => {
    const { player } = get();
    if (player) {
      player.volume = vol;
    }
    set({ volume: vol });
  },

  setPlaybackSpeed: async (speed) => {
    const { player } = get();
    if (player) {
      player.setPlaybackRate(speed);
    }
    set({ playbackSpeed: speed });
  },

  addToQueue: (track) => {
    set((state) => ({ queue: [...state.queue, track] }));
  },

  removeFromQueue: (index) => {
    set((state) => {
      const newQueue = [...state.queue];
      newQueue.splice(index, 1);
      return { queue: newQueue };
    });
  },

  clearQueue: () => set({ queue: [], currentIndex: 0 }),

  playFromQueue: async (index) => {
    const { queue } = get();
    if (index >= 0 && index < queue.length) {
      set({ currentIndex: index });
      await get().loadTrack(queue[index], queue);
    }
  },
}));
