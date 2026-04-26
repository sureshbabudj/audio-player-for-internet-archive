import { registerWebModule, NativeModule } from 'expo';

import { ExpoAudioControlsModuleEvents } from './ExpoAudioControls.types';

class ExpoAudioControlsModule extends NativeModule<ExpoAudioControlsModuleEvents> {
  async setupRemoteControls(): Promise<void> {
    // Web implementation of remote controls (Media Session API) can be added here
    if ('mediaSession' in navigator) {
      // Basic setup to avoid errors
    }
    console.log('Remote controls setup requested on web');
  }
}

export default registerWebModule(ExpoAudioControlsModule, 'ExpoAudioControls');
