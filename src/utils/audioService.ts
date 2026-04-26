import { ArchiveTrack } from "@/types";
import {
  createAudioPlayer,
  preload,
  setIsAudioActiveAsync,
  type AudioPlayer,
} from "expo-audio";

export class AudioService {
  private static player: AudioPlayer | null = null;
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

    // CREATE NATIVE PLAYER (Single track)
    const player = createAudioPlayer(track.url, {
      updateInterval: 500,
      keepAudioSessionActive: true,
    });

    this.player = player;
    player.volume = volume;
    player.setPlaybackRate(playbackSpeed);

    // LISTENERS
    this.subscriptions.push(
      player.addListener("playbackStatusUpdate", (status: any) => {
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

    player.play();
    return player;
  }

  static getPlayer() {
    return this.player;
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
