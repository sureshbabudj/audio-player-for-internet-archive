// Reexport the native module. On web, it will be resolved to ExpoAudioControlsModule.web.ts
// and on native platforms to ExpoAudioControlsModule.ts
export { default } from './src/ExpoAudioControlsModule';
export { default as ExpoAudioControlsView } from './src/ExpoAudioControlsView';
export * from  './src/ExpoAudioControls.types';
