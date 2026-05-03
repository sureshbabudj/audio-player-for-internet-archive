import React from "react";
import { useTracks } from "../hooks/useTracks";
import { useAudioPlayer } from "../hooks/useAudioPlayer";
import AudioPlayer from "../components/AudioPlayer";
import { Icon } from "@iconify/react";

const App: React.FC = () => {
  const { tracks, loading, error } = useTracks();
  const {
    state,
    playTracks,
    togglePlay,
    playNext,
    playPrevious,
    seek,
    setVolume,
    toggleMute,
    toggleShuffle,
    toggleRepeat,
  } = useAudioPlayer(tracks);

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-dark-400">
        <div className="relative mb-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 animate-pulse flex items-center justify-center">
            <Icon
              icon="solar:vinyl-record-bold-duotone"
              className="w-10 h-10 text-white animate-spin-slow"
            />
          </div>
        </div>
        <p className="text-sm animate-pulse">Loading tracks...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-red-400 px-4 text-center">
        <Icon
          icon="solar:close-circle-bold-duotone"
          className="w-12 h-12 mb-3"
        />
        <p className="text-sm">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <AudioPlayer
      tracks={tracks}
      currentTrack={state.currentTrack}
      isPlaying={state.isPlaying}
      currentTime={state.currentTime}
      duration={state.duration}
      volume={state.volume}
      isMuted={state.isMuted}
      shuffleMode={state.shuffleMode}
      repeatMode={state.repeatMode}
      tracksList={state.tracksList}
      onTrackSelect={(track) => playTracks(tracks, track)}
      onPlayTracks={playTracks}
      onTogglePlay={togglePlay}
      onPrevious={playPrevious}
      onNext={playNext}
      onSeek={seek}
      onVolumeChange={setVolume}
      onToggleMute={toggleMute}
      onToggleShuffle={toggleShuffle}
      onToggleRepeat={toggleRepeat}
    />
  );
};

export default App;
