package expo.modules.audiocontrols

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ExpoAudioControlsModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoAudioControls")

    Events("onNextTrack", "onPreviousTrack")

    AsyncFunction("setupRemoteControls") {
      // Android MediaSession is typically handled by the audio player library (expo-audio)
      // This local module can be extended here if advanced Android customizations are needed.
      // For now, we provide the definition to avoid JS errors.
    }
  }
}
