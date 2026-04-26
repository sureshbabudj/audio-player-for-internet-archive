import { ArchiveTrack } from "@/types";
import {
  createAudioPlaylist,
  preload,
  setIsAudioActiveAsync,
  type AudioPlayer,
  type AudioPlaylist,
} from "expo-audio";

export class AudioService {
  private static player: AudioPlayer | null = null;
  private static playlist: AudioPlaylist | null = null;
  private static subscriptions: { remove: () => void }[] = [];

  static async initializePlayer(
    track: ArchiveTrack,
    volume: number,
    playbackSpeed: number,
    onStatusUpdate: (status: any) => void,
    onFinished: () => void,
  ): Promise<any> {
    // Master Reset: Kill ALL native audio sessions to prevent double-play
    try {
      await setIsAudioActiveAsync(false);
      this.cleanup();
      await setIsAudioActiveAsync(true);
    } catch (e) {
      console.error("Master reset error:", e);
    }

    // CREATE NATIVE PLAYLIST (Native Queue)
    // We use a combined name for basic feedback since Playlist doesn't support full metadata
    const sources = [
      {
        uri: track.url,
        name: `${track.title} - ${track.creator}`,
      },
    ];

    // createAudioPlaylist takes an options object with sources
    const playlist = createAudioPlaylist({
      sources: sources,
      loop: "none",
    });

    this.playlist = playlist;
    playlist.volume = volume;
    playlist.playbackRate = playbackSpeed;

    // LISTENERS
    this.subscriptions.push(
      playlist.addListener("playlistStatusUpdate", (status: any) => {
        onStatusUpdate({
          playing: status.playing,
          isBuffering: status.isBuffering,
          isLoaded: status.isLoaded,
          currentTime: status.currentTime,
          duration: status.duration,
        });

        if (status.didJustFinish) {
          onFinished();
        }
      }),
    );

    playlist.play();
    return playlist;
  }

  static getPlayer() {
    return this.player || this.playlist;
  }

  static cleanup() {
    if (this.player) {
      try {
        this.player.setActiveForLockScreen(false);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (e) {}
      this.player.remove();
      this.player = null;
    }
    if (this.playlist) {
      this.playlist.destroy();
      this.playlist = null;
    }
    this.subscriptions.forEach((sub) => sub.remove());
    this.subscriptions = [];
  }

  /**
   * Preload the next track to ensure background transition works
   */
  static preloadNext(track: ArchiveTrack) {
    if (track?.url) {
      preload(track.url);
    }
  }
}
