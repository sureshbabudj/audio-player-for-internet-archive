import React, { useState } from "react";
import { Icon } from "@iconify/react";
import { Track, Playlist } from "../types";

interface TrackItemProps {
  track: Track;
  isActive: boolean;
  isPlaying: boolean;
  onClick: () => void;
  index: number;
  playlists?: Playlist[];
  onAddToPlaylist?: (playlistId: string, track: Track) => void;
}

const TrackItem: React.FC<TrackItemProps> = ({
  track,
  isActive,
  isPlaying,
  onClick,
  index,
  playlists = [],
  onAddToPlaylist,
}) => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="relative group/item" data-track-id={track.id}>
      <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-300 group ${
          isActive
            ? "bg-gradient-to-r from-primary-500/20 to-primary-600/10 border border-primary-500/30"
            : "hover:bg-dark-800/50 border border-transparent"
        }`}
      >
        {/* Track Number / Playing Indicator */}
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
            isActive
              ? "bg-primary-500 text-white"
              : "bg-dark-800 text-dark-400 group-hover:text-primary-400"
          }`}
        >
          {isActive && isPlaying ? (
            <Icon icon="solar:play-bold" className="w-4 h-4 animate-pulse" />
          ) : (
            <span>{index + 1}</span>
          )}
        </div>

        {/* Track Info */}
        <div className="flex-1 text-left min-w-0">
          <p
            className={`text-sm font-medium truncate ${
              isActive
                ? "text-primary-300"
                : "text-dark-200 group-hover:text-white"
            }`}
          >
            {track.name}
          </p>
        </div>

        {/* Add to Playlist Toggle */}
        {onAddToPlaylist && playlists.length > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-2 rounded-lg bg-dark-900/50 text-dark-500 hover:text-primary-400 opacity-0 group-hover:opacity-100 transition-all active:scale-90"
          >
            <Icon icon="solar:add-circle-bold" className="w-5 h-5" />
          </button>
        )}

        {/* 3D Icon */}
        <Icon
          icon={
            isActive ? "solar:music-note-2-bold-duotone" : "solar:music-note-bold"
          }
          className={`w-5 h-5 flex-shrink-0 ${
            isActive
              ? "text-primary-400"
              : "text-dark-600 group-hover:text-dark-400"
          }`}
        />
      </button>

      {/* Mini Playlist Selection Menu */}
      {showMenu && (
        <>
          <div 
            className="fixed inset-0 z-20" 
            onClick={() => setShowMenu(false)} 
          />
          <div className="absolute right-12 top-0 z-30 w-40 bg-dark-900 border border-dark-700 rounded-xl shadow-2xl overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-3 py-1.5 text-[10px] font-bold text-dark-500 uppercase tracking-wider border-b border-dark-800">
              Add to Playlist
            </div>
            <div className="max-h-32 overflow-y-auto custom-scrollbar">
              {playlists.map((p) => (
                <button
                  key={p.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddToPlaylist?.(p.id, track);
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-dark-200 hover:bg-primary-500 hover:text-white transition-colors"
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TrackItem;
