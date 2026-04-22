import React, { useEffect } from "react";
import { Track, Playlist } from "../types";
import TrackItem from "./TrackItem";

interface TrackListProps {
  tracks: Track[];
  currentTrack: Track | null;
  isPlaying: boolean;
  onTrackSelect: (track: Track) => void;
  playlists?: Playlist[];
  onAddToPlaylist?: (playlistId: string, track: Track) => void;
  shouldScroll?: boolean;
}

const TrackList: React.FC<TrackListProps> = ({
  tracks,
  currentTrack,
  isPlaying,
  onTrackSelect,
  playlists = [],
  onAddToPlaylist,
  shouldScroll = false,
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (shouldScroll && currentTrack && containerRef.current) {
      const activeElement = containerRef.current.querySelector(
        `[data-track-id="${currentTrack.id}"]`
      ) as HTMLElement;
      
      if (activeElement) {
        const container = containerRef.current;
        const elementTop = activeElement.offsetTop;
        const containerHeight = container.clientHeight;
        const elementHeight = activeElement.clientHeight;
        
        // Instant scroll to center
        container.scrollTop = elementTop - containerHeight / 2 + elementHeight / 2;
      }
    }
  }, [currentTrack?.id, shouldScroll, tracks.length]);

  return (
    <div 
      ref={containerRef}
      className="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar"
    >
      {tracks.map((track, index) => (
        <TrackItem
          key={track.id}
          track={track}
          index={index}
          isActive={currentTrack?.id === track.id}
          isPlaying={isPlaying}
          onClick={() => onTrackSelect(track)}
          playlists={playlists}
          onAddToPlaylist={onAddToPlaylist}
        />
      ))}
    </div>
  );
};

export default TrackList;
