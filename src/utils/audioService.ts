import { ArchiveTrack } from "@/types";
import {
  createAudioPlaylist,
  setAudioModeAsync,
  type AudioPlaylist,
} from "expo-audio";

// Configure audio session for background play
setAudioModeAsync({
  playsInSilentMode: true,
  shouldPlayInBackground: true,
  interruptionMode: "doNotMix",
}).catch(console.error);

export class AudioService {
  private static playlist: AudioPlaylist | null = null;
  private static subscriptions: { remove: () => void }[] = [];

  static async initializePlaylist(
    tracks: ArchiveTrack[],
    initialIndex: number,
    volume: number,
    playbackSpeed: number,
    onStatusUpdate: (status: any) => void,
    onTrackChange: (index: number) => void
  ): Promise<AudioPlaylist> {
    this.cleanup();

    // In expo-audio, metadata for playlists is attached directly to the sources
    const sources = tracks.map(t => ({
      uri: t.url,
      metadata: {
        title: t.title,
        artist: t.creator,
        artworkUrl: `https://archive.org/services/img/${t.identifier}`,
      }
    }));

    const playlist = createAudioPlaylist({
      sources,
    });

    this.playlist = playlist;
    playlist.volume = volume;
    playlist.playbackRate = playbackSpeed;
    
    // Set initial track
    if (initialIndex > 0) {
      playlist.skipTo(initialIndex);
    }

    // Listeners
    this.subscriptions.push(
      playlist.addListener("playlistStatusUpdate", (status) => {
        onStatusUpdate(status);
      })
    );

    this.subscriptions.push(
      playlist.addListener("trackChanged", (data) => {
        onTrackChange(data.currentIndex);
      })
    );

    return playlist;
  }

  static cleanup() {
    if (this.playlist) {
      this.playlist.pause();
      this.subscriptions.forEach((s) => s.remove());
      this.subscriptions = [];
      this.playlist.destroy();
      this.playlist = null;
    }
  }

  static getPlaylist() {
    return this.playlist;
  }
}
