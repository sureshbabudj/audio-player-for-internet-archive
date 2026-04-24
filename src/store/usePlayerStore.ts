import { ArchiveTrack, RepeatMode } from "@/types";
import { createAudioPlayer, type AudioPlayer } from "expo-audio";
import { create } from "zustand";

interface PlayerState {
  player: AudioPlayer | null;
  currentTrack: ArchiveTrack | null;
  queue: ArchiveTrack[];
  currentIndex: number;
  isPlaying: boolean;
  position: number;
  duration: number;
  repeatMode: RepeatMode;
  isShuffled: boolean;
  volume: number;
  playbackSpeed: number;

  loadTrack: (track: ArchiveTrack, queue?: ArchiveTrack[]) => Promise<void>;
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

type Subscription = { remove: () => void };
let statusSubscription: Subscription | null = null;

function teardownPlayer(player: AudioPlayer | null) {
  if (statusSubscription) {
    statusSubscription.remove();
    statusSubscription = null;
  }
  if (player) {
    player.remove();
  }
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  player: null,
  currentTrack: null,
  queue: [],
  currentIndex: 0,
  isPlaying: false,
  position: 0,
  duration: 0,
  repeatMode: "off",
  isShuffled: false,
  volume: 1,
  playbackSpeed: 1,

  loadTrack: async (track, queue = []) => {
    teardownPlayer(get().player);

    const newQueue = queue.length > 0 ? queue : [track];
    const trackIndex = newQueue.findIndex((t) => t.id === track.id);

    const player = createAudioPlayer({ uri: track.url }, { updateInterval: 250 });
    player.volume = get().volume;
    player.setPlaybackRate(get().playbackSpeed);

    statusSubscription = player.addListener("playbackStatusUpdate", (status) => {
      set({
        isPlaying: status.playing,
        position: Math.floor(status.currentTime * 1000),
        duration: Math.floor(status.duration * 1000),
      });

      if (status.didJustFinish) {
        get().skipNext();
      }
    });

    player.play();

    set({
      player,
      currentTrack: track,
      queue: newQueue,
      currentIndex: trackIndex >= 0 ? trackIndex : 0,
      isPlaying: true,
      position: 0,
      duration: 0,
    });
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
    const { player } = get();
    if (player) {
      await player.seekTo(position / 1000);
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

    await get().loadTrack(queue[nextIndex], queue);
    set({ currentIndex: nextIndex });
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

    await get().loadTrack(queue[prevIndex], queue);
    set({ currentIndex: prevIndex });
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
      await get().loadTrack(queue[index], queue);
      set({ currentIndex: index });
    }
  },
}));
