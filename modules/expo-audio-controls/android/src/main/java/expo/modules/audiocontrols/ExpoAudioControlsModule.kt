package expo.modules.audiocontrols

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Build
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ExpoAudioControlsModule : Module() {
  private val receiver = object : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
      when (intent.action) {
        "expo.modules.audiocontrols.NEXT_TRACK" -> {
          this@ExpoAudioControlsModule.sendEvent("onNextTrack")
        }
        "expo.modules.audiocontrols.PREV_TRACK" -> {
          this@ExpoAudioControlsModule.sendEvent("onPreviousTrack")
        }
        "expo.modules.audiocontrols.PLAY" -> {
          this@ExpoAudioControlsModule.sendEvent("onPlay")
        }
        "expo.modules.audiocontrols.PAUSE" -> {
          this@ExpoAudioControlsModule.sendEvent("onPause")
        }
      }
    }
  }

  override fun definition() = ModuleDefinition {
    Name("ExpoAudioControls")

    Events("onNextTrack", "onPreviousTrack", "onPlay", "onPause")

    OnCreate {
      val context = appContext.reactContext ?: return@OnCreate
      
      val filter = IntentFilter().apply {
        addAction("expo.modules.audiocontrols.NEXT_TRACK")
        addAction("expo.modules.audiocontrols.PREV_TRACK")
        addAction("expo.modules.audiocontrols.PLAY")
        addAction("expo.modules.audiocontrols.PAUSE")
      }
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        context.registerReceiver(receiver, filter, Context.RECEIVER_NOT_EXPORTED)
      } else {
        context.registerReceiver(receiver, filter)
      }
    }

    OnDestroy {
      val context = appContext.reactContext
      try {
        context?.unregisterReceiver(receiver)
      } catch (e: Exception) {}
    }

    AsyncFunction("setupRemoteControls") {
      // Managed natively by expo-audio
    }

    Function("updateNowPlaying") { metadata: Map<String, Any> ->
      // Managed natively by expo-audio
    }
  }
}
