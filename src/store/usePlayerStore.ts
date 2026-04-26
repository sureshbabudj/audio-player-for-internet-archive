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

        let attempts = 0;
        const maxAttempts = 2;

        while (attempts < maxAttempts) {
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
              currentIndex: trackIndex >= 0 ? trackIndex : 0,
            });

            // Fail-safe: Verify URL connectivity before loading into native player
            if (attempts === 0) {
              try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000);
                const check = await fetch(track.url, { 
                  method: "HEAD", 
                  signal: controller.signal 
                });
                clearTimeout(timeoutId);
                
                if (!check.ok && check.status !== 405) { // 405 Method Not Allowed is fine for HEAD
                  throw new Error(`URL not reachable: ${check.status}`);
                }
              } catch (e) {
                console.warn("Pre-fetch check failed, but proceeding to native player:", e);
              }
            }

            const player = await AudioService.initializePlayer(
              track,
              get().volume,
              get().playbackSpeed,
              (status) => {
                if (status.error) {
                  console.error("Playback status error:", status.error);
                  set({ isPlaying: false, isBuffering: false, isLoaded: false });
                } else {
                  set({
                    isPlaying: status.playing,
                    isBuffering: status.isBuffering,
                    isLoaded: status.isLoaded,
                    position: Math.floor((status.currentTime || 0) * 1000),
                    duration: Math.floor((status.duration || 0) * 1000),
                  });
                }
              },
              () => get().skipNext(),
            );

            // Small delay to ensure native buffer is ready
            await new Promise(resolve => setTimeout(resolve, 200));
            player.play();
            
            useLibraryStore.getState().addToRecentlyPlayed(track);
            break; // Success!
          } catch (error) {
            attempts++;
            console.error(`Attempt ${attempts} failed for ${track.title}:`, error);
            
            if (attempts >= maxAttempts) {
              set({ isBuffering: false, isLoaded: false });
            } else {
              // Wait before retry
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
        }
        
        isChangingTrack = false;
      },

      togglePlayPause: async () => {
        const player = AudioService.getPlayer();
        if (!player) {
          // If app restarted and we have a currentTrack, load it but don't auto-play immediately?
          // Or just load and play.
          const { currentTrack, queue, queueTitle } = get();
          if (currentTrack) {
            await get().loadTrack(currentTrack, queue, queueTitle);
            return;
          }
          return;
        }

        if (get().isPlaying) {
          player.pause();
        } else {
          player.play();
        }
      },

      seekTo: async (position) => {
        const player = AudioService.getPlayer();
        if (player && get().isLoaded) {
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

        if (repeatMode === "one") {
          await get().seekTo(0);
          return;
        }

        let nextIndex: number;
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

        await get().loadTrack(queue[nextIndex], queue, get().queueTitle);
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

        await get().loadTrack(queue[prevIndex], queue, get().queueTitle);
      },

      setRepeatMode: (mode) => set({ repeatMode: mode }),
      toggleShuffle: () => set((state) => ({ isShuffled: !state.isShuffled })),

      setVolume: async (vol) => {
        const player = AudioService.getPlayer();
        if (player) {
          player.volume = vol;
        }
        set({ volume: vol });
      },

      setPlaybackSpeed: async (speed) => {
        const player = AudioService.getPlayer();
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
