import * as React from 'react';

import { ExpoAudioControlsViewProps } from './ExpoAudioControls.types';

export default function ExpoAudioControlsView(props: ExpoAudioControlsViewProps) {
  return (
    <div>
      <iframe
        style={{ flex: 1 }}
        src={props.url}
        onLoad={() => props.onLoad({ nativeEvent: { url: props.url } })}
      />
    </div>
  );
}
