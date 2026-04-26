import { ArchiveTrack } from "@/types";
import {
  createAudioPlayer,
  setAudioModeAsync,
  type AudioPlayer,
} from "expo-audio";

// Configure audio session for background play
setAudioModeAsync({
  playsInSilentMode: true,
  shouldPlayInBackground: true,
  interruptionMode: "doNotMix",
}).catch(console.error);

export class AudioService {
  private static player: AudioPlayer | null = null;
  private static statusSubscription: { remove: () => void } | null = null;

  static async initializePlayer(
    track: ArchiveTrack,
    volume: number,
    playbackSpeed: number,
    onStatusUpdate: (status: any) => void,
    onFinished: () => void
  ): Promise<AudioPlayer> {
    // Clean up existing player
    this.cleanup();

    const player = createAudioPlayer(
      { uri: track.url },
      {
        updateInterval: 250,
        preferredForwardBufferDuration: 30,
        keepAudioSessionActive: true,
      }
    );

    // Set lockscreen/Control Center metadata
    player.setActiveForLockScreen(true, {
      title: track.title,
      artist: track.creator,
      artworkUrl: `https://archive.org/services/img/${track.identifier}`,
    });

    player.volume = volume;
    player.setPlaybackRate(playbackSpeed);

    this.statusSubscription = player.addListener("playbackStatusUpdate", (status) => {
      onStatusUpdate(status);
      if (status.didJustFinish) {
        onFinished();
      }
    });

    this.player = player;
    return player;
  }

  static cleanup() {
    if (this.player) {
      this.player.pause();
      if (this.statusSubscription) {
        this.statusSubscription.remove();
        this.statusSubscription = null;
      }
      this.player.remove();
      this.player = null;
    }
  }

  static getPlayer() {
    return this.player;
  }
}
