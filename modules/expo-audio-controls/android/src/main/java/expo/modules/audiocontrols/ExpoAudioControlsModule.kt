package expo.modules.audiocontrols

import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.ServiceConnection
import android.os.Build
import android.os.IBinder
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ExpoAudioControlsModule : Module() {
  private var service: ExpoAudioControlsService? = null
  private var isBound = false
  private var pendingMetadata: Map<String, Any>? = null

  private val connection = object : ServiceConnection {
    override fun onServiceConnected(className: ComponentName, binder: IBinder) {
      val localBinder = binder as ExpoAudioControlsService.LocalBinder
      service = localBinder.getService()
      service?.callback = object : ExpoAudioControlsService.ControlsCallback {
        override fun onPlay() { this@ExpoAudioControlsModule.sendEvent("onPlay") }
        override fun onPause() { this@ExpoAudioControlsModule.sendEvent("onPause") }
        override fun onNext() { this@ExpoAudioControlsModule.sendEvent("onNextTrack") }
        override fun onPrevious() { this@ExpoAudioControlsModule.sendEvent("onPreviousTrack") }
        override fun onSeekForward() { this@ExpoAudioControlsModule.sendEvent("onSeekForward") }
        override fun onSeekBackward() { this@ExpoAudioControlsModule.sendEvent("onSeekBackward") }
      }
      
      pendingMetadata?.let { service?.updateNowPlaying(it) }
      pendingMetadata = null
      isBound = true
    }

    override fun onServiceDisconnected(arg0: ComponentName) {
      isBound = false
      service = null
    }
  }

  override fun definition() = ModuleDefinition {
    Name("ExpoAudioControls")

    Events("onNextTrack", "onPreviousTrack", "onPlay", "onPause", "onSeekForward", "onSeekBackward")

    AsyncFunction("setupRemoteControls") {
      appContext.reactContext?.let { context ->
        val intent = Intent(context, ExpoAudioControlsService::class.java)
        
        // Start the service to ensure it runs even if unbound
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
          context.startForegroundService(intent)
        } else {
          context.startService(intent)
        }
        
        // Bind to it
        context.bindService(intent, connection, Context.BIND_AUTO_CREATE)
      }
    }

    Function("updateNowPlaying") { metadata: Map<String, Any> ->
      if (isBound && service != null) {
        service?.updateNowPlaying(metadata)
      } else {
        pendingMetadata = metadata
      }
    }

    Function("removeControls") {
      appContext.reactContext?.let { context ->
        if (isBound) {
          try {
            context.unbindService(connection)
          } catch (e: Exception) {
            // Ignore
          }
          isBound = false
        }
        val intent = Intent(context, ExpoAudioControlsService::class.java)
        context.stopService(intent)
      }
      service?.removeControls()
      service = null
    }
  }
}
