import ExpoModulesCore
import MediaPlayer
import AVFoundation

public class ExpoAudioControlsModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoAudioControls")

    Events("onNextTrack", "onPreviousTrack", "onPlay", "onPause")

    OnCreate {
      setupInterruptionObserver()
    }

    AsyncFunction("setupRemoteControls") {
      let commandCenter = MPRemoteCommandCenter.shared()

      // Clear existing targets to avoid duplicates and conflicts
      commandCenter.playCommand.removeTarget(nil)
      commandCenter.pauseCommand.removeTarget(nil)
      commandCenter.nextTrackCommand.removeTarget(nil)
      commandCenter.previousTrackCommand.removeTarget(nil)
      commandCenter.togglePlayPauseCommand.removeTarget(nil)

      // Play Command
      commandCenter.playCommand.isEnabled = true
      commandCenter.playCommand.addTarget { [weak self] event in
        self?.sendEvent("onPlay")
        return .success
      }

      // Pause Command
      commandCenter.pauseCommand.isEnabled = true
      commandCenter.pauseCommand.addTarget { [weak self] event in
        self?.sendEvent("onPause")
        return .success
      }

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
      
      // Toggle Play/Pause (often used by headphones)
      commandCenter.togglePlayPauseCommand.isEnabled = true
      commandCenter.togglePlayPauseCommand.addTarget { [weak self] event in
        // We decide based on current state in JS, but we can emit a generic event or just toggle
        self?.sendEvent("onPlay") // For simplicity, trigger a play/pause toggle in JS
        return .success
      }
    }

    Function("updateNowPlaying") { (metadata: [String: Any]) in
      let infoCenter = MPNowPlayingInfoCenter.default()
      var nowPlayingInfo = infoCenter.nowPlayingInfo ?? [String: Any]()

      if let title = metadata["title"] as? String {
        nowPlayingInfo[MPMediaItemPropertyTitle] = title
      }
      if let artist = metadata["artist"] as? String {
        nowPlayingInfo[MPMediaItemPropertyArtist] = artist
      }
      if let album = metadata["album"] as? String {
        nowPlayingInfo[MPMediaItemPropertyAlbumTitle] = album
      }
      if let duration = metadata["duration"] as? Double {
        nowPlayingInfo[MPMediaItemPropertyPlaybackDuration] = duration / 1000.0
      }
      if let position = metadata["position"] as? Double {
        nowPlayingInfo[MPNowPlayingInfoPropertyElapsedPlaybackTime] = position / 1000.0
      }
      
      let isPlaying = metadata["isPlaying"] as? Bool ?? false
      nowPlayingInfo[MPNowPlayingInfoPropertyPlaybackRate] = isPlaying ? 1.0 : 0.0

      if #available(iOS 13.0, *) {
        infoCenter.playbackState = isPlaying ? .playing : .paused
      }

      if let artworkUrlString = metadata["artworkUrl"] as? String, let artworkUrl = URL(string: artworkUrlString) {
        URLSession.shared.dataTask(with: artworkUrl) { data, response, error in
          if let data = data, let image = UIImage(data: data) {
            let artwork = MPMediaItemArtwork(boundsSize: image.size) { _ in image }
            DispatchQueue.main.async {
              var updatedInfo = infoCenter.nowPlayingInfo ?? [String: Any]()
              updatedInfo[MPMediaItemPropertyArtwork] = artwork
              infoCenter.nowPlayingInfo = updatedInfo
            }
          }
        }.resume()
      }

      infoCenter.nowPlayingInfo = nowPlayingInfo
    }
  }

  private func setupInterruptionObserver() {
    NotificationCenter.default.addObserver(
      self,
      selector: #selector(handleInterruption),
      name: AVAudioSession.interruptionNotification,
      object: AVAudioSession.sharedInstance()
    )
  }

  @objc private func handleInterruption(notification: Notification) {
    guard let userInfo = notification.userInfo,
          let typeValue = userInfo[AVAudioSessionInterruptionTypeKey] as? UInt,
          let type = AVAudioSession.InterruptionType(rawValue: typeValue) else {
      return
    }

    if type == .began {
      sendEvent("onPause")
    } else if type == .ended {
      if let optionsValue = userInfo[AVAudioSessionInterruptionOptionKey] as? UInt {
        let options = AVAudioSession.InterruptionOptions(rawValue: optionsValue)
        if options.contains(.shouldResume) {
          sendEvent("onPlay")
        }
      }
    }
  }
}
