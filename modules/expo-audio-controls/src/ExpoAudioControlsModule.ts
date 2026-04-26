import { NativeModule, requireNativeModule } from 'expo';

import { ExpoAudioControlsModuleEvents } from './ExpoAudioControls.types';

declare class ExpoAudioControlsModule extends NativeModule<ExpoAudioControlsModuleEvents> {
  setupRemoteControls(): Promise<void>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<ExpoAudioControlsModule>('ExpoAudioControls');
