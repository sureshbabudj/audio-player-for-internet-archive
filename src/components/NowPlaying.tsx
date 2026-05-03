import React from "react";
import { Icon } from "@iconify/react";
import { Track } from "../types";
import Visualizer from "./Visualizer";

interface NowPlayingProps {
  track: Track | null;
  isPlaying: boolean;
}

const NowPlaying: React.FC<NowPlayingProps> = ({ track, isPlaying }) => {
  if (!track) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-dark-400">
        <Icon
          icon="solar:music-note-bold-duotone"
          className="w-16 h-16 mb-4 opacity-50"
        />
        <p className="text-sm">Select a track to play</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center py-4">
      {/* 3D Album Art / Thumbnail */}
      <div className="relative mb-4 group">
        <div className="w-32 h-32 rounded-2xl bg-dark-800 overflow-hidden shadow-2xl transform rotate-3 group-hover:rotate-0 transition-transform duration-500 flex items-center justify-center border-2 border-primary-500/30">
          {track.artwork ? (
            <img
              src={track.artwork}
              alt={track.name}
              className={`w-full h-full object-cover transition-all duration-700 ${
                isPlaying ? "scale-110" : "scale-100 grayscale-[0.2]"
              }`}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary-500 to-dark-900 flex items-center justify-center">
              <Icon
                icon="solar:vinyl-record-bold-duotone"
                className={`w-20 h-20 text-white/90 ${
                  isPlaying ? "animate-spin-slow" : ""
                }`}
              />
            </div>
          )}
          {/* Glass Overlay */}
          <div className="absolute inset-0 bg-gradient-to-tr from-black/40 to-transparent pointer-events-none" />
        </div>
        <div className="absolute -bottom-2 -right-2 w-32 h-32 rounded-2xl bg-primary-500/20 -z-10 transform -rotate-3 blur-sm" />
      </div>

      <Visualizer isPlaying={isPlaying} />

      <div className="mt-4 text-center px-4 w-full">
        <h3 className="text-white font-bold text-sm truncate">
          {track.name}
        </h3>
        <p className="text-primary-400/80 text-[11px] font-medium mt-0.5 truncate">
          {track.artist}
        </p>
        <p className="text-dark-500 text-[10px] mt-1 truncate italic">
          {track.album}
        </p>
      </div>
    </div>
  );
};

export default NowPlaying;
