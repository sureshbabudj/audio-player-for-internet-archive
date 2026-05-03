import { registerWebModule, NativeModule } from 'expo';

import { ExpoAudioControlsModuleEvents } from './ExpoAudioControls.types';

class ExpoAudioControlsModule extends NativeModule<ExpoAudioControlsModuleEvents> {
  async setupRemoteControls(): Promise<void> {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('play', () => this.emit('onPlay'));
      navigator.mediaSession.setActionHandler('pause', () => this.emit('onPause'));
      navigator.mediaSession.setActionHandler('previoustrack', () => this.emit('onPreviousTrack'));
      navigator.mediaSession.setActionHandler('nexttrack', () => this.emit('onNextTrack'));
    }
    console.log('Remote controls setup requested on web');
  }

  updateNowPlaying(metadata: {
    title: string;
    artist: string;
    album?: string;
    artworkUrl?: string;
    duration: number;
    position: number;
    isPlaying: boolean;
  }): void {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: metadata.title,
        artist: metadata.artist,
        album: metadata.album,
        artwork: metadata.artworkUrl ? [{ src: metadata.artworkUrl }] : [],
      });
      navigator.mediaSession.playbackState = metadata.isPlaying ? 'playing' : 'paused';
      
      // Update position state if supported
      if ('setPositionState' in navigator.mediaSession) {
        try {
          (navigator.mediaSession as any).setPositionState({
            duration: metadata.duration / 1000,
            playbackRate: 1.0,
            position: metadata.position / 1000,
          });
        } catch (e) {
          console.warn('Failed to set position state:', e);
        }
      }
    }
  }
}

export default registerWebModule(ExpoAudioControlsModule, 'ExpoAudioControls');
