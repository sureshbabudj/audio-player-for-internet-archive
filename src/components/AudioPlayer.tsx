import React, { useState } from "react";
import { Track, Playlist } from "../types";
import NowPlaying from "./NowPlaying";
import PlayerControls from "./PlayerControls";
import TrackList from "./TrackList";
import PlaylistManager from "./PlaylistManager";
import { Icon } from "@iconify/react";
import { usePlaylists } from "../hooks/usePlaylists";

interface AudioPlayerProps {
  tracks: Track[];
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  shuffleMode: boolean;
  repeatMode: "off" | "all" | "one";
  tracksList: Track[];
  onTrackSelect: (track: Track) => void;
  onPlayTracks: (tracks: Track[], startTrack: Track) => void;
  onTogglePlay: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (volume: number) => void;
  onToggleMute: () => void;
  onToggleShuffle: () => void;
  onToggleRepeat: () => void;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({
  tracks: initialTracks,
  currentTrack,
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted,
  shuffleMode,
  repeatMode,
  tracksList,
  onTrackSelect,
  onPlayTracks,
  onTogglePlay,
  onPrevious,
  onNext,
  onSeek,
  onVolumeChange,
  onToggleMute,
  onToggleShuffle,
  onToggleRepeat,
}) => {
  const [isPlaylistOpen, setIsPlaylistOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "browse" | "library" | "settings" | "help"
  >("browse");
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(
    null,
  );

  const {
    playlists,
    createPlaylist,
    deletePlaylist,
    addTrackToPlaylist,
    importFromArchive,
    exportAll,
    importAll,
  } = usePlaylists();

  // For the 'Browse' tab, we want to show the current active tracks list from background
  // but since we get 'tracks' as a prop (which is initialTracks), we use that for now.
  // Ideally, the background would broadcast its full list.

  return (
    <div className="flex flex-col h-full relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-dark-800">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-primary-500 flex items-center justify-center shadow-lg shadow-primary-500/20">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 500 500"
              className="w-10 h-10 text-primary-100"
            >
              <path
                fill="currentColor"
                d="M 495.36 250 C 495.36 385.509 385.509 495.36 250 495.36 C 114.491 495.36 4.64 385.509 4.64 250 C 4.64 114.491 114.491 4.64 250 4.64 C 385.509 4.64 495.36 114.491 495.36 250 Z M 377.807 174.915 L 377.807 325.084 C 377.809 343.088 377.809 359.251 376.96 373.245 C 376.662 378.186 376.257 382.855 375.707 387.241 C 375.462 389.21 375.182 391.17 374.861 393.12 C 374.209 397.08 377.27 400.814 381.267 400.462 C 389.163 399.769 396.292 398.291 402.951 394.644 C 413.371 388.936 421.844 379.827 427.155 368.625 C 430.547 361.466 431.923 353.801 432.568 345.316 C 433.191 337.116 433.191 327.028 433.191 314.694 L 433.191 185.308 C 433.191 172.973 433.191 162.883 432.568 154.685 C 431.923 146.198 430.547 138.533 427.155 131.375 C 421.844 120.173 413.371 111.065 402.951 105.357 C 396.292 101.71 389.163 100.231 381.267 99.537 C 377.27 99.186 374.209 102.921 374.861 106.88 C 375.182 108.829 375.462 110.79 375.707 112.759 C 376.257 117.145 376.662 121.815 376.96 126.755 C 377.809 140.749 377.809 156.911 377.807 174.915 Z M 123.039 126.755 C 123.338 121.815 123.744 117.145 124.292 112.759 C 124.539 110.79 124.819 108.829 125.139 106.88 C 125.791 102.921 122.73 99.186 118.732 99.537 C 110.838 100.231 103.708 101.71 97.049 105.357 C 86.628 111.065 78.156 120.173 72.846 131.375 C 69.453 138.533 68.077 146.198 67.432 154.685 C 66.809 162.884 66.809 172.972 66.809 185.308 L 66.809 314.692 C 66.809 327.028 66.809 337.116 67.432 345.316 C 68.077 353.801 69.453 361.466 72.846 368.625 C 78.156 379.827 86.628 388.936 97.049 394.644 C 103.708 398.291 110.838 399.769 118.732 400.462 C 122.73 400.814 125.791 397.08 125.139 393.12 C 124.819 391.17 124.539 389.21 124.292 387.241 C 123.744 382.855 123.338 378.186 123.039 373.245 C 122.191 359.251 122.191 343.088 122.192 325.084 L 122.192 174.915 C 122.191 156.911 122.191 140.749 123.039 126.755 Z M 147.754 323.276 C 147.754 375.09 147.754 400.997 162.728 417.094 C 177.701 433.191 201.801 433.191 250 433.191 C 298.199 433.191 322.298 433.191 337.272 417.094 C 352.246 400.997 352.246 375.09 352.246 323.276 L 352.246 176.724 C 352.246 124.909 352.246 99.002 337.272 82.906 C 322.298 66.809 298.199 66.809 250 66.809 C 201.801 66.809 177.701 66.809 162.728 82.906 C 147.754 99.002 147.754 124.909 147.754 176.724 Z M 304.957 199.623 C 312.545 199.623 318.697 205.774 318.697 213.362 C 318.697 220.95 312.545 227.101 304.957 227.101 C 296.712 227.101 288.928 225.121 282.058 221.607 L 282.058 286.638 C 282.058 314.461 259.504 337.016 231.681 337.016 C 203.858 337.016 181.303 314.461 181.303 286.638 C 181.303 258.815 203.858 236.261 231.681 236.261 C 239.926 236.261 247.71 238.241 254.58 241.755 L 254.58 176.724 C 254.58 169.136 260.731 162.984 268.319 162.984 C 275.907 162.984 282.058 169.136 282.058 176.724 C 282.058 189.37 292.31 199.623 304.957 199.623 Z M 208.782 286.638 C 208.782 299.286 219.033 309.537 231.681 309.537 C 244.328 309.537 254.58 299.286 254.58 286.638 C 254.58 273.991 244.328 263.739 231.681 263.739 C 219.033 263.739 208.782 273.991 208.782 286.638 Z"
              ></path>
            </svg>
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-tight">
              Audio Player
            </h1>
            <p className="text-dark-500 text-xs">for Internet Archive</p>
          </div>
        </div>

        <button
          onClick={() => {
            setIsPlaylistOpen(!isPlaylistOpen);
            if (!isPlaylistOpen) setSelectedPlaylist(null);
          }}
          className={`p-2 rounded-lg transition-all duration-300 ${
            isPlaylistOpen
              ? "bg-primary-500 text-white rotate-90"
              : "text-dark-500 hover:text-white"
          }`}
        >
          <Icon
            icon={
              isPlaylistOpen
                ? "solar:close-circle-bold"
                : "solar:hamburger-menu-bold"
            }
            className="w-6 h-6"
          />
        </button>
      </div>

      <div className="relative flex-1 flex flex-col min-h-0">
        {/* Main Player Content */}
        <div
          className={`flex-1 flex flex-col transition-all duration-500 ${isPlaylistOpen ? "opacity-0 scale-95 pointer-events-none" : "opacity-100 scale-100"}`}
        >
          <NowPlaying track={currentTrack} isPlaying={isPlaying} />

          <div className="mt-auto mb-4">
            <PlayerControls
              isPlaying={isPlaying}
              onTogglePlay={onTogglePlay}
              onPrevious={onPrevious}
              onNext={onNext}
              currentTime={currentTime}
              duration={duration}
              onSeek={onSeek}
              volume={volume}
              onVolumeChange={onVolumeChange}
              shuffleMode={shuffleMode}
              onToggleShuffle={onToggleShuffle}
              repeatMode={repeatMode}
              onToggleRepeat={onToggleRepeat}
              isMuted={isMuted}
              onToggleMute={onToggleMute}
            />
          </div>
        </div>

        {/* Navigation Overlay */}
        <div
          className={`absolute inset-0 z-10 bg-dark-950/90 backdrop-blur-xl transition-all duration-500 flex flex-col rounded-2xl ${
            isPlaylistOpen
              ? "translate-y-0 opacity-100"
              : "translate-y-full opacity-0"
          }`}
        >
          {/* Horizontal Scroll Tabs */}
          <div className="flex overflow-x-auto no-scrollbar bg-dark-900/50 p-1.5 rounded-2xl mb-4 mx-2 border border-dark-800">
            {[
              { id: "browse", icon: "solar:play-circle-bold", label: "Queue" },
              {
                id: "library",
                icon: "solar:music-library-bold",
                label: "Library",
              },
              {
                id: "settings",
                icon: "solar:settings-bold",
                label: "Settings",
              },
              { id: "help", icon: "solar:help-bold", label: "Help" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setSelectedPlaylist(null);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-primary-500 text-white shadow-lg"
                    : "text-dark-400 hover:text-white"
                }`}
              >
                <Icon icon={tab.icon} className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-1 flex flex-col min-h-0 overflow-hidden px-2 pb-2">
            {activeTab === "browse" ? (
              <div className="flex flex-col h-full overflow-hidden">
                <div className="flex items-center gap-2 mb-3 px-1 text-dark-500">
                  <Icon
                    icon="solar:playlist-minimalistic-bold"
                    className="w-4 h-4"
                  />
                  <span className="text-[10px] uppercase font-bold tracking-widest">
                    Now Playing Queue
                  </span>
                </div>
                <TrackList
                  tracks={tracksList.length > 0 ? tracksList : initialTracks}
                  currentTrack={currentTrack}
                  isPlaying={isPlaying}
                  playlists={playlists}
                  onAddToPlaylist={addTrackToPlaylist}
                  onTrackSelect={(track) => {
                    const activeList =
                      tracksList.length > 0 ? tracksList : initialTracks;
                    onPlayTracks(activeList, track);
                    setIsPlaylistOpen(false);
                  }}
                  shouldScroll={true}
                />
              </div>
            ) : activeTab === "library" ? (
              selectedPlaylist ? (
                <div className="flex flex-col h-full overflow-hidden">
                  <div className="flex items-center gap-2 mb-3 px-1">
                    <button
                      onClick={() => setSelectedPlaylist(null)}
                      className="p-1 text-dark-500 hover:text-primary-400 transition-colors"
                    >
                      <Icon
                        icon="solar:alt-arrow-left-bold"
                        className="w-5 h-5"
                      />
                    </button>
                    <h4 className="text-white font-bold truncate flex-1">
                      {selectedPlaylist.name}
                    </h4>
                  </div>
                  <TrackList
                    tracks={selectedPlaylist.tracks}
                    currentTrack={currentTrack}
                    isPlaying={isPlaying}
                    onTrackSelect={(track) => {
                      onPlayTracks(selectedPlaylist.tracks, track);
                      setIsPlaylistOpen(false);
                    }}
                  />
                </div>
              ) : (
                <PlaylistManager
                  playlists={playlists}
                  onCreate={createPlaylist}
                  onDelete={deletePlaylist}
                  onImportFromArchive={importFromArchive}
                  onSelect={setSelectedPlaylist}
                  onPlayPlaylist={(p) => {
                    if (p.tracks.length > 0) {
                      onPlayTracks(p.tracks, p.tracks[0]);
                      setIsPlaylistOpen(false);
                    }
                  }}
                />
              )
            ) : activeTab === "settings" ? (
              <div className="flex flex-col space-y-6 px-1 pt-2">
                <section>
                  <h3 className="text-[10px] font-bold text-dark-500 uppercase tracking-widest mb-4">
                    Backup & Restore
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    <button
                      onClick={exportAll}
                      className="flex items-center justify-between p-4 rounded-2xl bg-dark-900/50 border border-dark-800 hover:border-primary-500/50 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-500 group-hover:bg-primary-500 group-hover:text-white transition-all">
                          <Icon
                            icon="solar:download-square-bold"
                            className="w-6 h-6"
                          />
                        </div>
                        <div className="text-left">
                          <h4 className="text-white text-sm font-bold">
                            Export Data
                          </h4>
                          <p className="text-dark-500 text-[10px]">
                            Download your playlists as JSON
                          </p>
                        </div>
                      </div>
                      <Icon
                        icon="solar:alt-arrow-right-bold"
                        className="w-4 h-4 text-dark-600"
                      />
                    </button>

                    <label className="flex items-center justify-between p-4 rounded-2xl bg-dark-900/50 border border-dark-800 hover:border-primary-500/50 transition-all group cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-500 group-hover:bg-primary-500 group-hover:text-white transition-all">
                          <Icon
                            icon="solar:upload-square-bold"
                            className="w-6 h-6"
                          />
                        </div>
                        <div className="text-left">
                          <h4 className="text-white text-sm font-bold">
                            Import Data
                          </h4>
                          <p className="text-dark-500 text-[10px]">
                            Restore from a backup file
                          </p>
                        </div>
                      </div>
                      <Icon
                        icon="solar:alt-arrow-right-bold"
                        className="w-4 h-4 text-dark-600"
                      />
                      <input
                        type="file"
                        accept=".json"
                        className="hidden"
                        onChange={(e) =>
                          e.target.files?.[0] && importAll(e.target.files[0])
                        }
                      />
                    </label>
                  </div>
                </section>

                <section>
                  <h3 className="text-[10px] font-bold text-dark-500 uppercase tracking-widest mb-4">
                    About
                  </h3>
                  <div className="p-4 rounded-2xl bg-dark-900/50 border border-dark-800">
                    <p className="text-dark-400 text-xs leading-relaxed">
                      Audio Player is a high-fidelity music player powered by
                      Archive.org collections. Built for performance and
                      privacy.
                    </p>
                    <div className="mt-4 pt-4 border-t border-dark-800 flex justify-between text-[10px] text-dark-600 font-bold">
                      <span>Version 2.0.0</span>
                      <span>© 2026 Audio Player</span>
                    </div>
                  </div>
                </section>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 px-1 pt-2 pb-4">
                <h3 className="text-[10px] font-bold text-dark-500 uppercase tracking-widest mb-2">
                  How to use
                </h3>
                {[
                  {
                    q: "How do I import songs?",
                    a: "Go to Library > My Collections and click 'Import IA'. Paste an Archive.org URL or identifier.",
                  },
                  {
                    q: "What is the Queue?",
                    a: "The 'Queue' tab shows the songs currently loaded in your player. You can switch between playlists easily.",
                  },
                  {
                    q: "How do I backup my music?",
                    a: "Use the 'Settings' tab to export your playlists as a JSON file. You can import them on any device.",
                  },
                  {
                    q: "Does it work offline?",
                    a: "It requires an internet connection to stream from Archive.org, but your playlists are saved locally.",
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-2xl bg-dark-900/50 border border-dark-800"
                  >
                    <h4 className="text-white text-xs font-bold mb-1">
                      {item.q}
                    </h4>
                    <p className="text-dark-100 text-[10px] leading-relaxed">
                      {item.a}
                    </p>
                  </div>
                ))}

                <div className="mt-auto p-4 rounded-2xl bg-primary-500/10 border border-primary-500/20 text-center">
                  <Icon
                    icon="solar:heart-bold"
                    className="w-8 h-8 text-primary-500 mx-auto mb-2"
                  />
                  <p className="text-primary-400 text-xs font-bold">
                    Enjoying the player?
                  </p>
                  <p className="text-primary-400/60 text-[9px]">
                    Check out more on Archive.org
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;
