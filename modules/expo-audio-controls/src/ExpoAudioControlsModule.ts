import { NativeModule, requireNativeModule } from 'expo';

import { ExpoAudioControlsModuleEvents } from './ExpoAudioControls.types';

declare class ExpoAudioControlsModule extends NativeModule<ExpoAudioControlsModuleEvents> {
  setupRemoteControls(): Promise<void>;
  updateNowPlaying(metadata: {
    title: string;
    artist: string;
    album?: string;
    artworkUrl?: string;
    duration: number;
    position: number;
    isPlaying: boolean;
  }): void;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<ExpoAudioControlsModule>('ExpoAudioControls');
