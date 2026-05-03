import { useState, useCallback, useEffect } from "react";
import { Track, AudioState } from "../types";

const hasExtensionRuntime =
  typeof globalThis !== "undefined" &&
  !!(globalThis as any).chrome?.runtime?.id &&
  typeof (globalThis as any).chrome?.runtime?.sendMessage === "function";

const sendRuntimeMessage = (message: unknown): Promise<any> => {
  if (!hasExtensionRuntime) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    try {
      (globalThis as any).chrome.runtime.sendMessage(
        message,
        (response: any) => {
          resolve(response);
        },
      );
    } catch {
      resolve(null);
    }
  });
};

const addRuntimeMessageListener = (listener: (message: any) => void) => {
  if (!hasExtensionRuntime) return;
  (globalThis as any).chrome.runtime.onMessage.addListener(listener);
};

const removeRuntimeMessageListener = (listener: (message: any) => void) => {
  if (!hasExtensionRuntime) return;
  (globalThis as any).chrome.runtime.onMessage.removeListener(listener);
};

const LOCAL_STORAGE_KEY = "audioPlayerWebState";

export function useAudioPlayer(tracks: Track[]) {
  const [hasHydrated, setHasHydrated] = useState(hasExtensionRuntime);
  const [state, setState] = useState<AudioState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 0.8,
    isMuted: false,
    shuffleMode: false,
    repeatMode: "off",
    currentTrack: null,
    tracksList: [],
  });

  // PWA/local-web fallback state
  const isExtension = hasExtensionRuntime;
  const webAudioRef = (globalThis as any).__audioPlayerWebAudioRef as
    | HTMLAudioElement
    | undefined;
  if (!webAudioRef && !isExtension && typeof window !== "undefined") {
    (globalThis as any).__audioPlayerWebAudioRef = new Audio();
  }
  const audio: HTMLAudioElement | null = !isExtension
    ? ((globalThis as any).__audioPlayerWebAudioRef as HTMLAudioElement)
    : null;

  // Initial state fetch
  useEffect(() => {
    if (isExtension) {
      sendRuntimeMessage({ type: "GET_AUDIO_STATE" }).then((remoteState) => {
        if (remoteState) setState(remoteState);
      });
      return;
    }

    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<AudioState>;
        setState((prev) => ({
          ...prev,
          ...parsed,
          isPlaying: false,
          currentTime: parsed.currentTime ?? 0,
        }));

        if (audio && parsed.currentTrack?.url) {
          audio.src = parsed.currentTrack.url;
          audio.volume = parsed.volume ?? 0.8;
          audio.muted = parsed.isMuted ?? false;

          const restoreTime = () => {
            audio.currentTime = parsed.currentTime ?? 0;
            audio.removeEventListener("loadedmetadata", restoreTime);
          };

          audio.addEventListener("loadedmetadata", restoreTime);
        }
      }
    } catch {
      // Ignore state restore failures and continue with defaults.
    } finally {
      setHasHydrated(true);
    }
  }, [audio, isExtension]);

  useEffect(() => {
    if (isExtension || !audio) return;

    const onTimeUpdate = () => {
      setState((prev) => ({ ...prev, currentTime: audio.currentTime || 0 }));
    };

    const onLoadedMetadata = () => {
      setState((prev) => ({
        ...prev,
        duration: Number.isFinite(audio.duration) ? audio.duration : 0,
      }));
    };

    const onPlay = () => {
      setState((prev) => ({ ...prev, isPlaying: true }));
    };

    const onPause = () => {
      setState((prev) => ({ ...prev, isPlaying: false }));
    };

    const onEnded = () => {
      setState((prev) => {
        if (prev.repeatMode === "one" && prev.currentTrack) {
          audio.currentTime = 0;
          void audio.play();
          return prev;
        }

        const list = prev.tracksList.length > 0 ? prev.tracksList : tracks;
        if (list.length === 0 || !prev.currentTrack) {
          return { ...prev, isPlaying: false };
        }

        let nextTrack: Track | null = null;
        if (prev.shuffleMode) {
          nextTrack = list[Math.floor(Math.random() * list.length)] ?? null;
        } else {
          const currentIndex = list.findIndex(
            (t) => t.id === prev.currentTrack?.id,
          );
          const nextIndex = currentIndex + 1;
          if (nextIndex < list.length) {
            nextTrack = list[nextIndex];
          } else if (prev.repeatMode === "all") {
            nextTrack = list[0] ?? null;
          }
        }

        if (!nextTrack) {
          return { ...prev, isPlaying: false };
        }

        audio.src = nextTrack.url;
        void audio.play();
        return {
          ...prev,
          currentTrack: nextTrack,
          isPlaying: true,
          currentTime: 0,
        };
      });
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
    };
  }, [audio, isExtension, tracks]);

  useEffect(() => {
    if (isExtension) return;
    if (!hasHydrated) return;
    try {
      localStorage.setItem(
        LOCAL_STORAGE_KEY,
        JSON.stringify({
          ...state,
          isPlaying: false,
        }),
      );
    } catch {
      // Ignore local storage write failures.
    }
  }, [hasHydrated, isExtension, state]);

  useEffect(() => {
    if (isExtension || !audio || !hasHydrated) return;

    audio.volume = state.volume;
    audio.muted = state.isMuted;

    if (state.currentTrack?.url && audio.src !== state.currentTrack.url) {
      audio.src = state.currentTrack.url;
    }
  }, [
    audio,
    hasHydrated,
    isExtension,
    state.currentTrack?.url,
    state.isMuted,
    state.volume,
  ]);

  useEffect(() => {
    if (isExtension) return;
    if (state.tracksList.length > 0 || tracks.length === 0) return;
    setState((prev) => ({ ...prev, tracksList: tracks }));
  }, [isExtension, state.tracksList.length, tracks]);

  // Listen for sync updates
  useEffect(() => {
    if (!isExtension) return;

    const handleMessage = (message: any) => {
      if (message.type === "SYNC_STATE") {
        setState(message.state);
      }
    };

    addRuntimeMessageListener(handleMessage);
    return () => removeRuntimeMessageListener(handleMessage);
  }, [isExtension]);

  const playTrack = useCallback(
    (track: Track) => {
      if (isExtension) {
        void sendRuntimeMessage({ type: "PLAY_TRACK", track });
      } else if (audio) {
        audio.src = track.url;
        audio.currentTime = 0;
        audio.volume = state.volume;
        audio.muted = state.isMuted;
        void audio.play();
      }

      setState((prev) => ({ ...prev, currentTrack: track, isPlaying: true }));
    },
    [audio, isExtension, state.isMuted, state.volume],
  );

  const togglePlay = useCallback(() => {
    if (isExtension) {
      void sendRuntimeMessage({ type: "TOGGLE_PLAY" });
      return;
    }

    if (!audio) return;

    if (!state.currentTrack) {
      const list = state.tracksList.length > 0 ? state.tracksList : tracks;
      if (list[0]) {
        audio.src = list[0].url;
        audio.volume = state.volume;
        audio.muted = state.isMuted;
        void audio.play();
        setState((prev) => ({
          ...prev,
          currentTrack: list[0],
          isPlaying: true,
        }));
      }
      return;
    }

    if (audio.paused) {
      void audio.play();
    } else {
      audio.pause();
    }
  }, [
    audio,
    isExtension,
    state.currentTrack,
    state.isMuted,
    state.tracksList,
    state.volume,
    tracks,
  ]);

  const playNext = useCallback(() => {
    if (isExtension) {
      void sendRuntimeMessage({ type: "PLAY_NEXT" });
      return;
    }

    if (!audio) return;
    setState((prev) => {
      const list = prev.tracksList.length > 0 ? prev.tracksList : tracks;
      if (list.length === 0) return prev;

      let nextTrack: Track;
      if (prev.shuffleMode) {
        nextTrack = list[Math.floor(Math.random() * list.length)];
      } else if (!prev.currentTrack) {
        nextTrack = list[0];
      } else {
        const currentIndex = list.findIndex(
          (t) => t.id === prev.currentTrack?.id,
        );
        const nextIndex = currentIndex + 1;
        if (nextIndex >= list.length) {
          if (prev.repeatMode === "all") {
            nextTrack = list[0];
          } else {
            audio.pause();
            return { ...prev, isPlaying: false };
          }
        } else {
          nextTrack = list[nextIndex];
        }
      }

      audio.src = nextTrack.url;
      audio.volume = prev.volume;
      audio.muted = prev.isMuted;
      void audio.play();
      return {
        ...prev,
        currentTrack: nextTrack,
        isPlaying: true,
        currentTime: 0,
      };
    });
  }, [audio, isExtension, tracks]);

  const playPrevious = useCallback(() => {
    if (isExtension) {
      void sendRuntimeMessage({ type: "PLAY_PREVIOUS" });
      return;
    }

    if (!audio) return;
    setState((prev) => {
      const list = prev.tracksList.length > 0 ? prev.tracksList : tracks;
      if (list.length === 0) return prev;

      let previousTrack: Track;
      if (prev.shuffleMode) {
        previousTrack = list[Math.floor(Math.random() * list.length)];
      } else if (!prev.currentTrack) {
        previousTrack = list[0];
      } else {
        const currentIndex = list.findIndex(
          (t) => t.id === prev.currentTrack?.id,
        );
        const previousIndex = currentIndex - 1;
        if (previousIndex < 0) {
          if (prev.repeatMode === "all") {
            previousTrack = list[list.length - 1];
          } else {
            previousTrack = list[0];
          }
        } else {
          previousTrack = list[previousIndex];
        }
      }

      audio.src = previousTrack.url;
      audio.volume = prev.volume;
      audio.muted = prev.isMuted;
      void audio.play();
      return {
        ...prev,
        currentTrack: previousTrack,
        isPlaying: true,
        currentTime: 0,
      };
    });
  }, [audio, isExtension, tracks]);

  const seek = useCallback(
    (time: number) => {
      if (isExtension) {
        void sendRuntimeMessage({ type: "SEEK", time });
        return;
      }

      if (!audio) return;
      audio.currentTime = time;
      setState((prev) => ({ ...prev, currentTime: time }));
    },
    [audio, isExtension],
  );

  const setVolume = useCallback(
    (volume: number) => {
      if (isExtension) {
        void sendRuntimeMessage({ type: "SET_VOLUME", volume });
        return;
      }

      if (audio) {
        audio.volume = volume;
      }
      setState((prev) => ({ ...prev, volume }));
    },
    [audio, isExtension],
  );

  const toggleMute = useCallback(() => {
    if (isExtension) {
      void sendRuntimeMessage({ type: "TOGGLE_MUTE" });
      return;
    }

    setState((prev) => {
      const nextMuted = !prev.isMuted;
      if (audio) {
        audio.muted = nextMuted;
      }
      return { ...prev, isMuted: nextMuted };
    });
  }, [audio, isExtension]);

  const toggleShuffle = useCallback(() => {
    if (isExtension) {
      void sendRuntimeMessage({ type: "TOGGLE_SHUFFLE" });
      return;
    }
    setState((prev) => ({ ...prev, shuffleMode: !prev.shuffleMode }));
  }, [isExtension]);

  const toggleRepeat = useCallback(() => {
    if (isExtension) {
      void sendRuntimeMessage({ type: "TOGGLE_REPEAT" });
      return;
    }

    setState((prev) => {
      const nextMode =
        prev.repeatMode === "off"
          ? "all"
          : prev.repeatMode === "all"
            ? "one"
            : "off";
      return { ...prev, repeatMode: nextMode };
    });
  }, [isExtension]);

  const playTracks = useCallback(
    (newTracks: Track[], startTrack: Track) => {
      if (isExtension) {
        void sendRuntimeMessage({
          type: "UPDATE_TRACKS_LIST",
          tracks: newTracks,
        });
        void sendRuntimeMessage({ type: "PLAY_TRACK", track: startTrack });
      } else if (audio) {
        audio.src = startTrack.url;
        audio.currentTime = 0;
        audio.volume = state.volume;
        audio.muted = state.isMuted;
        void audio.play();
      }

      setState((prev) => ({
        ...prev,
        tracksList: newTracks,
        currentTrack: startTrack,
        isPlaying: true,
        currentTime: 0,
      }));
    },
    [audio, isExtension, state.isMuted, state.volume],
  );

  return {
    state,
    playTrack,
    playTracks,
    togglePlay,
    playNext,
    playPrevious,
    seek,
    setVolume,
    toggleMute,
    toggleShuffle,
    toggleRepeat,
  };
}
