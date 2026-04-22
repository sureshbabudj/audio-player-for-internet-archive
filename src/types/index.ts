export interface Track {
  id: string | number;
  name: string;
  url: string;
  artwork?: string;
  duration?: number;
  playlistId?: string;
  artist?: string;
  album?: string;
}

export interface AudioState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  shuffleMode: boolean;
  repeatMode: "off" | "all" | "one";
  currentTrack: Track | null;
  tracksList: Track[];
}

export interface Playlist {
  id: string;
  name: string;
  tracks: Track[];
  createdAt: number;
}
