import { registerWebModule, NativeModule } from 'expo';

import { ChangeEventPayload } from './ExpoAudioControls.types';

type ExpoAudioControlsModuleEvents = {
  onChange: (params: ChangeEventPayload) => void;
}

class ExpoAudioControlsModule extends NativeModule<ExpoAudioControlsModuleEvents> {
  PI = Math.PI;
  async setValueAsync(value: string): Promise<void> {
    this.emit('onChange', { value });
  }
  hello() {
    return 'Hello world! 👋';
  }
};

export default registerWebModule(ExpoAudioControlsModule, 'ExpoAudioControlsModule');
