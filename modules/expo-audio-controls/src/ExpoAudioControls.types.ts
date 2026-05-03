export type ChangeEventPayload = {
  value: string;
};

export type ExpoAudioControlsModuleEvents = {
  onChange: (params: ChangeEventPayload) => void;
  onNextTrack: () => void;
  onPreviousTrack: () => void;
  onPlay: () => void;
  onPause: () => void;
};

export type ExpoAudioControlsViewProps = {
  url: string;
  onLoad: (event: { nativeEvent: { url: string } }) => void;
};
