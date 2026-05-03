import { requireNativeView } from 'expo';
import * as React from 'react';

import { ExpoAudioControlsViewProps } from './ExpoAudioControls.types';

const NativeView: React.ComponentType<ExpoAudioControlsViewProps> =
  requireNativeView('ExpoAudioControls');

export default function ExpoAudioControlsView(props: ExpoAudioControlsViewProps) {
  return <NativeView {...props} />;
}
