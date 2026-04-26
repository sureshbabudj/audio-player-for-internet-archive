import ExpoModulesCore
import MediaPlayer

public class ExpoAudioControlsModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoAudioControls")

    Events("onNextTrack", "onPreviousTrack")

    AsyncFunction("setupRemoteControls") {
      let commandCenter = MPRemoteCommandCenter.shared()

      // Next Track Command
      commandCenter.nextTrackCommand.isEnabled = true
      commandCenter.nextTrackCommand.addTarget { [weak self] event in
        self?.sendEvent("onNextTrack")
        return .success
      }

      // Previous Track Command
      commandCenter.previousTrackCommand.isEnabled = true
      commandCenter.previousTrackCommand.addTarget { [weak self] event in
        self?.sendEvent("onPreviousTrack")
        return .success
      }
    }
  }
}
