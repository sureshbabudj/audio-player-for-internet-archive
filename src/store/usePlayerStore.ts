import { useLibraryStore } from "@/store/useLibraryStore";
import { ArchiveTrack, RepeatMode } from "@/types";
import { AudioService } from "@/utils/audioService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface PlayerState {
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

let isChangingTrack = false;

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
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
        if (isChangingTrack) return;
        isChangingTrack = true;

        const newQueue = queue.length > 0 ? queue : [track];
        const trackIndex = newQueue.findIndex((t) => t.id === track.id);
        const initialIndex = trackIndex >= 0 ? trackIndex : 0;

        try {
          set({
            currentTrack: track,
            isPlaying: false,
            isBuffering: true,
            isLoaded: false,
            position: 0,
            duration: 0,
            queue: newQueue,
            queueTitle: title,
            currentIndex: initialIndex,
          });

          const playlist = await AudioService.initializePlaylist(
            newQueue,
            initialIndex,
            get().volume,
            get().playbackSpeed,
            (status) => {
              if (status.error) {
                console.error("Playlist status error:", status.error);
                set({ isPlaying: false, isBuffering: false, isLoaded: false });
              } else {
                const currentTrackInQueue = newQueue[status.currentIndex ?? initialIndex];
                
                // Sync metadata if track changed natively
                if (status.currentIndex !== get().currentIndex && status.currentIndex !== undefined) {
                  set({ 
                    currentIndex: status.currentIndex,
                    currentTrack: newQueue[status.currentIndex]
                  });
                }

                set({
                  isPlaying: status.playing,
                  isBuffering: status.isBuffering,
                  isLoaded: status.isLoaded,
                  position: Math.floor((status.currentTime || 0) * 1000),
                  duration: Math.floor((status.duration || 0) * 1000),
                });
              }
            },
            (newIndex) => {
              // Track changed natively (next/prev)
              set({ 
                currentIndex: newIndex,
                currentTrack: newQueue[newIndex]
              });
            }
          );

          playlist.play();
          useLibraryStore.getState().addToRecentlyPlayed(track);
        } catch (error) {
          console.error("Error loading playlist:", error);
          set({ isBuffering: false, isLoaded: false });
        } finally {
          isChangingTrack = false;
        }
      },

      togglePlayPause: async () => {
        const playlist = AudioService.getPlaylist();
        if (playlist) {
          if (get().isPlaying) {
            playlist.pause();
          } else {
            playlist.play();
          }
        }
      },

      seekTo: async (position) => {
        const playlist = AudioService.getPlaylist();
        if (playlist && get().isLoaded) {
          try {
            playlist.seekTo(position / 1000);
          } catch (e) {
            console.error("Seek error:", e);
          }
        }
      },

      skipNext: async () => {
        const playlist = AudioService.getPlaylist();
        if (playlist) {
          playlist.next();
        }
      },

      skipPrevious: async () => {
        const playlist = AudioService.getPlaylist();
        if (playlist) {
          const { position } = get();
          if (position > 3000) {
            playlist.seekTo(0);
          } else {
            playlist.previous();
          }
        }
      },

      setRepeatMode: (mode) => set({ repeatMode: mode }),
      toggleShuffle: () => set((state) => ({ isShuffled: !state.isShuffled })),

      setVolume: async (vol) => {
        const playlist = AudioService.getPlaylist();
        if (playlist) {
          playlist.volume = vol;
        }
        set({ volume: vol });
      },

      setPlaybackSpeed: async (speed) => {
        const playlist = AudioService.getPlaylist();
        if (playlist) {
          playlist.playbackRate = speed;
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
          await get().loadTrack(queue[index], queue, get().queueTitle);
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
      // Only persist data, not functions or volatile states
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
