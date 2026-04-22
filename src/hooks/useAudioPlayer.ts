import { useState, useCallback, useEffect } from "react";
import { Track, AudioState } from "../types";
import browser from "webextension-polyfill";

export function useAudioPlayer(tracks: Track[]) {
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

  // Initial state fetch
  useEffect(() => {
    browser.runtime.sendMessage({ type: "GET_AUDIO_STATE" }).then((remoteState) => {
      if (remoteState) setState(remoteState);
    });
  }, []);

  // Listen for sync updates
  useEffect(() => {
    const handleMessage = (message: any) => {
      if (message.type === "SYNC_STATE") {
        setState(message.state);
      }
    };

    browser.runtime.onMessage.addListener(handleMessage);
    return () => browser.runtime.onMessage.removeListener(handleMessage);
  }, []);

  const playTrack = useCallback((track: Track) => {
    browser.runtime.sendMessage({ type: "PLAY_TRACK", track });
    setState((prev) => ({ ...prev, currentTrack: track, isPlaying: true }));
  }, []);

  const togglePlay = useCallback(() => {
    browser.runtime.sendMessage({ type: "TOGGLE_PLAY" });
  }, []);

  const playNext = useCallback(() => {
    browser.runtime.sendMessage({ type: "PLAY_NEXT" });
  }, []);

  const playPrevious = useCallback(() => {
    browser.runtime.sendMessage({ type: "PLAY_PREVIOUS" });
  }, []);

  const seek = useCallback((time: number) => {
    browser.runtime.sendMessage({ type: "SEEK", time });
  }, []);

  const setVolume = useCallback((volume: number) => {
    browser.runtime.sendMessage({ type: "SET_VOLUME", volume });
  }, []);

  const toggleMute = useCallback(() => {
    browser.runtime.sendMessage({ type: "TOGGLE_MUTE" });
  }, []);

  const toggleShuffle = useCallback(() => {
    browser.runtime.sendMessage({ type: "TOGGLE_SHUFFLE" });
  }, []);

  const toggleRepeat = useCallback(() => {
    browser.runtime.sendMessage({ type: "TOGGLE_REPEAT" });
  }, []);

  const playTracks = useCallback((newTracks: Track[], startTrack: Track) => {
    browser.runtime.sendMessage({ type: "UPDATE_TRACKS_LIST", tracks: newTracks });
    browser.runtime.sendMessage({ type: "PLAY_TRACK", track: startTrack });
    setState((prev) => ({ ...prev, currentTrack: startTrack, isPlaying: true }));
  }, []);

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
