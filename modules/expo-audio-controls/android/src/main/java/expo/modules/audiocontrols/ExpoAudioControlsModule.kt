package expo.modules.audiocontrols

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
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
      }
    }
  }

  override fun definition() = ModuleDefinition {
    Name("ExpoAudioControls")

    Events("onNextTrack", "onPreviousTrack")

    OnCreate {
      val context = appContext.reactContext ?: return@OnCreate
      val filter = IntentFilter().apply {
        addAction("expo.modules.audiocontrols.NEXT_TRACK")
        addAction("expo.modules.audiocontrols.PREV_TRACK")
      }
      if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.TIRAMISU) {
        context.registerReceiver(receiver, filter, Context.RECEIVER_NOT_EXPORTED)
      } else {
        context.registerReceiver(receiver, filter)
      }
    }

    OnDestroy {
      val context = appContext.reactContext ?: return@OnDestroy
      try {
        context.unregisterReceiver(receiver)
      } catch (e: Exception) {
        // Ignored
      }
    }

    AsyncFunction("setupRemoteControls") {
      // Android MediaSession is typically handled by the audio player library (expo-audio)
      // This local module intercepts the intents broadcasted by patched expo-audio.
    }
  }
}
