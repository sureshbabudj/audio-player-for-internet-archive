import React from "react";
import { Icon } from "@iconify/react";

interface PlayerControlsProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  onPrevious: () => void;
  onNext: () => void;
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  volume: number;
  onVolumeChange: (volume: number) => void;
  shuffleMode: boolean;
  onToggleShuffle: () => void;
  repeatMode: "off" | "all" | "one";
  onToggleRepeat: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

const formatTime = (time: number): string => {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

const PlayerControls: React.FC<PlayerControlsProps> = ({
  isPlaying,
  onTogglePlay,
  onPrevious,
  onNext,
  currentTime,
  duration,
  onSeek,
  volume,
  onVolumeChange,
  shuffleMode,
  onToggleShuffle,
  repeatMode,
  onToggleRepeat,
  isMuted,
  onToggleMute,
}) => {
  const progress = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="relative h-1.5 bg-dark-800 rounded-full overflow-hidden">
          <div
            className="absolute h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
          <input
            type="range"
            min={0}
            max={duration || 0}
            value={currentTime}
            onChange={(e) => onSeek(Number(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>
        <div className="flex justify-between text-xs text-dark-500 font-medium">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Main Controls */}
      <div className="flex items-center justify-between px-2">
        <button
          onClick={onToggleShuffle}
          className={`p-2 rounded-lg transition-colors ${
            shuffleMode ? "text-primary-500" : "text-dark-500"
          }`}
          title="Shuffle"
        >
          <Icon icon="solar:shuffle-bold" className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-4">
          <button
            onClick={onPrevious}
            className="p-2 text-white hover:text-primary-400 transition-colors"
          >
            <Icon icon="solar:skip-previous-bold" className="w-6 h-6" />
          </button>

          <button
            onClick={onTogglePlay}
            className="w-12 h-12 flex items-center justify-center rounded-full bg-primary-500 hover:bg-primary-600 text-white transition-all transform active:scale-95 shadow-lg shadow-primary-500/20"
          >
            <Icon
              icon={isPlaying ? "solar:pause-bold" : "solar:play-bold"}
              className="w-7 h-7"
            />
          </button>

          <button
            onClick={onNext}
            className="p-2 text-white hover:text-primary-400 transition-colors"
          >
            <Icon icon="solar:skip-next-bold" className="w-6 h-6" />
          </button>
        </div>

        <button
          onClick={onToggleRepeat}
          className={`p-2 rounded-lg transition-colors relative ${
            repeatMode !== "off" ? "text-primary-500" : "text-dark-500"
          }`}
          title="Repeat"
        >
          <Icon
            icon={repeatMode === "one" ? "solar:repeat-one-bold" : "solar:repeat-bold"}
            className="w-5 h-5"
          />
          {repeatMode === "all" && (
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary-500 rounded-full border-2 border-dark-950" />
          )}
        </button>
      </div>

      {/* Volume Control */}
      <div className="flex items-center gap-3 px-1">
        <button
          onClick={onToggleMute}
          className={`transition-colors ${
            isMuted ? "text-red-500" : "text-dark-500 hover:text-primary-400"
          }`}
          title={isMuted ? "Unmute" : "Mute"}
        >
          <Icon
            icon={
              isMuted
                ? "solar:volume-cross-bold"
                : volume < 0.5
                ? "solar:volume-low-bold"
                : "solar:volume-loud-bold"
            }
            className="w-5 h-5"
          />
        </button>
        <div className="relative flex-1 h-1.5 bg-dark-800 rounded-full group">
          <div
            className={`absolute h-full rounded-full transition-all ${
              isMuted ? "bg-dark-600" : "bg-primary-500/50"
            }`}
            style={{ width: `${volume * 100}%` }}
          />
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => onVolumeChange(Number(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
        </div>
      </div>
    </div>
  );
};

export default PlayerControls;
