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

export interface Collection {
  id: string;
  title: string;
  creator: string | null;
  thumbnail: string;
  tracks: ArchiveTrack[];
  addedAt: number;
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
  isBuffering: boolean;
  position: number;
  duration: number;
  volume: number;
  playbackSpeed: number;
  repeatMode: RepeatMode;
  isShuffled: boolean;
  shuffledIndices: number[];
  shufflePointer: number;
  currentTrack: ArchiveTrack | null;
  queue: ArchiveTrack[];
  originalQueue: ArchiveTrack[];
  queueTitle: string;
  currentIndex: number;
  sleepTimer: number | null;
  sleepTimerEndTime: number | null;
}
