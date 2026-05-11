export interface ArchiveTrack {
  id: string;
  identifier: string;
  title: string;
  creator: string | null;
  description?: string;
  duration?: number;
  url: string;
  thumbnail?: string;
  date?: string;
  collection?: string[];
  fileName: string;
}

export interface ArchiveItem {
  identifier: string;
  title: string;
  creator: string | null;
  description?: string;
  thumbnail?: string;
  date?: string;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  tracks: ArchiveTrack[];
  createdAt: number;
  color: string;
  icon: string;
}

export type RepeatMode = "off" | "one" | "all";

export interface AudioState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  shuffleMode: boolean;
  repeatMode: RepeatMode;
  currentTrack: ArchiveTrack | null;
  tracksList: ArchiveTrack[];
}
